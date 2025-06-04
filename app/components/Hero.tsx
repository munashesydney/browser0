import React from 'react';
import TextareaCard from './TextareaCard';

interface HeroProps {
  onSubmit: (message: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onSubmit }) => {
  return (
    <section className="min-h-screen pt-32 pb-16 px-6 flex flex-col items-center justify-center max-w-4xl mx-auto text-center">
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
        What do you want to automate?
      </h1>
      
      <p className="text-gray-400 text-lg mb-12">
        Prompt, run, and automate browser tasks with AI
      </p>

      <div className="w-full max-w-3xl">
        <TextareaCard onSubmit={onSubmit} />
      </div>
      
      <div className="mt-8 text-center space-y-6">
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm">
            Build a mobile app with Expo
          </button>
          <button className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm">
            Start a blog with Astro
          </button>
          <button className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm">
            Create a docs site with Vitepress
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm">
            Scaffold UI with shadcn
          </button>
          <button className="px-4 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors text-sm">
            Draft a presentation with Slidev
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero; 