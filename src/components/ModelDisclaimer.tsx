
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export function ModelDisclaimer() {
  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>Simulation Notice</AlertTitle>
      <AlertDescription>
        <p>
          This application provides a simulation of machine learning workflows. The "trained models" are 
          demonstration objects that simulate the training process and results, but are not actual 
          trained ML/DL models that can make predictions.
        </p>
        <p className="mt-2">
          For production use, you would need to integrate with actual ML libraries like TensorFlow, 
          PyTorch, or scikit-learn to train real models that can be used for predictions.
        </p>
      </AlertDescription>
    </Alert>
  );
}
