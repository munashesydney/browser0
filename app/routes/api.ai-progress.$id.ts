import { type LoaderFunction } from "@remix-run/node";
import { eventStream, type SSEFunction } from "../utils/sse.server";

// Extend global type to include our progress senders
declare global {
  var aiProgressSenders: Map<string, SSEFunction> | undefined;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const chatId = params.id;
  
  if (!chatId) {
    throw new Response("Chat ID is required", { status: 400 });
  }

  return eventStream(request.signal, function setup(send: SSEFunction) {
    // Store the send function globally for this chat
    // This will be used by the AI generation process to send updates
    if (typeof global !== 'undefined') {
      global.aiProgressSenders = global.aiProgressSenders || new Map();
      global.aiProgressSenders.set(chatId, send);
      
      // Send initial connection message
      send({ type: 'connected', chatId });
    }

    return function cleanup() {
      if (typeof global !== 'undefined' && global.aiProgressSenders) {
        global.aiProgressSenders.delete(chatId);
      }
    };
  });
}; 