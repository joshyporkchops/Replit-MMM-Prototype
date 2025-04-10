import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { kpiOptions } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { OnboardingData } from "@shared/schema";

interface ObjectivesStepProps {
  onNext: (data: { primaryKpi: string, secondaryKpis: string[] }) => void;
  onPrevious: () => void;
  data: OnboardingData | null;
}

export default function ObjectivesStep({ onNext, onPrevious, data }: ObjectivesStepProps) {
  const { toast } = useToast();
  const [primaryKpi, setPrimaryKpi] = useState<string | null>(null);
  const [secondaryKpis, setSecondaryKpis] = useState<string[]>([]);

  // Load existing data if available
  useEffect(() => {
    if (data) {
      if (data.primaryKpi) {
        setPrimaryKpi(data.primaryKpi);
      }
      if (data.secondaryKpis && Array.isArray(data.secondaryKpis)) {
        setSecondaryKpis(data.secondaryKpis);
      }
    }
  }, [data]);

  const handlePrimaryKpiSelect = (kpiId: string) => {
    setPrimaryKpi(kpiId);
  };

  const handleSecondaryKpiToggle = (kpiId: string) => {
    setSecondaryKpis(prevKpis => {
      // If already selected, remove it
      if (prevKpis.includes(kpiId)) {
        return prevKpis.filter(id => id !== kpiId);
      }
      
      // If we already have 3 selections, show warning and don't add
      if (prevKpis.length >= 3) {
        toast({
          title: "Maximum KPIs selected",
          description: "You can select up to 3 secondary KPIs",
          variant: "default",
        });
        return prevKpis;
      }
      
      // Add new selection
      return [...prevKpis, kpiId];
    });
  };

  const handleContinue = () => {
    // Validate
    if (!primaryKpi) {
      toast({
        title: "Primary KPI Required",
        description: "Please select a primary KPI before continuing",
        variant: "destructive",
      });
      return;
    }
    
    onNext({
      primaryKpi,
      secondaryKpis
    });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-neutral-dark">Select Your KPIs</h2>
        <p className="text-gray-600 mt-1">
          Choose the business objectives you want to measure and optimize with our Media Mix Model.
        </p>
      </div>
      
      <div className="p-6">
        <div className="mb-8">
          <h3 className="text-lg font-medium text-neutral-dark mb-3">Primary Business KPI</h3>
          <p className="text-gray-600 mb-4">Select the main conversion event you want to optimize for.</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiOptions.primary.map(kpi => (
              <div 
                key={kpi.id}
                className={`kpi-card p-4 rounded-lg bg-white shadow-sm cursor-pointer ${primaryKpi === kpi.id ? 'selected border-primary bg-primary/5' : 'border-2 border-transparent'}`}
                onClick={() => handlePrimaryKpiSelect(kpi.id)}
              >
                <div className="flex items-start">
                  <div className={`w-5 h-5 rounded-full mr-3 mt-0.5 flex-shrink-0 ${primaryKpi === kpi.id ? 'bg-primary' : 'border-2 border-gray-300'}`}></div>
                  <div>
                    <h4 className="font-medium text-neutral-dark">{kpi.name}</h4>
                    <p className="text-sm text-gray-500">{kpi.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-neutral-dark mb-3">Secondary KPIs</h3>
          <p className="text-gray-600 mb-4">Select additional metrics you want to track (optional, select up to 3)</p>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpiOptions.secondary.map(kpi => (
              <div 
                key={kpi.id}
                className={`kpi-card p-4 rounded-lg bg-white shadow-sm cursor-pointer ${secondaryKpis.includes(kpi.id) ? 'selected border-primary bg-primary/5' : 'border-2 border-transparent'}`}
                onClick={() => handleSecondaryKpiToggle(kpi.id)}
              >
                <div className="flex items-start">
                  <div className={`w-5 h-5 rounded mr-3 mt-0.5 flex-shrink-0 ${secondaryKpis.includes(kpi.id) ? 'bg-primary' : 'border-2 border-gray-300'}`}></div>
                  <div>
                    <h4 className="font-medium text-neutral-dark">{kpi.name}</h4>
                    <p className="text-sm text-gray-500">{kpi.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-neutral-light p-6 border-t border-gray-200 flex justify-between">
        <Button
          onClick={onPrevious}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800 font-medium"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-primary hover:bg-primary/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
