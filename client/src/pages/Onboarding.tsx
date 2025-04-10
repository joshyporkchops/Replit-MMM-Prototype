import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from "@/components/onboarding/StepIndicator";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import ObjectivesStep from "@/components/onboarding/ObjectivesStep";
import UploadStep from "@/components/onboarding/UploadStep";
import AnalyzeStep from "@/components/onboarding/AnalyzeStep";
import ExternalFactorsStep from "@/components/onboarding/ExternalFactorsStep";
import ReviewStep from "@/components/onboarding/ReviewStep";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useLocation } from "wouter";

export const steps = [
  { id: "welcome", title: "Welcome", index: 0 },
  { id: "objectives", title: "Objectives", index: 1 },
  { id: "upload", title: "Upload Data", index: 2 },
  { id: "analyze", title: "Analyze Data", index: 3 },
  { id: "factors", title: "External Factors", index: 4 },
  { id: "review", title: "Review", index: 5 },
];

export default function Onboarding() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { 
    currentStep, 
    setCurrentStep, 
    onboardingData, 
    saveStepData, 
    isLoading 
  } = useOnboarding();

  // Fetch existing onboarding data when the component mounts
  const { data, isLoading: isLoadingProgress } = useQuery({
    queryKey: ["/api/onboarding/progress"],
    onSuccess: (data) => {
      if (data?.data && data.data.step) {
        // Find the step index based on the saved step
        const stepIndex = steps.findIndex(step => step.id === data.data.step);
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error loading onboarding progress",
        description: "Could not load your progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Navigate to next step
  const handleNext = async (stepData = {}) => {
    if (currentStep < steps.length - 1) {
      try {
        // Save current step data
        await saveStepData(steps[currentStep].id, stepData);
        // Move to next step
        setCurrentStep(currentStep + 1);
      } catch (error) {
        toast({
          title: "Error saving progress",
          description: "Could not save your progress. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // If on first step, go back to home
      navigate("/");
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (steps[currentStep].id) {
      case "welcome":
        return <WelcomeStep onNext={handleNext} />;
      case "objectives":
        return <ObjectivesStep onNext={handleNext} onPrevious={handlePrevious} data={onboardingData} />;
      case "upload":
        return <UploadStep onNext={handleNext} onPrevious={handlePrevious} data={onboardingData} />;
      case "analyze":
        return <AnalyzeStep onNext={handleNext} onPrevious={handlePrevious} data={onboardingData} />;
      case "factors":
        return <ExternalFactorsStep onNext={handleNext} onPrevious={handlePrevious} data={onboardingData} />;
      case "review":
        return <ReviewStep onPrevious={handlePrevious} data={onboardingData} />;
      default:
        return <WelcomeStep onNext={handleNext} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Onboarding Step Indicator */}
      <div className="mb-6 hidden sm:block">
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      {/* Loading state */}
      {(isLoading || isLoadingProgress) ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        renderStep()
      )}
    </div>
  );
}
