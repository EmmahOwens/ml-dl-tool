
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Brain, Calculator, CheckCircle2, ChevronsUpDown, Loader2, Table, X } from "lucide-react";
import { useModels, Model } from "@/context/ModelContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModelPredictionProps {
  model: Model;
  features?: string[];
}

export function ModelPrediction({ model, features }: ModelPredictionProps) {
  const { predictWithModel } = useModels();
  
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<any[] | null>(null);
  const [probabilities, setProbabilities] = useState<any[] | null>(null);
  const [explanation, setExplanation] = useState<any | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  
  // Use features from props or from model
  const modelFeatures = features || model.parameters?.features || [];
  
  const handleInputChange = (feature: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [feature]: value
    }));
  };
  
  const validateInputs = () => {
    const missingFeatures = modelFeatures.filter(feature => !inputValues[feature]);
    if (missingFeatures.length > 0) {
      setError(`Missing values for: ${missingFeatures.join(', ')}`);
      return false;
    }
    
    // Check if all inputs are valid numbers
    for (const [feature, value] of Object.entries(inputValues)) {
      if (isNaN(Number(value))) {
        setError(`Invalid number for ${feature}: ${value}`);
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  const handlePredict = async () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    setPredictions(null);
    setProbabilities(null);
    setExplanation(null);
    
    try {
      // Format inputs as array in the same order as features
      const inputData = [modelFeatures.map(feature => Number(inputValues[feature] || 0))];
      
      const result = await predictWithModel(model.id, inputData);
      
      if (!result.success) {
        throw new Error("Prediction failed");
      }
      
      setPredictions(Array.isArray(result.predictions) ? result.predictions : [result.predictions]);
      setProbabilities(result.probabilities || []);
      setExplanation(result.explanation || null);
    } catch (err) {
      console.error("Error making prediction:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setInputValues({});
    setPredictions(null);
    setProbabilities(null);
    setExplanation(null);
    setError(null);
  };
  
  // Generate sample data
  const generateSampleData = () => {
    // Reset previous results
    setPredictions(null);
    setProbabilities(null);
    setExplanation(null);
    
    // Create sample input values for each feature
    const sampleData: Record<string, string> = {};
    modelFeatures.forEach(feature => {
      // Generate a random number (assuming numeric features)
      const randomValue = Math.round(Math.random() * 100) / 10;
      sampleData[feature] = randomValue.toString();
    });
    
    setInputValues(sampleData);
  };
  
  // Format prediction output based on model type
  const formatPrediction = (prediction: any): string => {
    if (typeof prediction === 'number') {
      return prediction.toFixed(4);
    }
    return String(prediction);
  };
  
  // For classification models that output probabilities
  const formatProbabilities = () => {
    if (!probabilities || probabilities.length === 0) return null;
    
    // Check structure of probabilities array
    const firstProb = probabilities[0];
    if (!Array.isArray(firstProb)) return null;
    
    // Format for visualization
    return firstProb.map((prob, index) => ({
      class: `Class ${index}`,
      probability: prob
    })).sort((a, b) => b.probability - a.probability);
  };
  
  const probabilityData = formatProbabilities();
  
  // Format feature importance data from explanation
  const formatFeatureImportance = () => {
    if (!explanation) return null;
    
    if (explanation.feature_importance) {
      return modelFeatures.map((feature, index) => ({
        feature,
        importance: explanation.feature_importance[index]
      })).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
    }
    
    if (explanation.coefficients) {
      return modelFeatures.map((feature, index) => ({
        feature,
        importance: explanation.coefficients[index]
      })).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
    }
    
    return null;
  };
  
  const featureImportanceData = formatFeatureImportance();
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="mr-2 h-5 w-5" />
          Make Predictions with {model.name}
        </CardTitle>
        <CardDescription>
          Enter feature values to get predictions from this {model.algorithm} model
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {modelFeatures.slice(0, 10).map(feature => (
            <div key={feature} className="space-y-2">
              <Label htmlFor={`input-${feature}`} className="text-sm font-medium">
                {feature}
              </Label>
              <Input
                id={`input-${feature}`}
                value={inputValues[feature] || ''}
                onChange={(e) => handleInputChange(feature, e.target.value)}
                type="number"
                step="any"
                placeholder={`Enter ${feature} value`}
              />
            </div>
          ))}
          
          {modelFeatures.length > 10 && (
            <div className="md:col-span-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This model has {modelFeatures.length} features. Showing only the first 10 for simplicity.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <Button variant="outline" type="button" onClick={generateSampleData}>
            Generate Sample Data
          </Button>
          <Button variant="outline" type="button" onClick={resetForm}>
            Reset
          </Button>
          <Button type="button" onClick={handlePredict} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Predict <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        
        {predictions && predictions.length > 0 && (
          <div className="mt-6">
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                Prediction Results
              </h3>
              
              <div className="rounded-md border p-4 bg-muted/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Predicted value:</span>
                    <span className="text-xl font-bold">{formatPrediction(predictions[0])}</span>
                  </div>
                  
                  {probabilityData && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Prediction Probabilities:</h4>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={probabilityData} layout="vertical" margin={{ left: 100 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                            <YAxis dataKey="class" type="category" width={80} />
                            <Tooltip formatter={(value) => [`${(Number(value) * 100).toFixed(2)}%`, 'Probability']} />
                            <Bar dataKey="probability" fill="#22c55e" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {featureImportanceData && (
                <Collapsible
                  open={isExplanationOpen}
                  onOpenChange={setIsExplanationOpen}
                  className="border rounded-md p-2"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 rounded">
                      <h4 className="text-sm font-medium flex items-center">
                        <Brain className="mr-2 h-4 w-4" />
                        Model Explanation
                      </h4>
                      <ChevronsUpDown className="h-4 w-4" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="space-y-4 p-2">
                      <p className="text-sm text-muted-foreground">
                        This chart shows how each feature influenced the prediction:
                      </p>
                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 100 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="feature" type="category" width={100} />
                            <Tooltip formatter={(value) => [`${Number(value).toFixed(4)}`, 'Importance']} />
                            <Bar 
                              dataKey="importance" 
                              fill={(entry) => entry.importance > 0 ? "#3b82f6" : "#ef4444"}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {explanation.feature_importance ? 
                          "Longer bars indicate features with higher impact on the prediction." : 
                          "Positive values indicate positive influence on prediction, negative values indicate negative influence."}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
