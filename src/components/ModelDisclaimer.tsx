
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModelDisclaimer() {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>ML Training Options</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          This application provides two modes for machine learning workflows:
        </p>
        
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Built-in Simulation:</strong> Default training provides simulated ML models for demonstration purposes.
          </li>
          <li>
            <strong>Google Colab Integration:</strong> For real model training with actual ML libraries, use the "Use Google Colab" option to generate and run 
            Python notebooks with full access to TensorFlow, scikit-learn and other ML frameworks.
          </li>
        </ul>
        
        <div className="flex mt-2 gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open("https://colab.research.google.com/", "_blank")}
          >
            Learn more about Google Colab
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
