import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OnboardingData } from "@shared/schema";
import { integrationOptions } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SiGoogle, SiMeta, SiTiktok, SiLinkedin, SiSnapchat } from "react-icons/si";
import { FaTwitter } from "react-icons/fa";

interface UploadStepProps {
  onNext: (data: { uploadMethod: string }) => void;
  onPrevious: () => void;
  data: OnboardingData | null;
}

export default function UploadStep({ onNext, onPrevious, data }: UploadStepProps) {
  const { toast } = useToast();
  const [uploadMethod, setUploadMethod] = useState<string | null>(null);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: number, filename: string, size: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Load existing data if available
  useEffect(() => {
    if (data) {
      if (data.uploadMethod) {
        setUploadMethod(data.uploadMethod);
      }
    }
  }, [data]);

  // Fetch existing integrations
  const { data: integrationsData } = useQuery({
    queryKey: ["/api/integrations"],
    enabled: uploadMethod === "integration",
    onSuccess: (data) => {
      if (data?.data && Array.isArray(data.data)) {
        setSelectedIntegrations(data.data.map(integration => integration.type));
      }
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("File upload failed");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data?.success && data.data) {
        setUploadedFiles(prev => [...prev, data.data]);
        toast({
          title: "File Uploaded",
          description: "Your file was successfully uploaded.",
          variant: "default",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "File upload failed. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Connect integration mutation
  const connectIntegrationMutation = useMutation({
    mutationFn: async (integrationType: string) => {
      return await apiRequest("POST", "/api/integrations/connect", {
        integration: {
          name: integrationOptions.find(i => i.id === integrationType)?.name || integrationType,
          type: integrationType,
          status: "connected",
          config: {}
        }
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Integration Connected",
        description: `Successfully connected ${integrationOptions.find(i => i.id === variables)?.name || variables}.`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect integration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Disconnect integration mutation
  const disconnectIntegrationMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return await apiRequest("POST", "/api/integrations/disconnect", {
        integrationId
      });
    },
    onSuccess: () => {
      toast({
        title: "Integration Disconnected",
        description: "Successfully disconnected the integration.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description: error instanceof Error ? error.message : "Failed to disconnect integration. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Get icon for integration
  const getIntegrationIcon = (iconId: string) => {
    switch (iconId) {
      case "google":
        return <SiGoogle className="w-8 h-8" />;
      case "meta":
        return <SiMeta className="w-8 h-8" />;
      case "tiktok":
        return <SiTiktok className="w-8 h-8" />;
      case "linkedin":
        return <SiLinkedin className="w-8 h-8" />;
      case "twitter":
        return <FaTwitter className="w-8 h-8" />;
      case "snapchat":
        return <SiSnapchat className="w-8 h-8" />;
      default:
        return <div className="w-8 h-8 bg-gray-200 rounded-full"></div>;
    }
  };

  // Set up drag and drop events
  useEffect(() => {
    const dropzone = dropzoneRef.current;
    if (!dropzone) return;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("dragover", "border-primary", "bg-primary/5");
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover", "border-primary", "bg-primary/5");
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("dragover", "border-primary", "bg-primary/5");
      
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    };
    
    dropzone.addEventListener("dragover", handleDragOver);
    dropzone.addEventListener("dragleave", handleDragLeave);
    dropzone.addEventListener("drop", handleDrop);
    
    return () => {
      dropzone.removeEventListener("dragover", handleDragOver);
      dropzone.removeEventListener("dragleave", handleDragLeave);
      dropzone.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  // Process the selected files
  const handleFiles = (files: FileList) => {
    // For simplicity, we'll just upload the first file
    if (files[0]) {
      // Check file type
      const fileName = files[0].name.toLowerCase();
      if (!(fileName.endsWith('.csv') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a CSV or Excel file.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (50MB limit)
      if (files[0].size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Maximum file size is 50MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Upload the file
      uploadFileMutation.mutate(files[0]);
    }
  };

  // Handle integration selection
  const toggleIntegration = (integrationType: string) => {
    if (selectedIntegrations.includes(integrationType)) {
      // Find the integration in the data to get its ID
      const integration = integrationsData?.data?.find(i => i.type === integrationType);
      if (integration) {
        disconnectIntegrationMutation.mutate(integration.id);
        setSelectedIntegrations(prev => prev.filter(type => type !== integrationType));
      }
    } else {
      connectIntegrationMutation.mutate(integrationType);
      setSelectedIntegrations(prev => [...prev, integrationType]);
    }
  };

  // Handle upload method selection
  const selectUploadMethod = (method: string) => {
    setUploadMethod(method);
  };

  // Handle continue button
  const handleContinue = () => {
    // Validate
    if (!uploadMethod) {
      toast({
        title: "Upload Method Required",
        description: "Please select an upload method before continuing",
        variant: "destructive",
      });
      return;
    }
    
    // For manual uploads, require at least one file
    if (uploadMethod === "manual" && uploadedFiles.length === 0) {
      toast({
        title: "File Required",
        description: "Please upload at least one file before continuing",
        variant: "destructive",
      });
      return;
    }
    
    // For integrations, require at least one connected integration
    if (uploadMethod === "integration" && selectedIntegrations.length === 0) {
      toast({
        title: "Integration Required",
        description: "Please connect at least one integration before continuing",
        variant: "destructive",
      });
      return;
    }
    
    onNext({ uploadMethod });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-neutral-dark">Upload Your Data</h2>
        <p className="text-gray-600 mt-1">
          Upload your real-time event & cost data to build your Media Mix Model.
        </p>
      </div>
      
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div 
            className={`flex-1 border rounded-lg p-5 cursor-pointer hover:border-primary hover:bg-neutral-light/50 transition-all ${uploadMethod === 'manual' ? 'border-primary bg-neutral-light/50' : 'border-gray-200'}`}
            onClick={() => selectUploadMethod('manual')}
          >
            <div className="flex items-start">
              <div className={`w-5 h-5 rounded-full mr-3 mt-0.5 ${uploadMethod === 'manual' ? 'bg-primary' : 'border-2 border-gray-300'}`}></div>
              <div>
                <h3 className="font-medium text-lg text-neutral-dark">Manual Upload</h3>
                <p className="text-gray-600 mt-1 mb-3">Upload your data as a CSV or Excel file</p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Upload your own formatted data
                  </div>
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Supports CSV and Excel formats
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Download sample template
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`flex-1 border rounded-lg p-5 cursor-pointer hover:border-primary hover:bg-neutral-light/50 transition-all ${uploadMethod === 'integration' ? 'border-primary bg-neutral-light/50' : 'border-gray-200'}`}
            onClick={() => selectUploadMethod('integration')}
          >
            <div className="flex items-start">
              <div className={`w-5 h-5 rounded-full mr-3 mt-0.5 ${uploadMethod === 'integration' ? 'bg-primary' : 'border-2 border-gray-300'}`}></div>
              <div>
                <h3 className="font-medium text-lg text-neutral-dark">Connect Integrations</h3>
                <p className="text-gray-600 mt-1 mb-3">Connect to external media sources</p>
                <div className="text-sm text-gray-500">
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Direct connection to ad platforms
                  </div>
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Automatic data refreshes
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Supports multiple platforms
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Manual Upload Section */}
        {uploadMethod === 'manual' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-3">File Upload</h3>
            <p className="text-gray-600 mb-4">Upload your marketing data files. We accept CSV and Excel formats.</p>
            
            <div 
              ref={dropzoneRef}
              className="drop-zone p-8 text-center mb-4 border-2 border-dashed border-gray-300 rounded-md hover:border-primary hover:bg-primary/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-gray-600 mb-2">Drag and drop your file here, or</p>
              <Button className="bg-primary hover:bg-primary/90">
                Browse Files
              </Button>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <p className="text-sm text-gray-500 mt-3">Maximum file size: 50MB. Supported formats: CSV, XLSX, XLS</p>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-dark mb-2">Uploaded Files</h4>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-8 h-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <div>
                          <div className="font-medium">{file.filename}</div>
                          <div className="text-sm text-gray-500">{formatFileSize(file.size)}</div>
                        </div>
                      </div>
                      <button 
                        className="text-gray-500 hover:text-error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
                        }}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Integration Section */}
        {uploadMethod === 'integration' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-3">Connect Media Platforms</h3>
            <p className="text-gray-600 mb-4">Select the platforms where you advertise to connect and import your marketing data.</p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {integrationOptions.map(integration => (
                <div 
                  key={integration.id}
                  className={`integration-card p-4 rounded-lg cursor-pointer transition-all ${
                    selectedIntegrations.includes(integration.id) ? 'border-primary shadow-md' : 'border border-gray-200'
                  }`}
                  onClick={() => toggleIntegration(integration.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className="mr-3 text-gray-700">
                        {getIntegrationIcon(integration.icon)}
                      </div>
                      <span className="font-medium">{integration.name}</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full ${
                      selectedIntegrations.includes(integration.id) ? 'bg-primary' : 'border-2 border-gray-300'
                    }`}></div>
                  </div>
                  <p className="text-sm text-gray-500">{integration.description}</p>
                </div>
              ))}
            </div>
            
            {selectedIntegrations.length > 0 && (
              <div>
                <h4 className="font-medium text-neutral-dark mb-2">Connected Platforms</h4>
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  {selectedIntegrations.map(integrationType => {
                    const integration = integrationOptions.find(i => i.id === integrationType);
                    if (!integration) return null;
                    
                    return (
                      <div key={integration.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-3 text-gray-700">
                            {getIntegrationIcon(integration.icon)}
                          </div>
                          <div>
                            <div className="font-medium">{integration.name}</div>
                            <div className="text-sm text-gray-500">Connected • Last sync: Just now</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="text-primary hover:text-primary/80 px-2 py-1 text-sm font-medium">
                            Sync
                          </button>
                          <button 
                            className="text-gray-500 hover:text-error px-2 py-1 text-sm font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleIntegration(integration.id);
                            }}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
          disabled={uploadFileMutation.isPending || connectIntegrationMutation.isPending || disconnectIntegrationMutation.isPending}
        >
          {uploadFileMutation.isPending || connectIntegrationMutation.isPending || disconnectIntegrationMutation.isPending ? (
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
            "Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
