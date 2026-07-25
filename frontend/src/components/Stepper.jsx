import React from 'react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="stepper">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        
        let itemClass = "stepper-item";
        if (isCompleted) itemClass += " done";
        if (isActive) itemClass += " active";
        
        return (
          <React.Fragment key={idx}>
            <div className={itemClass}>
              <span className="stepper-dot">{isCompleted ? '✓' : idx + 1}</span>
              <span className="stepper-label">{step.label}</span>
            </div>
            {idx < steps.length - 1 && <span className="stepper-line"></span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}
