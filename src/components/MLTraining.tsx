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
  getModelTypeForAlgorithm,
  generateColabNotebook
} from "@/utils/mlAlgorithms";
import { Check, Info, Sparkles, Plus, X, Database, AlertTriangle, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ModelDisclaimer } from "./ModelDisclaimer";

interface MLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
  onStartTraining: () => void;
}

export function MLTraining({
  data,
  features,
  target,
  datasetName,
  onTrainingComplete,
  onStartTraining,
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
  const [isLargeDataset, setIsLargeDataset] = useState(false);
  const [dataReductionEnabled, setDataReductionEnabled] = useState(true);
  const [showColabDialog, setShowColabDialog] = useState(false);
  const [colabNotebookUrl, setColabNotebookUrl] = useState<string | null>(null);
  const [colabModelId, setColabModelId] = useState<string | null>(null);
  const [isExportingToColab, setIsExportingToColab] = useState(false);
  const [colabNotebookContent, setColabNotebookContent] = useState<string | null>(null);

  useEffect(() => {
    const LARGE_DATASET_THRESHOLD = 10000;
    setIsLargeDataset(data.length > LARGE_DATASET_THRESHOLD);
  }, [data]);

  useEffect(() => {
    const availableFeatures = features.filter(f => !selectedTargets.includes(f));
    if (availableFeatures.length > 0 && !currentTarget) {
      setCurrentTarget(availableFeatures[0]);
    }
  }, [features, selectedTargets, currentTarget]);

  const addTarget = () => {
    if (currentTarget && !selectedTargets.includes(currentTarget)) {
      setSelectedTargets([...selectedTargets, currentTarget]);
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
      
      if (!currentTarget) {
        setCurrentTarget(targetToRemove);
      }
    } else {
      toast.error("At least one target is required");
    }
  };

  const estimateMemoryUsage = (): string => {
    const bytesPerCell = 8;
    const rowCount = data.length;
    const colCount = features.length + 1;
    
    const totalBytes = rowCount * colCount * bytesPerCell;
    
    if (totalBytes < 1024 * 1024) {
      return `~${Math.round(totalBytes / 1024)} KB`;
    } else if (totalBytes < 1024 * 1024 * 1024) {
      return `~${Math.round(totalBytes / (1024 * 1024))} MB`;
    } else {
      return `~${(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  };

  const trainModel = async () => {
    try {
      setIsTraining(true);
      setTrainingProgress(0);
      setTrainingResults([]);
      onStartTraining(); // Call the onStartTraining prop when training starts

      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => {
          const newProgress = prev + Math.random() * 5;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 300);

      for (const targetFeature of selectedTargets) {
        if (autoMode) {
          const allResults = await trainAllMLModels(data, features, targetFeature);
          const bestResult = allResults.reduce(
            (best, current) => (current.accuracy > best.accuracy ? current : best),
            allResults[0]
          );

          setTrainingResults(prev => [
            ...prev,
            ...allResults.map(result => ({
              algorithm: result.algorithm,
              accuracy: result.accuracy,
              selected: result.algorithm === bestResult.algorithm
            }))
          ]);

          await addModel({
            name: `${bestResult.algorithm} - ${targetFeature}`,
            type: getModelTypeForAlgorithm(bestResult.algorithm),
            algorithm: bestResult.algorithm,
            accuracy: bestResult.accuracy,
            datasetName,
            parameters: bestResult.parameters,
            targets: [targetFeature]
          });

          const reductionMessage = bestResult.parameters.usedDataReduction 
            ? ` (using data sampling)` 
            : '';
          
          toast.success(`Best model for ${targetFeature}: ${bestResult.algorithm} with ${(bestResult.accuracy * 100).toFixed(2)}% accuracy${reductionMessage}`);
        } else {
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

          const reductionMessage = result.parameters.usedDataReduction 
            ? ` (using data sampling)` 
            : '';
          
          toast.success(`Model trained for ${targetFeature}: ${(result.accuracy * 100).toFixed(2)}% accuracy${reductionMessage}`);
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

  const exportToColab = async () => {
    try {
      setIsExportingToColab(true);
      
      const tempModelId = `temp-${Date.now()}`;
      setColabModelId(tempModelId);
      
      const result = await generateColabNotebook({
        data,
        features,
        targets: selectedTargets,
        algorithm: autoMode ? null : algorithm,
        datasetName,
        modelId: tempModelId
      });
      
      setColabNotebookContent(result.notebookContent);
      setColabNotebookUrl(null);
      setShowColabDialog(true);
      toast.success("Google Colab notebook generated successfully");
    } catch (error) {
      console.error("Error generating Colab notebook:", error);
      toast.error("Failed to generate Google Colab notebook");
    } finally {
      setIsExportingToColab(false);
    }
  };

  const downloadNotebook = () => {
    if (!colabNotebookContent) return;
    
    try {
      const blob = new Blob([colabNotebookContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${datasetName.replace(/\s+/g, '_')}_notebook.ipynb`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Notebook downloaded successfully");
    } catch (error) {
      console.error("Error downloading notebook:", error);
      toast.error("Failed to download notebook");
    }
  };

  const importTrainedModel = async () => {
    if (!colabModelId) return;
    
    try {
      toast.info("Importing trained model from Google Colab...");
      
      const response = await fetch(
        "https://uysdqwhyhqhamwvzsolw.supabase.co/functions/v1/import-trained-model",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            modelId: colabModelId,
            datasetName
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Import failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Model imported successfully!");
        setShowColabDialog(false);
        onTrainingComplete();
      } else {
        throw new Error(result.message || "Import failed");
      }
    } catch (error) {
      console.error("Error importing model:", error);
      toast.error(`Failed to import model: ${error.message}`);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "bg-green-500";
    if (accuracy >= 0.8) return "bg-emerald-500";
    if (accuracy >= 0.7) return "bg-blue-500";
    if (accuracy >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getAlgorithms = () => {
    const allAlgorithms: Algorithm[] = [
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
    
    if (isLargeDataset && data.length > 100000) {
      return allAlgorithms.filter(alg => 
        ["Decision Tree", "Linear Regression", "Logistic Regression", "Naive Bayes", "KNN"].includes(alg)
      );
    }
    
    return allAlgorithms;
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
        <ModelDisclaimer />
        
        {isLargeDataset && (
          <Alert className="mb-4">
            <Database className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-1">
              <div>
                Large dataset detected ({data.length.toLocaleString()} rows, {features.length} features). Estimated memory: {estimateMemoryUsage()}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Switch
                  id="data-reduction"
                  checked={dataReductionEnabled}
                  onCheckedChange={setDataReductionEnabled}
                  disabled={isTraining}
                />
                <Label htmlFor="data-reduction">Enable automatic data sampling for better performance</Label>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
            
            {[...new Set(selectedTargets)].map(targetFeature => {
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
                {isLargeDataset && dataReductionEnabled && " (using data sampling)"}
              </span>
            </div>
            <div className="flex gap-2 sm:w-auto w-full">
              <Button
                variant="outline"
                onClick={exportToColab}
                disabled={isTraining || isExportingToColab}
                className="sm:w-auto w-full"
              >
                {isExportingToColab ? "Generating..." : "Use Google Colab"}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
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
        </div>
      </CardFooter>

      <Dialog open={showColabDialog} onOpenChange={setShowColabDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Train with Google Colab</DialogTitle>
            <DialogDescription>
              We've generated a Google Colab notebook for advanced model training with 
              full access to Python ML libraries.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p>Follow these steps to train your model with Google Colab:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li>Click the "Download Notebook" button below</li>
                  <li>Go to <a href="https://colab.research.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Colab</a></li>
                  <li>Upload the notebook (File → Upload notebook)</li>
                  <li>Run all cells in the notebook (Runtime → Run all)</li>
                  <li>Wait for training to complete</li>
                  <li>When training is done, click "Import Trained Model" below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                className="w-full"
                onClick={downloadNotebook}
                disabled={!colabNotebookContent}
              >
                Download Notebook
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col mt-4">
              <Button 
                variant="default" 
                onClick={importTrainedModel}
              >
                Import Trained Model
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Click this after you've run the notebook and the model training is complete.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
