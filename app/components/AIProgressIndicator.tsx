import React, { useState, useEffect } from 'react';
import { Bot, Loader2, CheckCircle, AlertCircle, Clock, Zap, Globe, Camera, MousePointer, Type, Eye, LucideIcon } from 'lucide-react';

interface AIProgressStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
  error?: string;
}

interface AIProgressIndicatorProps {
  chatId: number | null;
  isVisible: boolean;
  onComplete?: () => void;
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

const getToolDescription = (toolName: string, params?: any) => {
  switch (toolName) {
    case 'browser_navigate':
      return `Navigating to ${params?.url || 'webpage'}`;
    case 'browser_take_screenshot':
      return 'Capturing page screenshot';
    case 'browser_click':
      return `Clicking ${params?.element || 'element'}`;
    case 'browser_type':
      return `Typing "${params?.text || 'text'}"`;
    case 'browser_snapshot':
      return 'Analyzing page structure';
    case 'browser_wait_for':
      return `Waiting ${params?.time || 3} seconds`;
    default:
      return `Executing ${toolName}`;
  }
};

const AIProgressIndicator: React.FC<AIProgressIndicatorProps> = ({ chatId, isVisible, onComplete }) => {
  const [steps, setSteps] = useState<AIProgressStep[]>([]);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!chatId || !isVisible) return;

    const eventSource = new EventSource(`/api/ai-progress/${chatId}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'iteration_start':
          setCurrentIteration(data.iteration);
          setIsActive(true);
          break;
          
        case 'tool_start':
          setSteps(prev => [...prev, {
            id: data.toolId,
            name: data.toolName,
            description: getToolDescription(data.toolName, data.params),
            status: 'running',
            startTime: Date.now(),
          }]);
          break;
          
        case 'tool_complete':
          setSteps(prev => prev.map(step => 
            step.id === data.toolId ? {
              ...step,
              status: 'completed',
              endTime: Date.now(),
            } : step
          ));
          break;
          
        case 'tool_error':
          setSteps(prev => prev.map(step => 
            step.id === data.toolId ? {
              ...step,
              status: 'error',
              endTime: Date.now(),
              error: data.error,
            } : step
          ));
          break;
          
        case 'ai_complete':
          setIsActive(false);
          setTimeout(() => {
            setSteps([]);
            setCurrentIteration(0);
            onComplete?.();
          }, 2000);
          break;
      }
    };

    eventSource.onerror = () => {
      setIsActive(false);
    };

    return () => {
      eventSource.close();
    };
  }, [chatId, isVisible, onComplete]);

  if (!isVisible || steps.length === 0) return null;

  const runningStep = steps.find(step => step.status === 'running');
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;

  return (
    <div className="mb-4 animate-fadeIn">
      {/* Main Progress Card */}
      <div className="relative overflow-hidden rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 shadow-lg shadow-blue-500/20">
        
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 to-purple-400/5">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.1),transparent_50%),radial-gradient(circle_at_75%_75%,rgba(147,51,234,0.1),transparent_50%)] animate-pulse" />
        </div>
        
        <div className="relative p-4">
          <div className="flex items-center gap-3 mb-3">
            {/* AI Icon */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20">
              <Bot size={18} className="text-blue-400" />
            </div>
            
            {/* Status Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">AI Browser Automation</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full absolute" />
                </div>
              </div>
              <p className="text-sm text-blue-300 mt-1">
                Iteration {currentIteration} • {completedSteps}/{totalSteps} tools completed
              </p>
            </div>

            {/* Progress Percentage */}
            <div className="text-right">
              <div className="text-lg font-bold text-white">
                {totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-400">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700/50 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
            />
          </div>

          {/* Current Tool */}
          {runningStep && (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
                  {React.createElement(getToolIcon(runningStep.name), { 
                    size: 16, 
                    className: "text-blue-400 animate-pulse" 
                  })}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white text-sm">{runningStep.description}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                    <Loader2 size={12} className="animate-spin" />
                    <span>In progress...</span>
                    {runningStep.startTime && (
                      <span>• {((Date.now() - runningStep.startTime) / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tool Timeline */}
      {steps.length > 1 && (
        <div className="mt-3 p-4 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-gray-700/50">
          <h4 className="font-medium text-white text-sm mb-3 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            Execution Timeline
          </h4>
          
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 text-xs">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800">
                  {step.status === 'completed' ? (
                    <CheckCircle size={12} className="text-green-400" />
                  ) : step.status === 'error' ? (
                    <AlertCircle size={12} className="text-red-400" />
                  ) : step.status === 'running' ? (
                    <Loader2 size={12} className="text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <span className={`font-medium ${
                    step.status === 'completed' ? 'text-green-400' :
                    step.status === 'error' ? 'text-red-400' :
                    step.status === 'running' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {step.description}
                  </span>
                  {step.endTime && step.startTime && (
                    <span className="text-gray-500 ml-2">
                      ({((step.endTime - step.startTime) / 1000).toFixed(1)}s)
                    </span>
                  )}
                  {step.error && (
                    <div className="text-red-400 text-xs mt-1">{step.error}</div>
                  )}
                </div>

                <div className="text-gray-500">
                  Step {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProgressIndicator; 