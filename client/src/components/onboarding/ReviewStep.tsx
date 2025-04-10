import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "@shared/schema";
import { kpiOptions, integrationOptions, externalFactorCategories } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ReviewStepProps {
  onPrevious: () => void;
  data: OnboardingData | null;
}

export default function ReviewStep({ onPrevious, data }: ReviewStepProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/onboarding/complete", {});
    },
    onSuccess: () => {
      toast({
        title: "Onboarding Complete",
        description: "Your Media Mix Model is now being built. This may take a few hours to complete.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/progress"] });
      navigate("/dashboard"); // Redirect to dashboard or appropriate page
    },
    onError: (error) => {
      toast({
        title: "Error Completing Onboarding",
        description: error instanceof Error ? error.message : "An error occurred while completing onboarding.",
        variant: "destructive",
      });
    }
  });

  // Find KPI names for the selected IDs
  const getPrimaryKpiName = () => {
    if (!data?.primaryKpi) return "Not selected";
    const kpi = kpiOptions.primary.find(k => k.id === data.primaryKpi);
    return kpi ? kpi.name : data.primaryKpi;
  };

  const getSecondaryKpiNames = () => {
    if (!data?.secondaryKpis || !Array.isArray(data.secondaryKpis) || data.secondaryKpis.length === 0) {
      return "None selected";
    }
    
    return data.secondaryKpis.map(id => {
      const kpi = kpiOptions.secondary.find(k => k.id === id);
      return kpi ? kpi.name : id;
    }).join(", ");
  };

  // Get integration names
  const getIntegrationNames = () => {
    // This would typically come from the API response with connected integrations
    // For now, let's extract them from the upload method
    if (data?.uploadMethod !== "integration") return "No integrations connected";
    
    // This would be replaced with actual connected integrations data
    return "Connected integrations";
  };

  // Get external factors summary
  const getExternalFactors = () => {
    if (!data?.externalFactors || !Array.isArray(data.externalFactors) || data.externalFactors.length === 0) {
      return "No external factors selected";
    }
    
    // Group factors by category
    const categorizedFactors: Record<string, string[]> = {};
    
    data.externalFactors.forEach(factor => {
      if (!factor.enabled) return;
      
      // Find category for this factor
      let categoryName = "Custom Factors";
      
      for (const category of externalFactorCategories) {
        const foundFactor = category.factors.find(f => f.id === factor.id);
        if (foundFactor) {
          categoryName = category.name;
          break;
        }
      }
      
      if (!categorizedFactors[categoryName]) {
        categorizedFactors[categoryName] = [];
      }
      
      categorizedFactors[categoryName].push(factor.name);
    });
    
    // Format each category
    return Object.entries(categorizedFactors).map(([category, factors]) => (
      <div key={category} className="mb-3">
        <div className="font-medium mb-1">{category}</div>
        <ul className="text-sm list-disc list-inside">
          {factors.map((factor, idx) => (
            <li key={idx}>{factor}</li>
          ))}
        </ul>
      </div>
    ));
  };

  // Handle build model button
  const handleBuildModel = () => {
    if (!agreedToTerms) {
      toast({
        title: "Terms Agreement Required",
        description: "Please agree to the Terms of Service and Privacy Policy to continue.",
        variant: "destructive",
      });
      return;
    }
    
    completeOnboardingMutation.mutate();
  };

  // Find columns from the data (would typically come from analysis data)
  const getDataColumns = () => {
    // This would typically come from the analysis data
    // For now, return sample columns
    return ["Date", "Channel", "Campaign", "Spend", "Impressions", "Clicks", "Conversions", "Revenue"];
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-neutral-dark">Review Your Setup</h2>
        <p className="text-gray-600 mt-1">
          Review and confirm your configuration before we build your Media Mix Model.
        </p>
      </div>
      
      <div className="p-6">
        <div className="space-y-8">
          {/* Objectives Review */}
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-4 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm mr-2">1</span>
              Objectives
              <button 
                className="ml-auto text-primary hover:text-primary/80 text-sm font-medium flex items-center"
                onClick={() => onPrevious()}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                Edit
              </button>
            </h3>
            
            <div className="bg-neutral-light rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Primary KPI</h4>
                  <div className="font-medium">{getPrimaryKpiName()}</div>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Secondary KPIs</h4>
                  <div className="font-medium">{getSecondaryKpiNames()}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Upload Review */}
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-4 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm mr-2">2</span>
              Data Sources
              <button 
                className="ml-auto text-primary hover:text-primary/80 text-sm font-medium flex items-center"
                onClick={() => onPrevious()}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                Edit
              </button>
            </h3>
            
            <div className="bg-neutral-light rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">Upload Method</h4>
                  <div className="font-medium">{data?.uploadMethod === "manual" ? "Manual Upload" : "Connected Integrations"}</div>
                </div>
                
                {data?.uploadMethod === "manual" && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">Uploaded Files</h4>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-success mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <span>Data file uploaded successfully</span>
                    </div>
                  </div>
                )}
                
                {data?.uploadMethod === "integration" && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-2">Connected Platforms</h4>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-success mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{getIntegrationNames()}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">Data Columns</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getDataColumns().map((column, idx) => (
                      <div key={idx} className="bg-white rounded px-3 py-1 text-sm shadow-sm">{column}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* External Factors Review */}
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-4 flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-sm mr-2">3</span>
              External Factors
              <button 
                className="ml-auto text-primary hover:text-primary/80 text-sm font-medium flex items-center"
                onClick={() => onPrevious()}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
                Edit
              </button>
            </h3>
            
            <div className="bg-neutral-light rounded-lg p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">Selected Factors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getExternalFactors()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Final Confirmation */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="bg-white rounded-full p-3 flex-shrink-0">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-neutral-dark mb-2">Ready to Build Your Media Mix Model</h3>
                <p className="text-gray-600 mb-4">
                  We'll use your data and selections to build a custom Media Mix Model tailored to your business. This process typically takes 2-4 hours to complete.
                </p>
                <div className="flex items-center mb-4">
                  <Checkbox 
                    id="terms-agree" 
                    className="mr-3"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                  />
                  <Label htmlFor="terms-agree" className="text-sm text-gray-600">
                    I agree to the <a href="#" className="text-primary">Terms of Service</a> and <a href="#" className="text-primary">Privacy Policy</a>
                  </Label>
                </div>
                <Button 
                  onClick={handleBuildModel} 
                  className="bg-primary hover:bg-primary/90 py-3 px-8"
                  disabled={completeOnboardingMutation.isPending}
                >
                  {completeOnboardingMutation.isPending ? (
                    <>
                      <span className="mr-2 animate-spin">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Processing...
                    </>
                  ) : (
                    "Build My Model"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
