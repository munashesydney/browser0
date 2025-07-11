import { Pool } from "pg";
import { createBrowser } from "~/utils/browserize.server";

// Create a single connection pool for the whole app
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Robust database schema setup
async function ensureTablesExist() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Setting up database schema...');
    
    // Create browsers table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS browsers (
        id SERIAL PRIMARY KEY,
        browser_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        status TEXT,
        memory INTEGER,
        cpu INTEGER,
        uptime TEXT,
        vnc_url TEXT,
        novnc_url TEXT,
        debug_url TEXT,
        mcp_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✓ Browsers table created/verified');

    // Check if old chats table exists and has browser columns
    const checkOldChats = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'chats' AND column_name IN ('browser_status', 'vnc_url', 'mcp_url');
    `);
    
    if (checkOldChats.rows.length > 0) {
      console.log('Found old chats table with browser columns, migrating...');
      
      // Create new browsers table from old chats data
      await client.query(`
        INSERT INTO browsers (browser_id, name, status, memory, cpu, uptime, vnc_url, novnc_url, debug_url, mcp_url, created_at)
        SELECT 
          COALESCE(browser_id, 'browser_' || id::text) as browser_id,
          COALESCE(title, 'Browser ' || id::text) as name,
          COALESCE(browser_status, 'unknown') as status,
          COALESCE(browser_memory, 512) as memory,
          COALESCE(browser_cpu, 0) as cpu,
          COALESCE(browser_uptime, '0s') as uptime,
          vnc_url,
          novnc_url,
          debug_url,
          mcp_url,
          created_at
        FROM chats 
        WHERE browser_id IS NOT NULL
        ON CONFLICT (browser_id) DO NOTHING;
      `);
      
      // Drop old columns from chats table
      await client.query(`
        ALTER TABLE chats
        DROP COLUMN IF EXISTS browser_status,
        DROP COLUMN IF EXISTS browser_memory,
        DROP COLUMN IF EXISTS browser_cpu,
        DROP COLUMN IF EXISTS browser_uptime,
        DROP COLUMN IF EXISTS vnc_url,
        DROP COLUMN IF EXISTS novnc_url,
        DROP COLUMN IF EXISTS debug_url,
        DROP COLUMN IF EXISTS mcp_url;
      `);
      
      // Update chats table to reference browsers properly
      await client.query(`
        ALTER TABLE chats
        ADD COLUMN IF NOT EXISTS browser_db_id INTEGER;
      `);
      
      // Link chats to browsers
      await client.query(`
        UPDATE chats 
        SET browser_db_id = browsers.id
        FROM browsers
        WHERE chats.browser_id = browsers.browser_id;
      `);
      
      // Drop old browser_id column and rename new one
      await client.query(`
        ALTER TABLE chats
        DROP COLUMN IF EXISTS browser_id;
      `);
      
      await client.query(`
        ALTER TABLE chats
        RENAME COLUMN browser_db_id TO browser_id;
      `);
      
      console.log('✓ Migrated old chats data to new structure');
    } else {
      console.log('No old chats table found, creating fresh structure...');
    }

    // Create/update chats table with proper structure
    await client.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        title TEXT,
        browser_id INTEGER REFERENCES browsers(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    
    // Add browser_id column if it doesn't exist
    await client.query(`
      ALTER TABLE chats
      ADD COLUMN IF NOT EXISTS browser_id INTEGER REFERENCES browsers(id) ON DELETE CASCADE;
    `);
    
    console.log('✓ Chats table created/updated');

    // Create messages table with chat relationship
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        progress_data JSONB
      );
    `);

    // Add missing columns to messages table
    await client.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE;
    `);

    await client.query(`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS progress_data JSONB;
    `);
    
    console.log('✓ Messages table created/updated');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✓ Database schema setup completed successfully');
    
  } catch (err) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error("Failed to setup database schema:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Initialize database schema
ensureTablesExist().catch(console.error);

// Browser management functions
export async function createBrowserRecord(name: string, initialContent?: string, role = "user") {
  try {
    // Call Browserize API to create browser
    const browser = await createBrowser(name);
    
    // Insert browser into database
    const { rows } = await pool.query(
      `INSERT INTO browsers (browser_id, name, status, memory, cpu, uptime, vnc_url, novnc_url, debug_url, mcp_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        browser.id,
        browser.name,
        browser.status,
        browser.memory,
        browser.cpu,
        browser.uptime,
        browser.vnc_url,
        browser.novnc_url,
        browser.debug_url,
        browser.mcp_url,
      ]
    );
    
    const browserId: number = rows[0].id;
    
    // Create a default chat for this browser
    const chatId = await createChatForBrowser(browserId, initialContent, role);
    
    return { browserId, chatId };
  } catch (err) {
    console.error("Failed to create browser", err);
    throw err;
  }
}

export async function createChatForBrowser(browserId: number, initialContent?: string, role = "user") {
  const { rows } = await pool.query(
    "INSERT INTO chats (browser_id) VALUES ($1) RETURNING id",
    [browserId]
  );
  const chatId: number = rows[0].id;

  if (initialContent) {
    await createMessage(chatId, initialContent, role);
  }
  return chatId;
}

