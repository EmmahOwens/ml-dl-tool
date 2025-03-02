
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trainNeuralNetwork, optimizeNeuralNetwork } from "@/utils/dlNetworks";
import { NeuralNetworkLayer, useModels } from "@/context/ModelContext";
import { Check, Info, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface DLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
}

export function DLTraining({ data, features, target, datasetName, onTrainingComplete }: DLTrainingProps) {
  const { addModel } = useModels();
  const [isCustom, setIsCustom] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([target]);
  const [currentTarget, setCurrentTarget] = useState<string>("");
  const [trainingResults, setTrainingResults] = useState<{target: string, accuracy: number, layers: number}[]>([]);
  
  // Neural network parameters
  const [networkArchitecture, setNetworkArchitecture] = useState<NeuralNetworkLayer[]>([
    { neurons: 64, activation: "ReLU", dropout: 0.2 },
    { neurons: 32, activation: "ReLU", dropout: 0.1 }
  ]);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState(0.001);

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

  const addLayer = () => {
    setNetworkArchitecture([...networkArchitecture, { neurons: 32, activation: "ReLU", dropout: 0.1 }]);
  };

  const removeLayer = (index: number) => {
    setNetworkArchitecture(networkArchitecture.filter((_, i) => i !== index));
  };

  const updateLayer = (index: number, field: keyof NeuralNetworkLayer, value: any) => {
    const newArchitecture = [...networkArchitecture];
    newArchitecture[index] = {
      ...newArchitecture[index],
      [field]: value
    };
    setNetworkArchitecture(newArchitecture);
  };

  const trainModel = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingResults([]);
    
    const newResults: {target: string, accuracy: number, layers: number}[] = [];

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 500);

      // Train model for each selected target
      for (const targetFeature of selectedTargets) {
        let result;
        
        if (isCustom) {
          // Train with custom architecture
          result = await trainNeuralNetwork(
            data, 
            features, 
            targetFeature, 
            networkArchitecture,
            epochs,
            learningRate
          );
          
          newResults.push({
            target: targetFeature,
            accuracy: result.accuracy,
            layers: networkArchitecture.length
          });
        } else {
          // Use auto-optimization
          result = await optimizeNeuralNetwork(data, features, targetFeature);
          
          newResults.push({
            target: targetFeature,
            accuracy: result.accuracy,
            layers: Array.isArray(result.neuralNetworkArchitecture) ? result.neuralNetworkArchitecture.length : 3
          });
        }

        // Add model to storage
        await addModel({
          name: `Neural Network - ${targetFeature}${isCustom ? ' (Custom)' : ' (Auto)'}`,
          type: "DL",
          algorithm: "Neural Network",
          accuracy: result.accuracy,
          datasetName,
          parameters: result.parameters,
          neuralNetworkArchitecture: result.neuralNetworkArchitecture,
          targets: [targetFeature]
        });
      }

      setTrainingResults(newResults);
      clearInterval(progressInterval);
      setTrainingProgress(100);
      
      toast.success(`${selectedTargets.length} neural network(s) trained successfully`);
      onTrainingComplete();
    } catch (error) {
      console.error("Training error:", error);
      toast.error("Training failed. Please try again.");
    } finally {
      setIsTraining(false);
    }
  };

  const availableTargets = features.filter(f => !selectedTargets.includes(f));

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "bg-green-500";
    if (accuracy >= 0.8) return "bg-emerald-500";
    if (accuracy >= 0.7) return "bg-blue-500";
    if (accuracy >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deep Learning Training</CardTitle>
        <CardDescription>
          Train neural networks on your dataset.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="custom-mode"
            checked={isCustom}
            onCheckedChange={setIsCustom}
            disabled={isTraining}
          />
          <Label htmlFor="custom-mode">Custom Architecture</Label>
        </div>

        {isCustom && (
          <div className="space-y-4 pt-2">
            {networkArchitecture.map((layer, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 border rounded-md">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Layer {index + 1}</h4>
                  {networkArchitecture.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeLayer(index)}
                      disabled={isTraining}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`neurons-${index}`} className="text-xs">Neurons</Label>
                    <Input
                      id={`neurons-${index}`}
                      type="number"
                      min={1}
                      max={512}
                      value={layer.neurons}
                      onChange={(e) => updateLayer(index, "neurons", parseInt(e.target.value))}
                      disabled={isTraining}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`activation-${index}`} className="text-xs">Activation</Label>
                    <Select
                      value={layer.activation}
                      onValueChange={(value) => updateLayer(index, "activation", value)}
                      disabled={isTraining}
                    >
                      <SelectTrigger id={`activation-${index}`}>
                        <SelectValue placeholder="Activation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ReLU">ReLU</SelectItem>
                        <SelectItem value="Sigmoid">Sigmoid</SelectItem>
                        <SelectItem value="Tanh">Tanh</SelectItem>
                        <SelectItem value="Linear">Linear</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`dropout-${index}`} className="text-xs">Dropout: {layer.dropout?.toFixed(2)}</Label>
                  </div>
                  <Slider
                    id={`dropout-${index}`}
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={[layer.dropout || 0]}
                    onValueChange={([value]) => updateLayer(index, "dropout", value)}
                    disabled={isTraining}
                  />
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addLayer}
              className="w-full"
              disabled={isTraining}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Layer
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="epochs" className="text-sm">Epochs: {epochs}</Label>
                <Slider
                  id="epochs"
                  min={10}
                  max={200}
                  step={10}
                  value={[epochs]}
                  onValueChange={([value]) => setEpochs(value)}
                  disabled={isTraining}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="learning-rate" className="text-sm">Learning Rate: {learningRate.toFixed(4)}</Label>
                <Slider
                  id="learning-rate"
                  min={0.0001}
                  max={0.01}
                  step={0.0001}
                  value={[learningRate]}
                  onValueChange={([value]) => setLearningRate(value)}
                  disabled={isTraining}
                />
              </div>
            </div>
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
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium">Training Results</h3>
            <div className="space-y-2">
              {trainingResults
                .sort((a, b) => b.accuracy - a.accuracy)
                .map((result, index) => (
                  <div key={result.target} className="bg-secondary/50 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        {index === 0 && trainingResults.length > 1 && <Badge className="mr-2">Best</Badge>}
                        <span className="font-medium">{result.target}</span>
                      </div>
                      <span className="font-medium">{(result.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getAccuracyColor(result.accuracy)}`}
                        style={{ width: `${result.accuracy * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isCustom ? 'Custom network' : 'Auto-optimized'} with {result.layers} layers
                    </div>
                  </div>
                ))}
            </div>
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
                {isCustom 
                  ? `Custom network with ${networkArchitecture.length} layers` 
                  : "Auto-optimized network architecture"}
              </span>
            </div>
            <Button 
              onClick={trainModel} 
              disabled={isTraining}
              className="sm:w-auto w-full"
            >
              {isTraining ? "Training..." : "Train Neural Network"}
              {!isTraining && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
