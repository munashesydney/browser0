import React, { useEffect, useState } from 'react';
import type { MetaFunction } from '@remix-run/node';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import ChatArea from '../components/ChatArea';
import BrowserPreview from '../components/BrowserPreview';
import Sidebar from '../components/Sidebar';

export const meta: MetaFunction = () => {
  return [
    { title: 'Browser0 - AI Browser Automation' },
    { name: 'description', content: 'Prompt, run, and automate browser tasks with AI' },
  ];
};

export default function Index() {
  const [messages, setMessages] = useState<Array<{
    content: string;
    role: string;
    progress_data?: any;
  }>>([]);
  const [showChat, setShowChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatId, setChatId] = useState<number | null>(null);
  const [browserId, setBrowserId] = useState<number | null>(null);
  const [browserStatus, setBrowserStatus] = useState<string | null>(null);
  const [vncUrl, setVncUrl] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    document.title = 'Browser0 - AI Browser Automation';
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', '/favicon.ico');
    }
  }, []);

  // Legacy function for backward compatibility - creating new browser + chat
  const handleInitialMessage = async (message: string, mode: 'ask' | 'agent' = 'agent') => {
    // Immediately show chat UI
    setMessages([{content: message, role: 'user'}]);
    setShowChat(true);

    // create chat and save first message (async) - this uses the legacy createChat function
    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message, role: 'user' }),
    })
      .then(async (res) => res.json())
      .then(async (data: { chatId?: number; novnc_url?: string }) => {
        if (data.chatId) {
          setChatId(data.chatId);
          
          // Generate AI response for the first message
          setMessages(prev => [...prev, {content: 'TYPING_INDICATOR', role: 'assistant'}]);
          try {
            const aiResponse = await fetch(`/api/chat/${data.chatId}/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ mode }),
            });
            const aiData = await aiResponse.json();
            if (aiData.response) {
              // After AI response, reload messages from database to get progress data
              const messagesResponse = await fetch(`/api/messages?chatId=${data.chatId}`);
              const messagesData = await messagesResponse.json();
              if (messagesData.messages) {
                setMessages(messagesData.messages);
              }
            } else {
              setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
            }
          } catch (err) {
            console.error('Failed to generate AI response', err);
            setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
          }
        }
        if (data.novnc_url) setVncUrl(data.novnc_url);
      })
      .catch((err) => console.error('Failed to create chat', err));
  };

  // New function for browser selection from modal
  const handleBrowserSelect = async (browserId: number, message: string, mode: 'ask' | 'agent' = 'agent') => {
    // Immediately show chat UI
    setMessages([{content: message, role: 'user'}]);
    setShowChat(true);

    try {
      // Create new chat in the selected browser
      const chatResponse = await fetch(`/api/browsers/${browserId}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message, role: 'user' }),
      });
      const chatData = await chatResponse.json();
      
      if (chatData.chatId) {
        setChatId(chatData.chatId);
        setBrowserId(browserId);
        
        // Get browser info for VNC URL and status
        const browserResponse = await fetch(`/api/browsers/${browserId}`);
        const browserData = await browserResponse.json();
        if (browserData.browser?.novnc_url) {
          setVncUrl(browserData.browser.novnc_url);
        }
        if (browserData.browser?.status) {
          setBrowserStatus(browserData.browser.status);
        }
        
        // Generate AI response for the first message
        setMessages(prev => [...prev, {content: 'TYPING_INDICATOR', role: 'assistant'}]);
        try {
          const aiResponse = await fetch(`/api/chat/${chatData.chatId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }),
          });
          const aiData = await aiResponse.json();
          if (aiData.response) {
            // After AI response, reload messages from database to get progress data
            const messagesResponse = await fetch(`/api/messages?chatId=${chatData.chatId}`);
            const messagesData = await messagesResponse.json();
            if (messagesData.messages) {
              setMessages(messagesData.messages);
            }
          } else {
            setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
          }
        } catch (err) {
          console.error('Failed to generate AI response', err);
          setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
        }
      }
    } catch (err) {
      console.error('Failed to create chat in browser', err);
      setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
    }
  };

  // New function for creating a new browser from modal
  const handleCreateBrowser = async (name: string, message: string, mode: 'ask' | 'agent' = 'agent') => {
    // Immediately show chat UI
    setMessages([{content: message, role: 'user'}]);
    setShowChat(true);

    try {
      // Create new browser with initial message
      const browserResponse = await fetch('/api/browsers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content: message, role: 'user' }),
      });
      const browserData = await browserResponse.json();
      
      if (browserData.browserId && browserData.chatId) {
        setChatId(browserData.chatId);
        setBrowserId(browserData.browserId);
        
        // Get browser info for VNC URL and status
        const browserInfoResponse = await fetch(`/api/browsers/${browserData.browserId}`);
        const browserInfo = await browserInfoResponse.json();
        if (browserInfo.browser?.novnc_url) {
          setVncUrl(browserInfo.browser.novnc_url);
        }
        if (browserInfo.browser?.status) {
          setBrowserStatus(browserInfo.browser.status);
        }
        
        // Generate AI response for the first message
        setMessages(prev => [...prev, {content: 'TYPING_INDICATOR', role: 'assistant'}]);
        try {
          const aiResponse = await fetch(`/api/chat/${browserData.chatId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode }),
          });
          const aiData = await aiResponse.json();
          if (aiData.response) {
            // After AI response, reload messages from database to get progress data
            const messagesResponse = await fetch(`/api/messages?chatId=${browserData.chatId}`);
            const messagesData = await messagesResponse.json();
            if (messagesData.messages) {
              setMessages(messagesData.messages);
            }
          } else {
            setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
          }
        } catch (err) {
          console.error('Failed to generate AI response', err);
          setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
        }
      }
    } catch (err) {
      console.error('Failed to create browser', err);
      setMessages(prev => [...prev.slice(0, -1), {content: 'Sorry, I encountered an error.', role: 'assistant'}]);
    }
  };

  const loadChat = async (id: number) => {
    setIsChatLoading(true);
    setMessages([]);
    setVncUrl(null);
    setBrowserStatus(null);
    setShowChat(true);
    try {
      const res = await fetch(`/api/chat/${id}`);
      const data = (await res.json()) as any;
      
      // Load messages with progress data
      const messagesResponse = await fetch(`/api/messages?chatId=${id}`);
      const messagesData = await messagesResponse.json();
      if (messagesData.messages) {
        setMessages(messagesData.messages);
      }
      
      if (data.chat) {
        setChatId(id);
        // Set VNC URL and status from browser info
        if (data.browser?.novnc_url) {
          setVncUrl(data.browser.novnc_url);
          setBrowserId(data.browser.id);
        }
        if (data.browser?.status) {
          setBrowserStatus(data.browser.status);
        }
      }
    } catch (err) {
      console.error('Failed to load chat', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <GradientBackground />
      <Header showChat={showChat} />
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectChat={loadChat}
        />
      {!showChat ? (
        <main>
          <Hero 
            onSubmit={handleInitialMessage}
            onBrowserSelect={handleBrowserSelect}
            onCreateBrowser={handleCreateBrowser}
          />
        </main>
      ) : (
        <div className="flex h-[calc(100vh-8rem)] pt-16 animate-fadeIn">
          <ChatArea
            chatId={chatId}
            messages={messages}
            setMessages={setMessages}
          />
          <BrowserPreview 
            vncUrl={vncUrl} 
            browserStatus={browserStatus || undefined} 
            browserId={browserId || undefined} 
          />
        </div>
      )}
      <Footer />
    </div>
  );
} 