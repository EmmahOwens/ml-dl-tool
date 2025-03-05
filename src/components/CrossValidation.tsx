import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SplitSquareVertical, BarChart4, Play, Layers } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";

interface ValidationResult {
  fold: number;
  trainAccuracy: number;
  validationAccuracy: number;
  trainLoss: number;
  validationLoss: number;
}

export function CrossValidation() {
  const { theme } = useTheme();
  const [folds, setFolds] = useState<number>(5);
  const [validationMethod, setValidationMethod] = useState<string>("kfold");
  const [isStratified, setIsStratified] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([
    { fold: 1, trainAccuracy: 0.91, validationAccuracy: 0.85, trainLoss: 0.21, validationLoss: 0.35 },
    { fold: 2, trainAccuracy: 0.92, validationAccuracy: 0.84, trainLoss: 0.19, validationLoss: 0.37 },
    { fold: 3, trainAccuracy: 0.90, validationAccuracy: 0.87, trainLoss: 0.23, validationLoss: 0.32 },
    { fold: 4, trainAccuracy: 0.93, validationAccuracy: 0.82, trainLoss: 0.17, validationLoss: 0.39 },
    { fold: 5, trainAccuracy: 0.89, validationAccuracy: 0.86, trainLoss: 0.24, validationLoss: 0.33 },
  ]);
  
  const runValidation = () => {
    setIsRunning(true);
    
    setTimeout(() => {
      const newResults: ValidationResult[] = Array.from({ length: folds }, (_, i) => ({
        fold: i + 1,
        trainAccuracy: 0.88 + Math.random() * 0.07,
        validationAccuracy: 0.8 + Math.random() * 0.1,
        trainLoss: 0.15 + Math.random() * 0.15,
        validationLoss: 0.25 + Math.random() * 0.2,
      }));
      
      setValidationResults(newResults);
      setIsRunning(false);
    }, 2000);
  };
  
  const avgTrainAccuracy = validationResults.reduce((sum, result) => sum + result.trainAccuracy, 0) / validationResults.length;
  const avgValAccuracy = validationResults.reduce((sum, result) => sum + result.validationAccuracy, 0) / validationResults.length;
  const stdDevValAccuracy = Math.sqrt(
    validationResults.reduce((sum, result) => sum + Math.pow(result.validationAccuracy - avgValAccuracy, 2), 0) / validationResults.length
  );
  
  const distributionData = [
    { name: 'Train Accuracy', value: avgTrainAccuracy },
    { name: 'Validation Accuracy', value: avgValAccuracy },
  ];
  
  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Cross-Validation
        </CardTitle>
        <CardDescription>Evaluate your model's performance and stability across different data splits</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="setup">
          <TabsList className="mb-4">
            <TabsTrigger value="setup" className="flex items-center gap-1">
              <SplitSquareVertical className="h-4 w-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="validation-method">Validation Method</Label>
                <Select
                  value={validationMethod}
                  onValueChange={setValidationMethod}
                >
                  <SelectTrigger id="validation-method">
                    <SelectValue placeholder="Select validation method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kfold">K-Fold Cross Validation</SelectItem>
                    <SelectItem value="repeated">Repeated K-Fold</SelectItem>
                    <SelectItem value="loocv">Leave-One-Out (LOOCV)</SelectItem>
                    <SelectItem value="holdout">Holdout Validation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {validationMethod !== "loocv" && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="folds-slider">Number of Folds</Label>
                    <span className="text-sm text-muted-foreground">{folds}</span>
                  </div>
                  <Slider
                    id="folds-slider"
                    min={2}
                    max={10}
                    step={1}
                    value={[folds]}
                    onValueChange={(value) => setFolds(value[0])}
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stratified"
                  checked={isStratified}
                  onCheckedChange={(checked) => setIsStratified(checked === true)}
                />
                <Label htmlFor="stratified">
                  Use stratified sampling
                </Label>
              </div>
              
              <div className={`p-4 rounded-lg text-sm ${
                theme === "light" ? "bg-secondary/80" : "bg-secondary/30"
              }`}>
                <h3 className="font-medium mb-2">About {validationMethod === "kfold" ? "K-Fold" : 
                  validationMethod === "repeated" ? "Repeated K-Fold" :
                  validationMethod === "loocv" ? "Leave-One-Out" : "Holdout"} Validation</h3>
                <p className="text-muted-foreground">
                  {validationMethod === "kfold" && (
                    "K-Fold cross-validation splits the data into K equal parts, training the model K times, each time using a different fold as validation data and the rest for training."
                  )}
                  {validationMethod === "repeated" && (
                    "Repeated K-Fold performs standard K-Fold validation multiple times with different randomizations to get more reliable performance estimates."
                  )}
                  {validationMethod === "loocv" && (
                    "Leave-One-Out cross-validation uses a single observation as validation data and the remaining observations as training data, repeated for each observation."
                  )}
                  {validationMethod === "holdout" && (
                    "Holdout validation involves splitting the data into two sets: a training set and a validation set, with a single evaluation."
                  )}
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button
                  onClick={runValidation}
                  disabled={isRunning}
                  className="flex items-center gap-1"
                >
                  {isRunning ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Run Validation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Average Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-3xl font-bold">
                      {(avgValAccuracy * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Training: {(avgTrainAccuracy * 100).toFixed(2)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Variance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-3xl font-bold">
                      ±{(stdDevValAccuracy * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Standard deviation across folds
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Folds</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-3xl font-bold">
                      {validationResults.length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {validationMethod === "kfold" ? "K-Fold" : 
                        validationMethod === "repeated" ? "Repeated K-Fold" :
                        validationMethod === "loocv" ? "Leave-One-Out" : "Holdout"}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Validation Results by Fold</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={validationResults}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        stroke={theme === "light" ? "#e5e7eb" : "#374151"}
                      />
                      <XAxis 
                        dataKey="fold" 
                        label={{ 
                          value: "Fold", 
                          position: "insideBottomRight", 
                          offset: -5,
                          style: { fill: theme === "light" ? "#6b7280" : "#9ca3af" }
                        }}
                        stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                      />
                      <YAxis 
                        domain={[0.5, 1]}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        label={{ 
                          value: "Accuracy", 
                          angle: -90, 
                          position: "insideLeft",
                          style: { fill: theme === "light" ? "#6b7280" : "#9ca3af" }
                        }}
                        stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                      />
                      <Tooltip 
                        formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                        contentStyle={{
                          backgroundColor: theme === "light" ? "#fff" : "#1f2937",
                          borderColor: theme === "light" ? "#e5e7eb" : "#374151",
                          color: theme === "light" ? "#111827" : "#f3f4f6",
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="trainAccuracy" 
                        name="Training Accuracy" 
                        stroke={theme === "light" ? "#3b82f6" : "#60a5fa"} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="validationAccuracy" 
                        name="Validation Accuracy" 
                        stroke={theme === "light" ? "#10b981" : "#34d399"} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Accuracy Distribution</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={distributionData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={theme === "light" ? "#e5e7eb" : "#374151"}
                        />
                        <XAxis 
                          dataKey="name"
                          stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                        />
                        <YAxis 
                          domain={[0.5, 1]}
                          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                          stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                        />
                        <Tooltip 
                          formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                          contentStyle={{
                            backgroundColor: theme === "light" ? "#fff" : "#1f2937",
                            borderColor: theme === "light" ? "#e5e7eb" : "#374151",
                            color: theme === "light" ? "#111827" : "#f3f4f6",
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke={theme === "light" ? "#8b5cf6" : "#a78bfa"} 
                          fill={theme === "light" ? "#a78bfa80" : "#8b5cf680"} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Average train/validation performance across all folds
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-secondary/80" : "bg-secondary/30"
                }`}>
                  <h3 className="font-medium mb-2">Model Robustness Analysis</h3>
                  
                  <div className="space-y-3 text-sm">
                    <p>
                      {stdDevValAccuracy < 0.03 ? (
                        "Your model shows good stability across different data splits. The low variance in validation accuracy suggests reliable performance on unseen data."
                      ) : stdDevValAccuracy < 0.07 ? (
                        "Your model shows moderate stability across different data splits. Consider tuning hyperparameters or collecting more data to reduce variance."
                      ) : (
                        "Your model shows high variance across different data splits. This could indicate overfitting or sensitivity to particular data points."
                      )}
                    </p>
                    
                    <p className="text-muted-foreground">
                      {avgTrainAccuracy - avgValAccuracy > 0.1 ? (
                        "The significant gap between training and validation accuracy suggests overfitting. Consider adding regularization or simplifying your model."
                      ) : (
                        "The training and validation accuracies are relatively close, indicating a good fit without excessive overfitting."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4">
        <div>
          Cross-validation is crucial for obtaining reliable estimates of your model's performance on unseen data.
        </div>
      </CardFooter>
    </Card>
  );
}
