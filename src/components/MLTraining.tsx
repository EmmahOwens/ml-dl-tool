import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { trainMLModel } from "@/utils/mlAlgorithms";
import { Algorithm, useModels } from "@/context/ModelContext";
import { Check, Info, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface MLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
}

export function MLTraining({ data, features, target, datasetName, onTrainingComplete }: MLTrainingProps) {
  const { addModel } = useModels();
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>("Random Forest");
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([target]); 
  const [currentTarget, setCurrentTarget] = useState<string>(target);

  const algorithmOptions: Algorithm[] = [
    "Random Forest",
    "Decision Tree",
    "Linear Regression",
    "Logistic Regression",
    "XGBoost"
  ];

  const algorithmDescriptions: Record<Algorithm, string> = {
    "Random Forest": "Ensemble learning method using multiple decision trees",
    "Decision Tree": "Flow-chart-like tree structure for decision making",
    "Linear Regression": "Models relationship between variables using linear equation",
    "Logistic Regression": "Statistical model for binary classification",
    "XGBoost": "Optimized gradient boosting library",
    "SVM": "Support Vector Machine for classification and regression",
    "KNN": "K-Nearest Neighbors algorithm",
    "Neural Network": "Multi-layer perceptron neural network",
    "Gradient Boosting": "Ensemble technique using gradient descent",
    "AdaBoost": "Adaptive Boosting ensemble method",
    "Naive Bayes": "Probabilistic classifier based on Bayes' theorem",
    "K-Means": "Clustering algorithm to partition data",
    "DBSCAN": "Density-based clustering algorithm",
    "PCA": "Principal Component Analysis for dimensionality reduction",
    "LDA": "Linear Discriminant Analysis",
    "Gaussian Process": "Non-parametric probabilistic model",
    "Isolation Forest": "Anomaly detection algorithm",
    "LightGBM": "Gradient boosting framework using tree-based learning",
    "CatBoost": "Gradient boosting algorithm for categorical features"
  };

  const addTarget = () => {
    if (currentTarget && !selectedTargets.includes(currentTarget)) {
      setSelectedTargets([...selectedTargets, currentTarget]);
    }
  };

  const removeTarget = (targetToRemove: string) => {
    if (selectedTargets.length > 1) {
      setSelectedTargets(selectedTargets.filter(t => t !== targetToRemove));
    } else {
      toast.error("At least one target is required");
    }
  };

  const trainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);

      // Train model for each selected target
      for (const targetFeature of selectedTargets) {
        // Use the generic trainMLModel function instead of algorithm-specific ones
        const result = await trainMLModel(data, features, targetFeature, selectedAlgorithm);

        // Add model to storage
        await addModel({
          name: `${selectedAlgorithm} - ${targetFeature}`,
          type: "ML",
          algorithm: selectedAlgorithm,
          accuracy: result.accuracy,
          datasetName,
          parameters: result.parameters,
          targets: [targetFeature]
        });
      }

      clearInterval(progressInterval);
      setTrainingProgress(100);
      
      toast.success(`${selectedTargets.length} ML model(s) trained successfully`);
      onTrainingComplete();
    } catch (error) {
      console.error("Training error:", error);
      toast.error("Training failed. Please try again.");
    } finally {
      setIsTraining(false);
    }
  };

  const availableTargets = features.filter(f => !selectedTargets.includes(f));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machine Learning Training</CardTitle>
        <CardDescription>
          Train machine learning models on your dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Algorithm</h3>
          <Select 
            value={selectedAlgorithm} 
            onValueChange={(value) => setSelectedAlgorithm(value as Algorithm)}
            disabled={isTraining}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              {algorithmOptions.map((algorithm) => (
                <SelectItem key={algorithm} value={algorithm}>{algorithm}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAlgorithm && (
            <p className="text-sm text-muted-foreground mt-1">
              {algorithmDescriptions[selectedAlgorithm]}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2">Targets</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedTargets.map(targetFeature => (
              <Badge key={targetFeature} variant="secondary" className="flex items-center gap-1">
                {targetFeature}
                <button 
                  onClick={() => removeTarget(targetFeature)}
                  className="ml-1 focus:outline-none"
                  disabled={isTraining || selectedTargets.length <= 1}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {availableTargets.length > 0 && (
            <div className="flex gap-2">
              <Select 
                value={currentTarget} 
                onValueChange={setCurrentTarget}
                disabled={isTraining}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((feature) => (
                    <SelectItem key={feature} value={feature}>{feature}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="icon" 
                onClick={addTarget}
                disabled={isTraining || !currentTarget}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {isTraining && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Training progress</span>
              <span>{Math.round(trainingProgress)}%</span>
            </div>
            <Progress value={trainingProgress} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-col w-full gap-2">
          <Separator className="mb-2" />
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-1" />
              <span>Will train {selectedTargets.length} model(s) on {selectedTargets.join(", ")}</span>
            </div>
            <Button 
              onClick={trainModel} 
              disabled={isTraining || selectedTargets.length === 0}
              className="sm:w-auto w-full"
            >
              {isTraining ? "Training..." : "Train Model"}
              {!isTraining && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
