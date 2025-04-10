import { Button } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8 text-center">
        <h1 className="text-3xl font-semibold text-neutral-dark mb-4">Welcome to Media Mix Modeling</h1>
        <p className="text-gray-600 mb-8 max-w-3xl mx-auto">
          Our self-service onboarding will help you set up your MMM dashboard to measure and optimize your marketing efforts. 
          We'll guide you through choosing your KPIs, uploading your data, and configuring your model.
        </p>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-neutral-light p-5 rounded-lg">
            <div className="text-primary text-xl font-semibold mb-2">1. Define Objectives</div>
            <p className="text-gray-600 text-sm">Select your primary and secondary business KPIs you want to measure and optimize.</p>
          </div>
          <div className="bg-neutral-light p-5 rounded-lg">
            <div className="text-primary text-xl font-semibold mb-2">2. Upload Data</div>
            <p className="text-gray-600 text-sm">Connect your data sources or upload your marketing data files for analysis.</p>
          </div>
          <div className="bg-neutral-light p-5 rounded-lg">
            <div className="text-primary text-xl font-semibold mb-2">3. Review & Launch</div>
            <p className="text-gray-600 text-sm">Confirm your setup and launch your custom media mix model.</p>
          </div>
        </div>
        
        <Button 
          onClick={onNext} 
          className="bg-primary hover:bg-primary/90 py-3 px-8"
        >
          Start Onboarding
        </Button>
      </div>
      
      <div className="bg-neutral-light p-6 border-t border-gray-200">
        <div className="flex items-start">
          <svg className="w-12 h-12 text-primary mr-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h3 className="text-lg font-medium text-neutral-dark mb-1">Need help getting started?</h3>
            <p className="text-gray-600 mb-2">If you need assistance during onboarding, we're here to help!</p>
            <div className="flex flex-wrap gap-3">
              <a href="#" className="text-primary hover:text-primary/80 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                Watch Tutorial
              </a>
              <a href="#" className="text-primary hover:text-primary/80 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                Contact Support
              </a>
              <a href="#" className="text-primary hover:text-primary/80 font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
