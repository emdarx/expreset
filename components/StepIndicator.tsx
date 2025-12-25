import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps: Step[] = ['service-selection', 'plan-selection', 'contact-method', 'payment'];
  
  // Calculate progress
  const getCurrentIndex = () => {
    if (currentStep === 'welcome') return -1;
    return steps.indexOf(currentStep);
  };

  const currentIndex = getCurrentIndex();
  
  if (currentIndex === -1) return null;

  return (
    <div className="w-full px-6 py-4">
      <div className="flex items-center justify-between relative">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -z-10 rounded-full"></div>
        <div 
          className="absolute top-1/2 right-0 h-1 bg-gradient-to-l from-indigo-500 to-blue-500 -z-10 rounded-full transition-all duration-500"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((s, idx) => {
            const isActive = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
                <div key={idx} className="flex flex-col items-center gap-2">
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300
                        ${isActive 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : 'bg-slate-800 border-white/20 text-white/40'}
                    `}>
                        {idx + 1}
                    </div>
                </div>
            )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-white/60 px-1 font-medium">
        <span>سرویس</span>
        <span>پلن</span>
        <span>اطلاعات</span>
        <span>پرداخت</span>
      </div>
    </div>
  );
};