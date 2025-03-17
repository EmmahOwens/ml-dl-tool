
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Model, useModels } from "@/context/ModelContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { PlusCircle, UploadCloud, AlertCircle, CheckCircle2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ModelPredictionProps {
  model: Model;
  isClusteringModel?: boolean;
}

export function ModelPrediction({ model, isClusteringModel = false }: ModelPredictionProps) {
  const { predictWithModel } = useModels();
  const [inputRows, setInputRows] = useState<Array<Record<string, number | string>>>([{}]);
  const [results, setResults] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);
  const [probabilities, setProbabilities] = useState<any[] | null>(null);
  
  useEffect(() => {
    if (model && model.parameters && model.parameters.availableFeatures) {
      setFeatures(model.parameters.availableFeatures);
    } else if (model && model.parameters && model.parameters.feature_importance) {
      setFeatures(Object.keys(model.parameters.feature_importance));
    } else {
      setFeatures([]);
    }
  }, [model]);
  
  useEffect(() => {
    if (features.length > 0 && inputRows.length === 1 && Object.keys(inputRows[0]).length === 0) {
      const initialRow = features.reduce((acc, feature) => {
        acc[feature] = '';
        return acc;
      }, {} as Record<string, string | number>);
      
      setInputRows([initialRow]);
    }
  }, [features, inputRows]);
  
  const handleInputChange = (rowIndex: number, feature: string, value: string) => {
    const newRows = [...inputRows];
    
    const parsedValue = !isNaN(parseFloat(value)) ? parseFloat(value) : value;
    
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [feature]: parsedValue
    };
    
    setInputRows(newRows);
  };
  
  const addRow = () => {
    const newRow = features.reduce((acc, feature) => {
      acc[feature] = '';
      return acc;
    }, {} as Record<string, string | number>);
    
    setInputRows([...inputRows, newRow]);
  };
  
  const removeRow = (index: number) => {
    if (inputRows.length > 1) {
      const newRows = [...inputRows];
      newRows.splice(index, 1);
      setInputRows(newRows);
    }
  };
  
  const predict = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);
      setProbabilities(null);
      setExplanation(null);
      
      const missingValues = inputRows.some(row => 
        features.some(feature => row[feature] === undefined || row[feature] === '')
      );
      
      if (missingValues) {
        throw new Error("Please fill in all input values before making predictions");
      }
      
      const inputData = inputRows.map(row => {
        return features.map(feature => {
          const value = row[feature];
          return typeof value === 'string' && !isNaN(parseFloat(value)) ? 
            parseFloat(value) : value;
        });
      });
      
      const result = await predictWithModel(model.id, inputData);
      
      if (!result.success) {
        throw new Error("Prediction failed. Please try again.");
      }
      
      setResults(result.predictions);
      if (result.probabilities) {
        setProbabilities(result.probabilities);
      }
      if (result.explanation) {
        setExplanation(result.explanation);
      }
      
      toast.success("Prediction completed successfully");
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error("Prediction failed");
    } finally {
      setLoading(false);
    }
  };
  
  const formatPredictionResult = (prediction: any, index: number) => {
    if (prediction === null || prediction === undefined) return "N/A";
    
    if (model.parameters?.class_names && Array.isArray(model.parameters.class_names)) {
      const classIndex = typeof prediction === "number" ? 
        Math.round(prediction) : 
        parseInt(prediction);
      
      return model.parameters.class_names[classIndex] || prediction;
    }
    
    if (typeof prediction === "number") {
      return prediction.toFixed(4);
    }
    
    return String(prediction);
  };
  
  const prepareProbabilityChart = (probsArray: any[], index: number) => {
    if (!probsArray || !Array.isArray(probsArray) || !probsArray[index]) return [];
    
    const probs = probsArray[index];
    return probs.map((prob: number, i: number) => {
      const label = model.parameters?.class_names && Array.isArray(model.parameters.class_names) ?
        model.parameters.class_names[i] : `Class ${i}`;
      
      return {
        name: label,
        probability: prob,
        value: prob,
        isHighest: prob === Math.max(...probs)
      };
    });
  };
  
  const hasFeatureImportanceExplanation = () => {
    return explanation && 
           (explanation.feature_importance || 
            explanation.coefficients ||
            explanation.shap_values);
  };
  
  const targetNames = model.targets || ["Target"];
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Make Predictions</CardTitle>
        <CardDescription>
          Enter input values to make predictions with the {model.algorithm} model
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Input Features</Label>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addRow}
                disabled={loading}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Row
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {features.map(feature => (
                    <TableHead key={feature} className="whitespace-nowrap">
                      {feature}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {features.map(feature => (
                      <TableCell key={feature} className="py-2">
                        <Input 
                          value={row[feature] !== undefined ? String(row[feature]) : ''} 
                          onChange={(e) => handleInputChange(rowIndex, feature, e.target.value)}
                          placeholder="Enter value"
                          className="w-full"
                          disabled={loading}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="py-2">
                      {inputRows.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRow(rowIndex)}
                          disabled={loading}
                        >
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        {results && (
          <div className="space-y-4 pt-4">
            <Separator />
            <div>
              <h3 className="text-sm font-medium mb-3">Prediction Results</h3>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Row</TableHead>
                      {targetNames.map((target, i) => (
                        <TableHead key={i}>{target}</TableHead>
                      ))}
                      {probabilities && probabilities.length > 0 && (
                        <TableHead>Confidence</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, rowIndex) => {
                      const isArray = Array.isArray(result);
                      return (
                        <TableRow key={rowIndex}>
                          <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                          {isArray ? (
                            result.map((val, j) => (
                              <TableCell key={j}>
                                <Badge variant="outline" className="font-mono">
                                  {formatPredictionResult(val, j)}
                                </Badge>
                              </TableCell>
                            ))
                          ) : (
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {formatPredictionResult(result, 0)}
                              </Badge>
                            </TableCell>
                          )}
                          {probabilities && probabilities.length > 0 && (
                            <TableCell>
                              <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary rounded-full"
                                  style={{ 
                                    width: `${Math.max(...(Array.isArray(probabilities[rowIndex]) ? 
                                      probabilities[rowIndex] : [0])) * 100}%` 
                                  }}
                                />
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {probabilities && probabilities.length > 0 && probabilities[0] && probabilities[0].length > 1 && (
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-3">Class Probabilities</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {probabilities.map((probs, rowIndex) => (
                    <div key={rowIndex} className="border rounded-md p-4">
                      <h4 className="text-sm font-medium mb-2">Row {rowIndex + 1}</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={prepareProbabilityChart(probabilities, rowIndex)}>
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                          <Tooltip 
                            formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Probability"]} 
                          />
                          <Bar 
                            dataKey="value" 
                            fill={(entry) => entry.isHighest ? "#3b82f6" : "#ef4444"}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {hasFeatureImportanceExplanation() && (
              <Collapsible open={explanationOpen} onOpenChange={setExplanationOpen}>
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Prediction Explanation</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {explanationOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="pt-2">
                  {explanation.feature_importance && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium">Feature Importance</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {Object.entries(explanation.feature_importance)
                          .sort(([, a]: [string, any], [, b]: [string, any]) => b - a)
                          .map(([feature, value]: [string, any], index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{feature}</span>
                              <span className="font-mono">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                  
                  {explanation.coefficients && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-medium">Coefficients</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {Object.entries(explanation.coefficients)
                          .map(([feature, value]: [string, any], index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span>{feature}</span>
                              <span className="font-mono">{typeof value === 'number' ? value.toFixed(4) : value}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={predict} 
          disabled={loading || features.length === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Making Prediction...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Make Prediction
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
