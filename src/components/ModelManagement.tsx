
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Model, ModelType, useModels } from "@/context/ModelContext";
import { 
  Search,
  Download,
  Trash,
  RefreshCw,
  SlidersHorizontal,
  BarChart3,
  Brain,
  LayoutGrid,
  Layers,
  ChevronDown
} from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModelMetrics } from "./ModelMetrics";
import { ModelPrediction } from "./ModelPrediction";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModelManagementProps {
  datasetName?: string;
  enableFilters?: boolean;
}

export function ModelManagement({ datasetName, enableFilters = true }: ModelManagementProps) {
  const { models, isLoading, refreshModels, deleteModel, downloadModel } = useModels();
  const [selectedTab, setSelectedTab] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<ModelType | "all">("all");
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [detailsView, setDetailsView] = useState<"metrics" | "predict">("metrics");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter models based on dataset, search term, and selected type
  const filteredModels = models
    .filter(model => !datasetName || model.datasetName === datasetName)
    .filter(model => 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      model.algorithm.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(model => selectedType === "all" || model.type === selectedType)
    .sort((a, b) => b.created.getTime() - a.created.getTime()); // Sort by date (newest first)
  
  // Handle refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshModels();
    setIsRefreshing(false);
  };
  
  // Handle model deletion with confirmation
  const handleDelete = async (model: Model) => {
    if (window.confirm(`Are you sure you want to delete the model "${model.name}"?`)) {
      await deleteModel(model.id);
      if (selectedModel?.id === model.id) {
        setSelectedModel(null);
      }
    }
  };
  
  // Get color for model accuracy badge
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "text-green-500";
    if (accuracy >= 0.8) return "text-emerald-500";
    if (accuracy >= 0.7) return "text-blue-500";
    if (accuracy >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };
  
  // Get icon for model type
  const getModelTypeIcon = (type: ModelType) => {
    switch (type) {
      case "ML":
        return <BarChart3 className="h-4 w-4" />;
      case "DL":
        return <Brain className="h-4 w-4" />;
      case "Clustering":
        return <Layers className="h-4 w-4" />;
      default:
        return <SlidersHorizontal className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Management</CardTitle>
              <CardDescription>
                Manage and deploy your trained machine learning models
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as "grid" | "table")}>
                <TabsList className="grid w-full grid-cols-2 h-8">
                  <TabsTrigger value="grid" className="px-2 py-0">
                    <LayoutGrid className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="table" className="px-2 py-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          {enableFilters && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select
                value={selectedType}
                onValueChange={(value) => setSelectedType(value as ModelType | "all")}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ML">Machine Learning</SelectItem>
                  <SelectItem value="DL">Deep Learning</SelectItem>
                  <SelectItem value="Clustering">Clustering</SelectItem>
                  <SelectItem value="Dimensionality Reduction">Dimensionality Reduction</SelectItem>
                  <SelectItem value="Anomaly Detection">Anomaly Detection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {searchTerm || selectedType !== "all" ? 
                "No models match your search criteria" : 
                datasetName ?
                  "No models have been trained for this dataset yet" :
                  "No models have been trained yet"
              }
            </div>
          ) : (
            <>
              <TabsContent value="grid" className="m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredModels.map((model) => (
                    <Card key={model.id} className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setSelectedModel(model)}>
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-base truncate">{model.name}</CardTitle>
                            <CardDescription className="text-xs">{model.algorithm}</CardDescription>
                          </div>
                          <Badge variant={model.type === "ML" ? "default" : "secondary"} className="h-6">
                            {getModelTypeIcon(model.type)}
                            <span className="ml-1">{model.type}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 pb-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className={`font-medium ${getAccuracyColor(model.accuracy)}`}>
                            {(model.accuracy * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              model.accuracy >= 0.9 ? "bg-green-500" :
                              model.accuracy >= 0.8 ? "bg-emerald-500" :
                              model.accuracy >= 0.7 ? "bg-blue-500" :
                              model.accuracy >= 0.6 ? "bg-yellow-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${model.accuracy * 100}%` }}
                          ></div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-2 text-xs text-muted-foreground flex justify-between items-center">
                        <span>{formatDate(model.created)}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => {
                            e.stopPropagation();
                            downloadModel(model.id);
                          }}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(model);
                          }}>
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table" className="m-0">
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Algorithm</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredModels.map((model) => (
                        <TableRow key={model.id} className="cursor-pointer" onClick={() => setSelectedModel(model)}>
                          <TableCell className="font-medium">{model.name}</TableCell>
                          <TableCell>{model.algorithm}</TableCell>
                          <TableCell>
                            <Badge variant={model.type === "ML" ? "default" : "secondary"}>
                              {model.type}
                            </Badge>
                          </TableCell>
                          <TableCell className={getAccuracyColor(model.accuracy)}>
                            {(model.accuracy * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(model.created)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={(e) => {
                                e.stopPropagation();
                                downloadModel(model.id);
                              }}>
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(model);
                              }}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedModel} onOpenChange={(open) => !open && setSelectedModel(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedModel?.name}</DialogTitle>
            <DialogDescription>
              {selectedModel?.algorithm} • Created {selectedModel ? formatDate(selectedModel.created) : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="pt-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button 
                  variant={detailsView === "metrics" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDetailsView("metrics")}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Model Metrics
                </Button>
                <Button 
                  variant={detailsView === "predict" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setDetailsView("predict")}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Make Predictions
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Options
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => selectedModel && downloadModel(selectedModel.id)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Model
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => selectedModel && handleDelete(selectedModel)} className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Model
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Separator className="my-4" />
            
            {selectedModel && detailsView === "metrics" && (
              <ModelMetrics model={selectedModel} />
            )}
            
            {selectedModel && detailsView === "predict" && (
              <ModelPrediction 
                model={selectedModel} 
                isClusteringModel={selectedModel.type === "Clustering"}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
