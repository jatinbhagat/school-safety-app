'use client';

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-blue-600 text-white shadow-md'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center hidden md:block">
                  <p
                    className={`text-xs font-medium whitespace-nowrap ${
                      isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div className="flex-1 mx-2 md:mx-4">
                  <div
                    className={`h-1 rounded transition-all duration-300 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Step Title */}
      <div className="mt-4 text-center md:hidden">
        <p className="text-sm font-medium text-gray-900">
          {steps.find(s => s.id === currentStep)?.title}
        </p>
      </div>
    </div>
  );
}
