import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "@shared/schema";
import { externalFactorCategories } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ExternalFactorsStepProps {
  onNext: (data: { externalFactors: any }) => void;
  onPrevious: () => void;
  data: OnboardingData | null;
}

interface Factor {
  id: string;
  name: string;
  enabled: boolean;
  settings?: any;
}

interface CustomFactor {
  id: string;
  name: string;
  type: string;
}

export default function ExternalFactorsStep({ onNext, onPrevious, data }: ExternalFactorsStepProps) {
  const { toast } = useToast();
  const [selectedFactors, setSelectedFactors] = useState<Record<string, Factor>>({});
  const [customFactors, setCustomFactors] = useState<CustomFactor[]>([]);
  const [newFactorName, setNewFactorName] = useState("");
  const [newFactorType, setNewFactorType] = useState("");

  // Nested settings visibility state
  const [visibleSettings, setVisibleSettings] = useState<Record<string, boolean>>({});

  // Load existing data if available
  useEffect(() => {
    if (data && data.externalFactors) {
      try {
        // Convert from array to record for easier state management
        const factorsRecord: Record<string, Factor> = {};
        const existing = Array.isArray(data.externalFactors) ? data.externalFactors : [];
        
        existing.forEach(factor => {
          if (factor.id && factor.name) {
            factorsRecord[factor.id] = {
              id: factor.id,
              name: factor.name,
              enabled: factor.enabled || false,
              settings: factor.settings || {}
            };
            
            // If factor is enabled, show its settings
            if (factor.enabled) {
              setVisibleSettings(prev => ({ ...prev, [factor.id]: true }));
            }
          }
        });
        
        setSelectedFactors(factorsRecord);
        
        // Extract custom factors if any
        const extractedCustom = existing.filter(factor => factor.id.startsWith('custom-'));
        if (extractedCustom.length > 0) {
          setCustomFactors(extractedCustom.map(f => ({
            id: f.id,
            name: f.name,
            type: f.settings?.type || "Nominal (Category)"
          })));
        }
      } catch (error) {
        console.error("Error parsing external factors data:", error);
      }
    }
  }, [data]);

  // Toggle factor selection
  const toggleFactor = (factorId: string, factorName: string) => {
    setSelectedFactors(prev => {
      const updated = { ...prev };
      
      // If already exists, toggle enabled state
      if (updated[factorId]) {
        updated[factorId] = {
          ...updated[factorId],
          enabled: !updated[factorId].enabled
        };
      } else {
        // Otherwise add new factor
        updated[factorId] = {
          id: factorId,
          name: factorName,
          enabled: true,
          settings: {}
        };
      }
      
      // Toggle settings visibility
      setVisibleSettings(prev => ({
        ...prev,
        [factorId]: updated[factorId].enabled
      }));
      
      return updated;
    });
  };

  // Add custom factor
  const addCustomFactor = () => {
    if (!newFactorName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your custom factor",
        variant: "destructive",
      });
      return;
    }
    
    if (!newFactorType) {
      toast({
        title: "Type Required",
        description: "Please select a type for your custom factor",
        variant: "destructive",
      });
      return;
    }
    
    const newId = `custom-${Date.now()}`;
    const newFactor = {
      id: newId,
      name: newFactorName.trim(),
      type: newFactorType
    };
    
    setCustomFactors(prev => [...prev, newFactor]);
    
    // Also add to selected factors
    setSelectedFactors(prev => ({
      ...prev,
      [newId]: {
        id: newId,
        name: newFactorName.trim(),
        enabled: true,
        settings: { type: newFactorType }
      }
    }));
    
    // Reset form
    setNewFactorName("");
    setNewFactorType("");
    
    toast({
      title: "Factor Added",
      description: `${newFactorName} has been added to your external factors.`,
    });
  };

  // Remove custom factor
  const removeCustomFactor = (factorId: string) => {
    setCustomFactors(prev => prev.filter(f => f.id !== factorId));
    
    // Also remove from selected factors
    setSelectedFactors(prev => {
      const updated = { ...prev };
      delete updated[factorId];
      return updated;
    });
  };

  // Handle continue button
  const handleContinue = () => {
    // Convert selectedFactors object to array for storage
    const factorsArray = Object.values(selectedFactors).filter(f => f.enabled);
    
    onNext({
      externalFactors: factorsArray
    });
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-neutral-dark">External Factors</h2>
        <p className="text-gray-600 mt-1">
          Select and configure external factors that may influence your marketing performance.
        </p>
      </div>
      
      <div className="p-6">
        <p className="text-gray-600 mb-6">
          External factors help our model account for variables outside of your direct marketing efforts. 
          These can significantly impact your results and provide better attribution accuracy.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {externalFactorCategories.map(category => (
            <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-light p-4 border-b border-gray-200">
                <h3 className="font-medium text-lg text-neutral-dark">{category.name}</h3>
              </div>
              <div className="p-4 space-y-4">
                {category.factors.map(factor => (
                  <div key={factor.id} className="space-y-3">
                    <div className="flex items-start">
                      <Checkbox 
                        id={factor.id} 
                        className="mt-1 mr-3"
                        checked={selectedFactors[factor.id]?.enabled || false}
                        onCheckedChange={() => toggleFactor(factor.id, factor.name)}
                      />
                      <div>
                        <Label 
                          htmlFor={factor.id} 
                          className="font-medium text-neutral-dark"
                        >
                          {factor.name}
                        </Label>
                        <p className="text-sm text-gray-500">{factor.description}</p>
                        
                        {/* Weather details */}
                        {factor.id === 'weather' && visibleSettings[factor.id] && (
                          <div className="mt-3 pl-0 space-y-3">
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Locations to Track
                              </Label>
                              <Select>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select locations" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="us-all">United States (All)</SelectItem>
                                  <SelectItem value="northeast">Northeast Region</SelectItem>
                                  <SelectItem value="west-coast">West Coast</SelectItem>
                                  <SelectItem value="midwest">Midwest</SelectItem>
                                  <SelectItem value="southeast">Southeast</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Weather Events
                              </Label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Checkbox id="severe-storms" className="mr-2" />
                                  <Label htmlFor="severe-storms" className="text-sm">Severe Storms</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="heat-waves" className="mr-2" />
                                  <Label htmlFor="heat-waves" className="text-sm">Heat Waves</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="cold-snaps" className="mr-2" />
                                  <Label htmlFor="cold-snaps" className="text-sm">Cold Snaps</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="natural-disasters" className="mr-2" />
                                  <Label htmlFor="natural-disasters" className="text-sm">Natural Disasters</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Holidays details */}
                        {factor.id === 'holidays' && visibleSettings[factor.id] && (
                          <div className="mt-3 pl-0 space-y-3">
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Holiday Categories
                              </Label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Checkbox id="major-holidays" className="mr-2" />
                                  <Label htmlFor="major-holidays" className="text-sm">Major Holidays (Christmas, Thanksgiving, etc.)</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="shopping-holidays" className="mr-2" />
                                  <Label htmlFor="shopping-holidays" className="text-sm">Shopping Events (Black Friday, Cyber Monday)</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="regional-holidays" className="mr-2" />
                                  <Label htmlFor="regional-holidays" className="text-sm">Regional Holidays</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Major events details */}
                        {factor.id === 'major-events' && visibleSettings[factor.id] && (
                          <div className="mt-3 pl-0 space-y-3">
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Event Types
                              </Label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Checkbox id="sports-events" className="mr-2" />
                                  <Label htmlFor="sports-events" className="text-sm">Major Sports Events</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="entertainment-events" className="mr-2" />
                                  <Label htmlFor="entertainment-events" className="text-sm">Entertainment (Award Shows, Releases)</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="industry-events" className="mr-2" />
                                  <Label htmlFor="industry-events" className="text-sm">Industry Conferences & Events</Label>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Events
                              </Label>
                              <Input 
                                type="text" 
                                placeholder="Enter event name" 
                                className="w-full mb-2" 
                              />
                              <div className="flex gap-2">
                                <Input 
                                  type="date" 
                                  className="flex-1" 
                                />
                                <Button 
                                  variant="secondary"
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Economic indicators */}
                        {factor.id === 'economic-indicators' && visibleSettings[factor.id] && (
                          <div className="mt-3 pl-0 space-y-3">
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Indicators
                              </Label>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <Checkbox id="consumer-confidence" className="mr-2" />
                                  <Label htmlFor="consumer-confidence" className="text-sm">Consumer Confidence Index</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="unemployment" className="mr-2" />
                                  <Label htmlFor="unemployment" className="text-sm">Unemployment Rates</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="inflation" className="mr-2" />
                                  <Label htmlFor="inflation" className="text-sm">Inflation Rates</Label>
                                </div>
                                <div className="flex items-center">
                                  <Checkbox id="stock-market" className="mr-2" />
                                  <Label htmlFor="stock-market" className="text-sm">Stock Market Performance</Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Competitor campaigns */}
                        {factor.id === 'competitor-campaigns' && visibleSettings[factor.id] && (
                          <div className="mt-3 pl-0 space-y-3">
                            <div>
                              <Label className="block text-sm font-medium text-gray-700 mb-1">
                                Add Competitors
                              </Label>
                              <div className="flex gap-2 mb-2">
                                <Input 
                                  type="text" 
                                  placeholder="Competitor name" 
                                  className="flex-1" 
                                />
                                <Button 
                                  variant="secondary" 
                                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                                >
                                  Add
                                </Button>
                              </div>
                              
                              <div className="border border-gray-200 rounded-md p-3 bg-neutral-light">
                                <p className="text-sm text-gray-600">No competitors added yet</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-neutral-light rounded-lg p-4">
          <h3 className="font-medium text-neutral-dark mb-2">Custom External Factors</h3>
          <p className="text-sm text-gray-600 mb-3">
            Add any other external factors specific to your business that may influence your marketing performance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Input 
              type="text" 
              placeholder="Factor name" 
              className="flex-1" 
              value={newFactorName}
              onChange={(e) => setNewFactorName(e.target.value)}
            />
            <Select value={newFactorType} onValueChange={setNewFactorType}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Factor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nominal (Category)">Nominal (Category)</SelectItem>
                <SelectItem value="Numeric (Value)">Numeric (Value)</SelectItem>
                <SelectItem value="Binary (Yes/No)">Binary (Yes/No)</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="secondary" 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 sm:w-auto w-full"
              onClick={addCustomFactor}
            >
              Add
            </Button>
          </div>
          
          {customFactors.length > 0 && (
            <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
              {customFactors.map((factor) => (
                <div key={factor.id} className="p-3 flex items-center justify-between bg-white">
                  <div>
                    <div className="font-medium">{factor.name}</div>
                    <div className="text-sm text-gray-500">{factor.type}</div>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-error"
                    onClick={() => removeCustomFactor(factor.id)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
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
