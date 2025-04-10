interface Step {
  id: string;
  title: string;
  index: number;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  // Calculate progress percentage
  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-sm">
        {steps.map((step, index) => {
          // Determine step status
          let stepStatusClass = "step-inactive";
          let numberClass = "bg-gray-200 text-gray-500";
          
          if (index === currentStep) {
            stepStatusClass = "step-active";
            numberClass = "bg-primary text-white";
          } else if (index < currentStep) {
            stepStatusClass = "step-complete";
            numberClass = "bg-success text-white";
          }
          
          return (
            <div key={step.id} className={`${stepStatusClass} flex flex-col items-center`}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${numberClass}`}>
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="mt-1">{step.title}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
