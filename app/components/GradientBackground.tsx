import React from 'react';

const GradientBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-[40%] left-[20%] w-[60%] h-[60%] bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-[120px]" />
      <div className="absolute -top-[30%] right-[10%] w-[40%] h-[40%] bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-[100px]" />
    </div>
  );
};

export default GradientBackground; 