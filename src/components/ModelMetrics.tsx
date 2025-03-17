
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Model } from "@/context/ModelContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Brain, BarChart3, TrendingUp, Activity, Layers } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface ModelMetricsProps {
  model: Model;
}

export function ModelMetrics({ model }: ModelMetricsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Safely extract metrics from parameters
  const metrics = model.parameters?.metrics || {};
  const featureImportance = model.parameters?.feature_importance || {};
  const confusionMatrix = model.parameters?.confusion_matrix || null;
  
  // Format feature importance data for chart
  const featureImportanceData = Object.entries(featureImportance).map(([feature, value]) => ({
    feature: feature.length > 15 ? `${feature.substring(0, 12)}...` : feature,
    importance: typeof value === 'number' ? value : 0,
    fullName: feature
  })).sort((a, b) => b.importance - a.importance).slice(0, 10);
  
  // Helper function to determine if a model is classification or regression
  const isClassificationModel = () => {
    // Check algorithm type
    const classificationAlgorithms = [
      "Logistic Regression", "Decision Tree", "Random Forest", 
      "SVM", "XGBoost", "KNN", "Naive Bayes"
    ];
    
    if (classificationAlgorithms.includes(model.algorithm)) return true;
    
    // Check metrics
    return metrics.accuracy !== undefined && metrics.r2_score === undefined;
  };
  
  // Helper to get proper metric name
  const getMainMetricName = () => {
    if (isClassificationModel()) return "Accuracy";
    return "R² Score";
  };
  
  // Helper to get proper metric value
  const getMainMetricValue = () => {
    if (isClassificationModel()) {
      return metrics.accuracy !== undefined ? 
        (metrics.accuracy * 100).toFixed(2) + "%" : 
        (model.accuracy * 100).toFixed(2) + "%";
    }
    return metrics.r2_score !== undefined ? 
      metrics.r2_score.toFixed(4) : 
      model.accuracy.toFixed(4);
  };
  
  // Process neural network architecture if available
  const renderNeuralNetworkArchitecture = () => {
    if (!model.neuralNetworkArchitecture || model.algorithm !== "Neural Network") {
      return <p className="text-muted-foreground">No neural network architecture available.</p>;
    }
    
    // Calculate the max number of neurons for scaling
    let maxNeurons = 0;
    if (Array.isArray(model.neuralNetworkArchitecture)) {
      model.neuralNetworkArchitecture.forEach((layer) => {
        if (typeof layer === 'object' && layer.neurons > maxNeurons) {
          maxNeurons = layer.neurons;
        }
      });
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Neural Network Architecture</h3>
        <div className="flex items-center justify-center space-x-2 py-8">
          {Array.isArray(model.neuralNetworkArchitecture) && model.neuralNetworkArchitecture.map((layer, index) => {
            const neurons = typeof layer === 'object' ? layer.neurons : layer;
            const activation = typeof layer === 'object' ? layer.activation : "ReLU";
            const layerHeight = Math.max(50, (neurons / maxNeurons) * 150);
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="bg-primary/80 rounded-lg flex items-center justify-center p-2 text-white font-mono text-xs relative"
                  style={{ 
                    width: "60px", 
                    height: `${layerHeight}px`, 
                    minHeight: "50px" 
                  }}
                >
                  {neurons}
                  <div className="absolute -bottom-6 text-xs text-muted-foreground whitespace-nowrap">
                    {activation}
                  </div>
                </div>
                {index < (Array.isArray(model.neuralNetworkArchitecture) ? model.neuralNetworkArchitecture.length - 1 : 0) && (
                  <div className="w-8 h-0.5 bg-muted mt-4 mx-2" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Format confusion matrix for display
  const renderConfusionMatrix = () => {
    if (!confusionMatrix || !Array.isArray(confusionMatrix) || confusionMatrix.length === 0) {
      return <p className="text-muted-foreground">No confusion matrix available.</p>;
    }
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Confusion Matrix</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 border">
            <thead>
              <tr>
                <th className="bg-muted px-3 py-2 text-xs text-left">Actual \ Predicted</th>
                {confusionMatrix[0].map((_, colIdx) => (
                  <th key={colIdx} className="bg-muted px-3 py-2 text-xs text-center">Class {colIdx}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {confusionMatrix.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td className="bg-muted px-3 py-2 text-xs font-medium">Class {rowIdx}</td>
                  {row.map((cell, cellIdx) => (
                    <td 
                      key={cellIdx} 
                      className={`px-3 py-2 text-center ${rowIdx === cellIdx ? 'bg-primary/10 font-medium' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Format algorithm-specific details
  const renderAlgorithmDetails = () => {
    const details = [];
    
    if (model.algorithm === "Linear Regression" && metrics.coef) {
      details.push(
        <div key="coef" className="mt-4">
          <h3 className="text-sm font-medium mb-2">Coefficients</h3>
          <div className="max-h-40 overflow-y-auto">
            {Object.entries(featureImportance).map(([feature, value], index) => (
              <div key={index} className="flex justify-between py-1 border-b text-sm">
                <span>{feature}</span>
                <span className="font-mono">{typeof value === 'number' ? value.toFixed(4) : '-'}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between py-1 border-b text-sm font-medium">
            <span>Intercept</span>
            <span className="font-mono">{metrics.intercept ? metrics.intercept.toFixed(4) : '-'}</span>
          </div>
        </div>
      );
    }
    
    // Add more algorithm-specific details here
    
    return details.length > 0 ? details : <p className="text-muted-foreground">No additional details available.</p>;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <CardDescription>
              {model.algorithm} • Created {formatDate(model.created)}
            </CardDescription>
          </div>
          <Badge variant={model.type === "ML" ? "default" : "secondary"}>
            {model.type}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Features</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center">
              <Layers className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Architecture</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center">
              <Activity className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs">
                  {getMainMetricName()}
                </div>
                <div className="text-2xl font-semibold mt-1">
                  {getMainMetricValue()}
                </div>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-muted-foreground text-xs">
                  Algorithm
                </div>
                <div className="text-lg font-medium mt-1 truncate">
                  {model.algorithm}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Dataset</h3>
                <div className="text-sm">{model.datasetName}</div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Target Features</h3>
                <div className="flex flex-wrap gap-1">
                  {model.targets && model.targets.map((target, index) => (
                    <Badge key={index} variant="outline">{target}</Badge>
                  ))}
                </div>
              </div>
              
              {metrics && Object.keys(metrics).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Metrics</h3>
                  <div className="space-y-1">
                    {Object.entries(metrics).map(([key, value]) => {
                      // Skip complex metrics or those already shown
                      if (
                        typeof value === 'object' || 
                        key === 'coef' || 
                        key === 'intercept'
                      ) return null;
                      
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono">
                            {typeof value === 'number' && 
                             (key.includes('accuracy') || key.includes('score')) ? 
                              (value * 100).toFixed(2) + '%' : 
                              typeof value === 'number' ? 
                                value.toFixed(4) : 
                                String(value)
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="features" className="pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Feature Importance</h3>
                {Object.keys(featureImportance).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={featureImportanceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        type="category" 
                        dataKey="feature" 
                        width={100}
                      />
                      <Tooltip 
                        formatter={(value: number) => value.toFixed(4)}
                        labelFormatter={(label) => {
                          const item = featureImportanceData.find(item => item.feature === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar dataKey="importance" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground">No feature importance data available.</p>
                )}
              </div>
              
              {renderAlgorithmDetails()}
            </div>
          </TabsContent>
          
          <TabsContent value="architecture" className="pt-4">
            <div className="space-y-4">
              {model.algorithm === "Neural Network" ? (
                renderNeuralNetworkArchitecture()
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Neural network architecture is only available for Neural Network models.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="pt-4">
            <div className="space-y-4">
              {isClassificationModel() && renderConfusionMatrix()}
              
              {/* Additional performance metrics can be added here */}
              <div>
                <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
                {metrics && Object.keys(metrics).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(metrics).map(([key, value]) => {
                      // Skip complex metrics or those already shown
                      if (
                        typeof value === 'object' || 
                        key === 'coef' || 
                        key === 'intercept'
                      ) return null;
                      
                      return (
                        <div key={key} className="bg-muted/30 p-3 rounded-lg">
                          <div className="text-muted-foreground text-xs capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-lg font-medium mt-1">
                            {typeof value === 'number' && 
                             (key.includes('accuracy') || key.includes('score')) ? 
                              (value * 100).toFixed(2) + '%' : 
                              typeof value === 'number' ? 
                                value.toFixed(4) : 
                                String(value)
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No detailed performance metrics available.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