export async function getBrowsers() {
  const { rows } = await pool.query(`
    SELECT b.id,
           b.browser_id,
           b.name,
           b.status,
           b.memory,
           b.cpu,
           b.uptime,
           b.vnc_url,
           b.novnc_url,
           b.debug_url,
           b.mcp_url,
           b.created_at,
           COUNT(c.id) as chat_count,
           COALESCE(
             (SELECT content FROM messages m 
              JOIN chats c2 ON m.chat_id = c2.id 
              WHERE c2.browser_id = b.id 
              ORDER BY m.id DESC LIMIT 1),
             ''
           ) AS last_message,
           COALESCE(
             (SELECT m.created_at FROM messages m 
              JOIN chats c2 ON m.chat_id = c2.id 
              WHERE c2.browser_id = b.id 
              ORDER BY m.id DESC LIMIT 1),
             b.created_at
           ) AS last_message_time
    FROM browsers b
    LEFT JOIN chats c ON b.id = c.browser_id
    GROUP BY b.id, b.browser_id, b.name, b.status, b.memory, b.cpu, b.uptime, 
             b.vnc_url, b.novnc_url, b.debug_url, b.mcp_url, b.created_at
    ORDER BY last_message_time DESC;
  `);
  return rows as Array<{
    id: number;
    browser_id: string;
    name: string;
    status: string;
    memory: number;
    cpu: number;
    uptime: string;
    vnc_url: string;
    novnc_url: string;
    debug_url: string;
    mcp_url: string;
    created_at: string;
    chat_count: number;
    last_message: string;
    last_message_time: string;
  }>;
}

export async function getBrowserById(browserId: number) {
  const { rows } = await pool.query(
    "SELECT * FROM browsers WHERE id = $1",
    [browserId]
  );
  return rows[0] || null;
}

export async function updateBrowserStatus(browserId: number, status: string) {
  try {
    const { rows } = await pool.query(
      "UPDATE browsers SET status = $1 WHERE id = $2 RETURNING *",
      [status, browserId]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("Failed to update browser status", err);
    throw err;
  }
}

export async function deleteBrowserRecord(browserId: number) {
  try {
    // Delete messages for all chats belonging to this browser
    await pool.query(`
      DELETE FROM messages 
      WHERE chat_id IN (
        SELECT id FROM chats WHERE browser_id = $1
      )
    `, [browserId]);
    
    // Delete chats for this browser
    await pool.query(
      "DELETE FROM chats WHERE browser_id = $1",
      [browserId]
    );
    
    // Delete the browser record
    const { rows } = await pool.query(
      "DELETE FROM browsers WHERE id = $1 RETURNING *",
      [browserId]
    );
    
    return rows[0] || null;
  } catch (err) {
    console.error("Failed to delete browser record", err);
    throw err;
  }
}

export async function getChatsForBrowser(browserId: number) {
  const { rows } = await pool.query(`
    SELECT c.id,
           c.title,
           c.created_at,
           COALESCE(
             (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1),
             ''
           ) AS last_message,
           COALESCE(
             (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1),
             c.created_at
           ) AS last_message_time
    FROM chats c
    WHERE c.browser_id = $1
    ORDER BY c.created_at DESC;
  `, [browserId]);
  return rows as Array<{
    id: number;
    title: string | null;
    created_at: string;
    last_message: string;
    last_message_time: string;
  }>;
}

// Legacy function for backward compatibility - will be removed
export async function createChat(initialContent?: string, role = "user") {
  // For backward compatibility, create a browser and chat
  const result = await createBrowserRecord(`Browser ${Date.now()}`, initialContent, role);
  return result.chatId;
}

export async function createMessage(chatId: number, content: string, role = "user", progressData?: any) {
  return pool.query(
    "INSERT INTO messages (chat_id, content, role, progress_data) VALUES ($1, $2, $3, $4)",
    [chatId, content, role, progressData ? JSON.stringify(progressData) : null]
  );
}

export async function getMessages(chatId: number, limit = 100) {
  const { rows } = await pool.query(
    "SELECT * FROM messages WHERE chat_id = $1 ORDER BY id ASC LIMIT $2",
    [chatId, limit]
  );
  return rows;
}

export async function getChats() {
  const { rows } = await pool.query(`
    SELECT c.id,
           c.title,
           c.created_at,
           COALESCE(
             (SELECT content FROM messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1),
             ''
           )       AS last_message,
           COALESCE(
             (SELECT created_at FROM messages m WHERE m.chat_id = c.id ORDER BY id DESC LIMIT 1),
             c.created_at
           )       AS last_message_time
    FROM chats c
    ORDER BY c.created_at DESC;
  `);
  return rows as Array<{
    id: number;
    title: string | null;
    created_at: string;
    last_message: string;
    last_message_time: string;
  }>;
}

// Get browser info for a specific chat
export async function getBrowserForChat(chatId: number) {
  const { rows } = await pool.query(`
    SELECT b.* FROM browsers b
    JOIN chats c ON b.id = c.browser_id
    WHERE c.id = $1
  `, [chatId]);
  return rows[0] || null;
} 