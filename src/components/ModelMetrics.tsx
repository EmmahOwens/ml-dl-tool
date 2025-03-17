
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Model } from "@/context/ModelContext";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, HelpCircle, Info } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModelMetricsProps {
  model: Model;
}

export function ModelMetrics({ model }: ModelMetricsProps) {
  const { metrics = {}, parameters = {} } = model;
  const isClassification = model.type === "ML" && !metrics.hasOwnProperty("r2_score");
  const isRegression = model.type === "ML" && metrics.hasOwnProperty("r2_score");
  const isClustering = model.type === "Clustering";
  
  const confusionMatrix = parameters.confusion_matrix || [];
  const featureImportance = parameters.feature_importance || {};
  
  // Convert feature importance to chart data
  const featureImportanceData = Object.entries(featureImportance)
    .map(([feature, importance]) => ({
      feature,
      importance: Number(importance)
    }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 10); // Top 10 features
    
  const formatValue = (value: number) => {
    return value.toFixed(4);
  };
  
  // Helper function to determine metric color
  const getMetricColor = (metricName: string, value: number) => {
    if (metricName === "accuracy" || metricName === "r2_score" || metricName === "precision" || 
        metricName === "recall" || metricName === "f1_score") {
      if (value > 0.8) return "text-green-600";
      if (value > 0.6) return "text-amber-600";
      return "text-red-600";
    }
    if (metricName === "mse" || metricName === "inertia") {
      if (value < 0.2) return "text-green-600";
      if (value < 0.5) return "text-amber-600";
      return "text-red-600";
    }
    return "text-foreground";
  };
  
  // Helper for confusion matrix colors
  const getConfusionMatrixColor = (value: number, max: number) => {
    const intensity = Math.min(value / max, 1);
    return `rgba(14, 165, 233, ${intensity})`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          Model Metrics
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Detailed performance metrics for this model based on test data during training.</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </CardTitle>
        <CardDescription>
          Performance analysis for {model.name} ({model.algorithm})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {featureImportanceData.length > 0 && (
              <TabsTrigger value="features">Feature Importance</TabsTrigger>
            )}
            {confusionMatrix.length > 0 && (
              <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
            )}
            {Object.keys(metrics).length > 0 && (
              <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview" className="pt-4 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Overall Accuracy</div>
                  <div className={`text-sm font-bold ${model.accuracy > 0.8 ? "text-green-600" : model.accuracy > 0.6 ? "text-amber-600" : "text-red-600"}`}>
                    {(model.accuracy * 100).toFixed(2)}%
                  </div>
                </div>
                <Progress value={model.accuracy * 100} className="h-2" />
              </div>
              
              {isClassification && (
                <div className="grid grid-cols-2 gap-4">
                  {metrics.precision !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>Precision</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Ratio of correctly predicted positive observations to total predicted positives</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("precision", metrics.precision)}>
                          {(metrics.precision * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={metrics.precision * 100} className="h-1.5" />
                    </div>
                  )}
                  
                  {metrics.recall !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>Recall</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Ratio of correctly predicted positive observations to all actual positives</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("recall", metrics.recall)}>
                          {(metrics.recall * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={metrics.recall * 100} className="h-1.5" />
                    </div>
                  )}
                  
                  {metrics.f1_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>F1 Score</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Harmonic mean of Precision and Recall</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("f1_score", metrics.f1_score)}>
                          {(metrics.f1_score * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress value={metrics.f1_score * 100} className="h-1.5" />
                    </div>
                  )}
                </div>
              )}
              
              {isRegression && (
                <div className="grid grid-cols-2 gap-4">
                  {metrics.r2_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>R² Score</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Proportion of variance in the dependent variable predictable from the independent variables</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("r2_score", metrics.r2_score)}>
                          {formatValue(metrics.r2_score)}
                        </span>
                      </div>
                      <Progress value={(metrics.r2_score + 1) / 2 * 100} className="h-1.5" />
                    </div>
                  )}
                  
                  {metrics.mse !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>MSE</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Mean Squared Error: Average squared difference between predicted and actual values</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("mse", metrics.mse)}>
                          {formatValue(metrics.mse)}
                        </span>
                      </div>
                      <Progress value={Math.max(0, (1 - metrics.mse) * 100)} className="h-1.5" />
                    </div>
                  )}
                </div>
              )}
              
              {isClustering && (
                <div className="grid grid-cols-2 gap-4">
                  {metrics.silhouette_score !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <span>Silhouette Score</span>
                          <TooltipProvider>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Measure of how similar an object is to its own cluster compared to other clusters</p>
                              </TooltipContent>
                            </UITooltip>
                          </TooltipProvider>
                        </div>
                        <span className={getMetricColor("silhouette_score", metrics.silhouette_score)}>
                          {formatValue(metrics.silhouette_score)}
                        </span>
                      </div>
                      <Progress value={(metrics.silhouette_score + 1) / 2 * 100} className="h-1.5" />
                    </div>
                  )}
                  
                  {metrics.n_clusters !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Clusters:</span>
                      <span className="font-semibold">{metrics.n_clusters}</span>
                    </div>
                  )}
                </div>
              )}
              
              {model.type === "DL" && (
                <div className="space-y-4">
                  <Separator />
                  <div className="text-sm">Neural Network Architecture</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="bg-muted px-2 py-1 rounded text-xs">
                      Input ({model.neuralNetworkArchitecture?.[0]?.neurons || "?"})
                    </div>
                    {Array.isArray(model.neuralNetworkArchitecture) && 
                      model.neuralNetworkArchitecture.map((layer, i) => (
                        <React.Fragment key={i}>
                          <div className="text-muted-foreground">→</div>
                          <div className="bg-muted px-2 py-1 rounded text-xs">
                            {layer.neurons} ({layer.activation})
                            {layer.dropout ? ` D:${layer.dropout}` : ''}
                          </div>
                        </React.Fragment>
                      ))
                    }
                    <div className="text-muted-foreground">→</div>
                    <div className="bg-muted px-2 py-1 rounded text-xs">
                      Output (1)
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {featureImportanceData.length > 0 && (
            <TabsContent value="features" className="pt-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="feature" type="category" width={150} />
                    <Tooltip formatter={(value) => [`${value.toFixed(4)}`, 'Importance']} />
                    <Bar dataKey="importance" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Feature importance shows which input variables have the most impact on predictions.
              </div>
            </TabsContent>
          )}
          
          {confusionMatrix.length > 0 && (
            <TabsContent value="confusion" className="pt-4">
              <div className="flex justify-center">
                <div className="relative overflow-auto border rounded">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 text-xs text-muted-foreground"></th>
                        <th className="p-2 text-xs text-muted-foreground" colSpan={confusionMatrix[0]?.length || 0}>Predicted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confusionMatrix.map((row, i) => {
                        const maxValue = Math.max(...confusionMatrix.flat());
                        return (
                          <tr key={i}>
                            {i === 0 && (
                              <td className="p-2 text-xs text-muted-foreground font-bold" rowSpan={confusionMatrix.length}>
                                <div className="transform -rotate-90">Actual</div>
                              </td>
                            )}
                            {row.map((value, j) => (
                              <td 
                                key={j} 
                                className="p-4 text-center border"
                                style={{ 
                                  backgroundColor: getConfusionMatrixColor(value, maxValue),
                                  minWidth: '60px'
                                }}
                              >
                                <div className="font-semibold">{value}</div>
                                <div className="text-xs mt-1">
                                  {i === j ? (
                                    <span className="text-green-800">True</span>
                                  ) : (
                                    <span className="text-red-800">False</span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Confusion matrix shows correct predictions on the diagonal and incorrect predictions elsewhere.
              </div>
            </TabsContent>
          )}
          
          {Object.keys(metrics).length > 0 && (
            <TabsContent value="details" className="pt-4">
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {Object.entries(metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                        <TooltipProvider>
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{getMetricDescription(key)}</p>
                            </TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                      <div className={`text-sm font-semibold ${typeof value === 'number' ? getMetricColor(key, value) : ''}`}>
                        {typeof value === 'number' 
                          ? key.includes('accuracy') || key.includes('precision') || key.includes('recall') || key.includes('f1') 
                            ? `${(value * 100).toFixed(2)}%` 
                            : formatValue(value)
                          : String(value)
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to get descriptions for metrics
function getMetricDescription(metricName: string): string {
  const descriptions: Record<string, string> = {
    accuracy: "Proportion of correct predictions among the total number of predictions",
    precision: "Proportion of correct positive predictions out of all positive predictions",
    recall: "Proportion of actual positives correctly identified",
    f1_score: "Harmonic mean of precision and recall",
    r2_score: "Coefficient of determination - proportion of variance predictable from features",
    mse: "Mean squared error - average of squared differences between predictions and actual values",
    mae: "Mean absolute error - average of absolute differences between predictions and actual values",
    silhouette_score: "Measure of how similar an object is to its own cluster compared to other clusters",
    inertia: "Sum of squared distances of samples to their closest cluster center",
    n_clusters: "Number of clusters identified",
    val_accuracy: "Accuracy on validation data during training",
    val_mae: "Mean absolute error on validation data during training",
    epochs_used: "Number of training epochs/iterations used",
    coef: "Model coefficients for features"
  };
  
  return descriptions[metricName] || "Additional metric for model evaluation";
}
