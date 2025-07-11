import React from 'react';
import { Bot, CheckCircle, AlertCircle, Clock, Zap, Globe, Camera, MousePointer, Type, Eye, LucideIcon } from 'lucide-react';

interface SavedProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

interface SavedProgressData {
  steps: SavedProgressStep[];
  iterations: number;
  totalTime: number;
  completedSteps: number;
  totalSteps: number;
}

interface SavedProgressDisplayProps {
  progressData: SavedProgressData;
}

const toolIcons: Record<string, LucideIcon> = {
  browser_navigate: Globe,
  browser_take_screenshot: Camera,
  browser_click: MousePointer,
  browser_type: Type,
  browser_snapshot: Eye,
  browser_wait_for: Clock,
  default: Zap,
};

const getToolIcon = (toolName: string) => {
  const IconComponent = toolIcons[toolName] || toolIcons.default;
  return IconComponent;
};

const getToolDescription = (toolName: string, step: SavedProgressStep) => {
  if (step.description) return step.description;
  
  // Fallback descriptions
  switch (toolName) {
    case 'browser_navigate':
      return 'Navigated to webpage';
    case 'browser_take_screenshot':
      return 'Captured page screenshot';
    case 'browser_click':
      return 'Clicked element';
    case 'browser_type':
      return 'Typed text';
    case 'browser_snapshot':
      return 'Analyzed page structure';
    case 'browser_wait_for':
      return 'Waited for page';
    default:
      return `Executed ${toolName}`;
  }
};

const SavedProgressDisplay: React.FC<SavedProgressDisplayProps> = ({ progressData }) => {
  const { steps, iterations, totalTime, completedSteps, totalSteps } = progressData;
  
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="mb-3 opacity-75">
      {/* Compact Progress Summary */}
      <div className="relative overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/30 shadow-sm">
        
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            {/* AI Icon */}
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500/10">
              <Bot size={14} className="text-blue-400" />
            </div>
            
            {/* Status Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-300 text-xs">AI Browser Automation</span>
                <CheckCircle size={12} className="text-green-400" />
              </div>
              <p className="text-xs text-gray-400">
                {iterations} iteration{iterations !== 1 ? 's' : ''} • {completedSteps}/{totalSteps} tools • {formatTime(totalTime)}
              </p>
            </div>

            {/* Success Badge */}
            <div className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-xs font-medium">
              Complete
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-800/50 rounded-full h-1 mb-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-1 rounded-full"
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 100}%` }}
            />
          </div>

          {/* Steps Summary */}
          <div className="space-y-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-xs">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-800/50">
                  {step.status === 'completed' ? (
                    <CheckCircle size={10} className="text-green-400" />
                  ) : step.status === 'error' ? (
                    <AlertCircle size={10} className="text-red-400" />
                  ) : (
                    React.createElement(getToolIcon(step.name), { 
                      size: 10, 
                      className: "text-gray-400" 
                    })
                  )}
                </div>
                <span className={`flex-1 ${
                  step.status === 'completed' ? 'text-gray-400' : 
                  step.status === 'error' ? 'text-red-400' : 
                  'text-gray-500'
                }`}>
                  {getToolDescription(step.name, step)}
                </span>
                {step.startTime && step.endTime && (
                  <span className="text-gray-500 text-xs">
                    {formatTime(step.endTime - step.startTime)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedProgressDisplay; 