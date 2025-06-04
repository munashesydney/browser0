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
  const [messages, setMessages] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = 'Browser0 - AI Browser Automation';
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', '/favicon.ico');
    }
  }, []);

  const handleInitialMessage = (message: string) => {
    setMessages([message]);
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <GradientBackground />
      <Header showChat={showChat} />
      {showChat && (
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      )}
      {!showChat ? (
        <main>
          <Hero onSubmit={handleInitialMessage} />
        </main>
      ) : (
        <div className="flex h-[calc(100vh-8rem)] pt-16 animate-fadeIn">
          <ChatArea messages={messages} setMessages={setMessages} />
          <BrowserPreview />
        </div>
      )}
      <Footer />
    </div>
  );
} 