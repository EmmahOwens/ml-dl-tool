
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Settings2, BarChart4, Cpu, Play, RotateCcw } from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts";

interface HyperparamOption {
  name: string;
  label: string;
  type: "range" | "number" | "select" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  value: any;
}

interface TuningResult {
  id: number;
  params: Record<string, any>;
  accuracy: number;
  loss: number;
  trainingTime: number;
}

export function HyperparameterTuning() {
  const { theme } = useTheme();
  const [algorithm, setAlgorithm] = useState("RandomForest");
  const [tuningMethod, setTuningMethod] = useState("grid");
  const [isAutomatic, setIsAutomatic] = useState(true);
  const [isTuning, setIsTuning] = useState(false);
  
  const [hyperparams, setHyperparams] = useState<HyperparamOption[]>([
    { name: "n_estimators", label: "Number of Estimators", type: "range", min: 10, max: 500, step: 10, value: 100 },
    { name: "max_depth", label: "Max Depth", type: "range", min: 1, max: 50, step: 1, value: 10 },
    { name: "min_samples_split", label: "Min Samples Split", type: "range", min: 2, max: 20, step: 1, value: 2 },
    { name: "criterion", label: "Split Criterion", type: "select", options: ["gini", "entropy"], value: "gini" },
    { name: "bootstrap", label: "Bootstrap", type: "boolean", value: true },
  ]);
  
  const [tuningResults, setTuningResults] = useState<TuningResult[]>([
    { id: 1, params: { n_estimators: 100, max_depth: 10 }, accuracy: 0.82, loss: 0.35, trainingTime: 5.2 },
    { id: 2, params: { n_estimators: 200, max_depth: 15 }, accuracy: 0.85, loss: 0.31, trainingTime: 8.4 },
    { id: 3, params: { n_estimators: 150, max_depth: 20 }, accuracy: 0.87, loss: 0.28, trainingTime: 7.1 },
    { id: 4, params: { n_estimators: 300, max_depth: 25 }, accuracy: 0.86, loss: 0.29, trainingTime: 12.5 },
    { id: 5, params: { n_estimators: 250, max_depth: 15 }, accuracy: 0.88, loss: 0.25, trainingTime: 10.8 },
  ]);
  
  const startTuning = () => {
    setIsTuning(true);
    
    // Simulate tuning process - would be replaced with actual API call
    setTimeout(() => {
      setIsTuning(false);
      
      // Add a simulated new result
      const newResult: TuningResult = {
        id: tuningResults.length + 1,
        params: {
          n_estimators: hyperparams.find(p => p.name === "n_estimators")?.value,
          max_depth: hyperparams.find(p => p.name === "max_depth")?.value,
        },
        accuracy: 0.8 + Math.random() * 0.15,
        loss: 0.4 - Math.random() * 0.2,
        trainingTime: 5 + Math.random() * 10,
      };
      
      setTuningResults([...tuningResults, newResult]);
    }, 3000);
  };
  
  const resetTuning = () => {
    setHyperparams([
      { name: "n_estimators", label: "Number of Estimators", type: "range", min: 10, max: 500, step: 10, value: 100 },
      { name: "max_depth", label: "Max Depth", type: "range", min: 1, max: 50, step: 1, value: 10 },
      { name: "min_samples_split", label: "Min Samples Split", type: "range", min: 2, max: 20, step: 1, value: 2 },
      { name: "criterion", label: "Split Criterion", type: "select", options: ["gini", "entropy"], value: "gini" },
      { name: "bootstrap", label: "Bootstrap", type: "boolean", value: true },
    ]);
  };
  
  const updateHyperparam = (name: string, value: any) => {
    setHyperparams(hyperparams.map(param => 
      param.name === name ? { ...param, value } : param
    ));
  };
  
  const bestResult = tuningResults.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best, tuningResults[0]);
  
  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Hyperparameter Tuning
            </CardTitle>
            <CardDescription>Optimize model performance by tuning hyperparameters</CardDescription>
          </div>
          
          <Select value={algorithm} onValueChange={setAlgorithm}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RandomForest">Random Forest</SelectItem>
              <SelectItem value="GradientBoosting">Gradient Boosting</SelectItem>
              <SelectItem value="SVM">SVM</SelectItem>
              <SelectItem value="NeuralNetwork">Neural Network</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="manual">
          <TabsList className="mb-4">
            <TabsTrigger value="manual" className="flex items-center gap-1">
              <Settings2 className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <BarChart4 className="h-4 w-4" />
              Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
            <div className="grid gap-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="automatic-tuning"
                    checked={isAutomatic}
                    onCheckedChange={setIsAutomatic}
                  />
                  <Label htmlFor="automatic-tuning">Automatic tuning</Label>
                </div>
                
                {isAutomatic && (
                  <Select value={tuningMethod} onValueChange={setTuningMethod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tuning method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid Search</SelectItem>
                      <SelectItem value="random">Random Search</SelectItem>
                      <SelectItem value="bayesian">Bayesian Optimization</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="space-y-4">
                {hyperparams.map((param) => (
                  <div key={param.name} className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor={param.name}>{param.label}</Label>
                      {param.type !== "boolean" && (
                        <span className="text-sm text-muted-foreground">
                          {param.value}
                        </span>
                      )}
                    </div>
                    
                    {param.type === "range" && (
                      <Slider
                        id={param.name}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={[param.value]}
                        onValueChange={(value) => updateHyperparam(param.name, value[0])}
                      />
                    )}
                    
                    {param.type === "number" && (
                      <Input
                        id={param.name}
                        type="number"
                        value={param.value}
                        onChange={(e) => updateHyperparam(param.name, Number(e.target.value))}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                      />
                    )}
                    
                    {param.type === "select" && (
                      <Select
                        value={param.value}
                        onValueChange={(value) => updateHyperparam(param.name, value)}
                      >
                        <SelectTrigger id={param.name}>
                          <SelectValue placeholder={`Select ${param.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {param.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {param.type === "boolean" && (
                      <Switch
                        id={param.name}
                        checked={param.value}
                        onCheckedChange={(checked) => updateHyperparam(param.name, checked)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetTuning}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              
              <Button 
                onClick={startTuning}
                disabled={isTuning}
                className="flex items-center gap-1"
              >
                {isTuning ? (
                  <>
                    <Cpu className="h-4 w-4 animate-pulse" />
                    Tuning...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Tuning
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3"
                      stroke={theme === "light" ? "#e5e7eb" : "#374151"}
                    />
                    <XAxis 
                      type="number" 
                      dataKey="params.n_estimators" 
                      name="Estimators" 
                      unit="" 
                      domain={['auto', 'auto']}
                      label={{ 
                        value: "Number of Estimators",
                        position: "bottom", 
                        style: { fill: theme === "light" ? "#6b7280" : "#9ca3af" } 
                      }}
                      stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="params.max_depth" 
                      name="Max Depth" 
                      unit=""
                      label={{ 
                        value: "Max Depth", 
                        angle: -90, 
                        position: "insideLeft",
                        style: { fill: theme === "light" ? "#6b7280" : "#9ca3af" }
                      }}
                      stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="accuracy" 
                      range={[60, 400]} 
                      name="Accuracy" 
                      unit=""
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === "Accuracy") return [`${(value * 100).toFixed(2)}%`, name];
                        return [value, name];
                      }}
                      contentStyle={{
                        backgroundColor: theme === "light" ? "#fff" : "#1f2937",
                        borderColor: theme === "light" ? "#e5e7eb" : "#374151",
                        color: theme === "light" ? "#111827" : "#f3f4f6",
                      }}
                    />
                    <Scatter 
                      name="Results" 
                      data={tuningResults} 
                      fill={theme === "light" ? "#3b82f6" : "#8b5cf6"}
                      fillOpacity={0.6}
                      stroke={theme === "light" ? "#2563eb" : "#7c3aed"}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === "light" ? "bg-secondary/80" : "bg-secondary/30"
              }`}>
                <h3 className="text-base font-medium mb-2">Best Hyperparameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="space-y-2 text-sm">
                      {Object.entries(bestResult.params).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="font-medium">{(bestResult.accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Loss:</span>
                        <span>{bestResult.loss.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Training Time:</span>
                        <span>{bestResult.trainingTime.toFixed(1)}s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <div>Evaluated {tuningResults.length} parameter combinations</div>
        <div className="flex items-center gap-1">
          <Settings2 className="h-3 w-3" />
          <span>
            Using {tuningMethod === "grid" ? "Grid Search" : 
                  tuningMethod === "random" ? "Random Search" : "Bayesian Optimization"}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
