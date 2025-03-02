
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Algorithm, useModels } from "@/context/ModelContext";
import { 
  trainMLModel, 
  trainAllMLModels, 
  isClusteringAlgorithm,
  isDimensionalityReductionAlgorithm,
  isAnomalyDetectionAlgorithm,
  getModelTypeForAlgorithm
} from "@/utils/mlAlgorithms";
import { Check, Info, Sparkles, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface MLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
}

export function MLTraining({
  data,
  features,
  target,
  datasetName,
  onTrainingComplete,
}: MLTrainingProps) {
  const { addModel } = useModels();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [algorithm, setAlgorithm] = useState<Algorithm>("Random Forest");
  const [autoMode, setAutoMode] = useState(true);
  const [trainingResults, setTrainingResults] = useState<Array<{
    algorithm: Algorithm;
    accuracy: number;
    selected: boolean;
  }>>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([target]);
  const [currentTarget, setCurrentTarget] = useState<string>("");

  // Update currentTarget when available features change
  useEffect(() => {
    const availableFeatures = features.filter(f => !selectedTargets.includes(f));
    if (availableFeatures.length > 0 && !currentTarget) {
      setCurrentTarget(availableFeatures[0]);
    }
  }, [features, selectedTargets, currentTarget]);

  const addTarget = () => {
    if (currentTarget && !selectedTargets.includes(currentTarget)) {
      setSelectedTargets([...selectedTargets, currentTarget]);
      // Reset currentTarget after adding
      const availableFeatures = features.filter(f => 
        ![...selectedTargets, currentTarget].includes(f)
      );
      if (availableFeatures.length > 0) {
        setCurrentTarget(availableFeatures[0]);
      } else {
        setCurrentTarget("");
      }
    }
  };

  const removeTarget = (targetToRemove: string) => {
    if (selectedTargets.length > 1) {
      const newTargets = selectedTargets.filter(t => t !== targetToRemove);
      setSelectedTargets(newTargets);
      
      // If currentTarget is empty, set it to the removed target
      if (!currentTarget) {
        setCurrentTarget(targetToRemove);
      }
    } else {
      toast.error("At least one target is required");
    }
  };

  const trainModel = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingResults([]);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);

      // Process each selected target
      for (const targetFeature of selectedTargets) {
        if (autoMode) {
          // Train multiple algorithms
          const allResults = await trainAllMLModels(data, features, targetFeature);
          const bestResult = allResults.reduce(
            (best, current) => (current.accuracy > best.accuracy ? current : best),
            allResults[0]
          );

          // Save all results for display
          setTrainingResults(prev => [
            ...prev,
            ...allResults.map(result => ({
              algorithm: result.algorithm,
              accuracy: result.accuracy,
              selected: result.algorithm === bestResult.algorithm
            }))
          ]);

          // Only save the best model to storage
          await addModel({
            name: `${bestResult.algorithm} - ${targetFeature}`,
            type: getModelTypeForAlgorithm(bestResult.algorithm),
            algorithm: bestResult.algorithm,
            accuracy: bestResult.accuracy,
            datasetName,
            parameters: bestResult.parameters,
            targets: [targetFeature]
          });

          toast.success(`Best model for ${targetFeature}: ${bestResult.algorithm} with ${(bestResult.accuracy * 100).toFixed(2)}% accuracy`);
        } else {
          // Train single algorithm
          const result = await trainMLModel(data, features, targetFeature, algorithm);
          
          setTrainingResults(prev => [
            ...prev,
            {
              algorithm: result.algorithm,
              accuracy: result.accuracy,
              selected: true
            }
          ]);

          await addModel({
            name: `${result.algorithm} - ${targetFeature}`,
            type: getModelTypeForAlgorithm(result.algorithm),
            algorithm: result.algorithm,
            accuracy: result.accuracy,
            datasetName,
            parameters: result.parameters,
            targets: [targetFeature]
          });

          toast.success(`Model trained for ${targetFeature}: ${(result.accuracy * 100).toFixed(2)}% accuracy`);
        }
      }

      clearInterval(progressInterval);
      setTrainingProgress(100);
      onTrainingComplete();
    } catch (error) {
      console.error("Error training model:", error);
      toast.error("Training failed. Please try again.");
    } finally {
      setIsTraining(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "bg-green-500";
    if (accuracy >= 0.8) return "bg-emerald-500";
    if (accuracy >= 0.7) return "bg-blue-500";
    if (accuracy >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get available algorithms for the select dropdown
  const getAlgorithms = () => {
    const algorithms: Algorithm[] = [
      "Random Forest",
      "Decision Tree",
      "Linear Regression",
      "Logistic Regression",
      "SVM",
      "XGBoost",
      "Gradient Boosting",
      "AdaBoost",
      "KNN",
      "Naive Bayes",
      "LightGBM",
      "CatBoost"
    ];
    return algorithms;
  };

  const availableTargets = features.filter(f => !selectedTargets.includes(f));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Machine Learning Training</CardTitle>
        <CardDescription>
          Train classical ML models on your dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="auto-mode"
            checked={autoMode}
            onCheckedChange={setAutoMode}
            disabled={isTraining}
          />
          <Label htmlFor="auto-mode">Auto-compare algorithms</Label>
          {autoMode && (
            <Badge variant="outline" className="ml-2">
              <Sparkles className="h-3 w-3 mr-1" />
              Best algorithm will be selected
            </Badge>
          )}
        </div>

        {!autoMode && (
          <div>
            <Label htmlFor="algorithm">Select Algorithm</Label>
            <Select
              value={algorithm}
              onValueChange={(value) => setAlgorithm(value as Algorithm)}
              disabled={isTraining}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                {getAlgorithms().map((alg) => (
                  <SelectItem key={alg} value={alg}>
                    {alg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {trainingResults.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-medium">Training Results</h3>
            
            {/* Group results by target */}
            {[...new Set(selectedTargets)].map(targetFeature => {
              // Filter results for this target
              const resultsForTarget = trainingResults.filter(r => 
                r.algorithm === algorithm || autoMode
              );
              
              if (resultsForTarget.length === 0) return null;
              
              return (
                <div key={targetFeature} className="space-y-2">
                  <h4 className="text-sm font-medium">{targetFeature}</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {resultsForTarget
                      .sort((a, b) => b.accuracy - a.accuracy)
                      .map((result, index) => (
                        <div 
                          key={`${result.algorithm}-${index}`} 
                          className={`bg-secondary/50 p-3 rounded-md ${
                            result.selected ? "border-2 border-primary" : ""
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center">
                              {result.selected && <Check className="h-4 w-4 text-primary mr-1" />}
                              <span className="font-medium">{result.algorithm}</span>
                            </div>
                            <span className="font-medium">{(result.accuracy * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getAccuracyColor(result.accuracy)}`}
                              style={{ width: `${result.accuracy * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex flex-col w-full gap-2">
          <Separator className="mb-2" />
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Info className="h-4 w-4 mr-1" />
              <span>
                {autoMode
                  ? "Multiple algorithms will be compared"
                  : `Training with ${algorithm}`}
              </span>
            </div>
            <Button
              onClick={trainModel}
              disabled={isTraining}
              className="sm:w-auto w-full"
            >
              {isTraining ? "Training..." : "Train ML Model"}
              {!isTraining && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
