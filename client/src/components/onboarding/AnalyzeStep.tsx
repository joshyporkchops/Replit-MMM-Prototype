import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData, DataValidationResponse } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AnalyzeStepProps {
  onNext: (data: { dataStatus: string }) => void;
  onPrevious: () => void;
  data: OnboardingData | null;
}

export default function AnalyzeStep({ onNext, onPrevious, data }: AnalyzeStepProps) {
  const { toast } = useToast();
  const [analysisStatus, setAnalysisStatus] = useState<'analyzing' | 'success' | 'error'>("analyzing");
  const [analysisData, setAnalysisData] = useState<DataValidationResponse | null>(null);

  // Analyze data mutation
  const analyzeDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/analyze/data", {});
      return response.json();
    },
    onSuccess: (data: DataValidationResponse) => {
      setAnalysisData(data);
      setAnalysisStatus(data.status);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during data analysis.",
        variant: "destructive",
      });
      setAnalysisStatus("error");
    }
  });

  // Start analysis when component mounts
  useEffect(() => {
    // If we already have analysis data in our onboarding state, use that
    if (data && data.dataStatus) {
      setAnalysisStatus(data.dataStatus as 'analyzing' | 'success' | 'error');
    } else {
      // Otherwise start a new analysis
      analyzeDataMutation.mutate();
    }
  }, [data]);

  // Handle continue button
  const handleContinue = () => {
    onNext({ dataStatus: analysisStatus });
  };

  // Handle re-upload button
  const handleReupload = () => {
    onPrevious(); // Go back to upload step
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-neutral-dark">Analyze Your Data</h2>
        <p className="text-gray-600 mt-1">
          We're checking your data to ensure it meets the requirements for our model.
        </p>
      </div>
      
      <div className="p-6">
        {/* Loading State */}
        {(analysisStatus === 'analyzing' || analyzeDataMutation.isPending) && (
          <div className="text-center py-8">
            <svg className="w-16 h-16 mx-auto text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-medium text-neutral-dark mt-4">Analyzing Your Data</h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              We're checking your data formatting and validating the contents. This should take just a moment...
            </p>
          </div>
        )}
        
        {/* Success State */}
        {analysisStatus === 'success' && (
          <div>
            <div className="text-center py-6 mb-6">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-dark mt-4">Data Analysis Complete</h3>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                Your data has been analyzed and is ready for modeling. Here's a summary of what we found:
              </p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-neutral-dark mb-3">Data Summary</h4>
              <div className="bg-neutral-light rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisData?.summary && (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Time Period</div>
                      <div className="font-medium">{analysisData.summary.timePeriod || "Not specified"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Data Points</div>
                      <div className="font-medium">{analysisData.summary.dataPoints?.toLocaleString() || 0} records</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Media Channels</div>
                      <div className="font-medium">{analysisData.summary.channels || 0} channels detected</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {analysisData?.preview && analysisData.preview.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-dark mb-3">Data Preview</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-neutral-light">
                      <tr>
                        {analysisData.columns?.map((column, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisData.preview.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {analysisData.columns?.map((column, colIdx) => (
                            <td key={`${rowIdx}-${colIdx}`} className="px-4 py-3 whitespace-nowrap text-sm">
                              {String(row[column] !== undefined && row[column] !== null ? row[column] : '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Error State */}
        {analysisStatus === 'error' && (
          <div>
            <div className="text-center py-6 mb-6">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-dark mt-4">Data Format Issues Found</h3>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                We found some issues with your data that need to be fixed before we can proceed.
              </p>
            </div>
            
            {analysisData?.errors && analysisData.errors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-neutral-dark mb-3">Required Corrections</h4>
                <div className="bg-error/5 border border-error/20 rounded-lg p-4 mb-6">
                  <p className="text-neutral-dark mb-2">Please correct the following issues and re-upload your data:</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisData.errors.map((error, idx) => (
                      <li key={idx}>
                        {error.column && `${error.column}: `}{error.message}{error.row > 0 ? ` in row ${error.row}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {analysisData?.preview && analysisData.preview.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-dark mb-3">Data Preview with Errors</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-neutral-light">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                        {analysisData.columns?.map((column, idx) => (
                          <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analysisData.preview.map((row, rowIdx) => {
                        // Check if this row has errors
                        const hasError = analysisData.errors?.some(error => error.row === rowIdx + 2);
                        
                        return (
                          <tr key={rowIdx} className={hasError ? "error-row" : ""}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{rowIdx + 2}</td>
                            {analysisData.columns?.map((column, colIdx) => {
                              // Check if this specific cell has an error
                              const cellHasError = analysisData.errors?.some(
                                error => error.row === rowIdx + 2 && error.column === column
                              );
                              
                              return (
                                <td 
                                  key={`${rowIdx}-${colIdx}`} 
                                  className={`px-4 py-3 whitespace-nowrap text-sm ${cellHasError ? "error-cell" : ""}`}
                                >
                                  {String(row[column] !== undefined && row[column] !== null ? row[column] : '—')}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={handleReupload}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Upload Corrected Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
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
          disabled={analysisStatus === 'analyzing' || analyzeDataMutation.isPending}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
