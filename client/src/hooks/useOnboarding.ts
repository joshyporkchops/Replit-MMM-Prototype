import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { OnboardingData } from "@shared/schema";

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to save onboarding step data
  const saveStepMutation = useMutation({
    mutationFn: async ({ step, data }: { step: string; data: any }) => {
      const response = await apiRequest("POST", "/api/onboarding/step", {
        step,
        ...data
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.success && data.data) {
        setOnboardingData(data.data);
        // Invalidate the progress query to ensure it's up to date
        queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving progress",
        description: error instanceof Error ? error.message : "An error occurred while saving your progress",
        variant: "destructive",
      });
    }
  });

  // Function to save step data
  const saveStepData = useCallback(async (step: string, data: any = {}) => {
    try {
      await saveStepMutation.mutateAsync({ step, data });
      return true;
    } catch (error) {
      console.error("Error saving step data:", error);
      return false;
    }
  }, [saveStepMutation]);

  // Reset onboarding state (for testing or if needed)
  const resetOnboarding = useCallback(() => {
    setCurrentStep(0);
    setOnboardingData(null);
  }, []);

  return {
    currentStep,
    setCurrentStep,
    onboardingData,
    setOnboardingData,
    saveStepData,
    resetOnboarding,
    isLoading: saveStepMutation.isPending
  };
}
