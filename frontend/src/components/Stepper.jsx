import React from 'react';
import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        const isPending = idx > currentStep;
        
        let nodeClass = "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ";
        let lineClass = "h-px w-8 shrink-0 ";
        let textClass = "text-xs font-bold whitespace-nowrap ";
        
        if (isCompleted) {
          nodeClass += "bg-[var(--forest)] text-white";
          lineClass += "bg-[var(--forest)]";
          textClass += "text-[var(--forest)]";
        } else if (isActive) {
          nodeClass += "bg-[var(--ink)] text-[var(--paper)] border-2 border-[var(--ink)] shadow-[0_0_0_3px_var(--paper),0_0_0_4px_var(--ink)]";
          lineClass += "bg-[var(--border)]";
          textClass += "text-[var(--ink)]";
        } else {
          nodeClass += "bg-[var(--paper)] text-[var(--ink-faint)] border border-[var(--border)]";
          lineClass += "bg-[var(--border)]";
          textClass += "text-[var(--ink-faint)]";
        }

        return (
          <React.Fragment key={idx}>
            <div className="flex items-center gap-2">
              <div className={nodeClass}>
                {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </div>
              <span className={textClass}>{step.label}</span>
            </div>
            {idx < steps.length - 1 && <div className={lineClass} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
