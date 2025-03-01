
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModels, Model, ModelType } from "@/context/ModelContext";
import { ModelCard } from "@/components/ModelCard";
import { AlertCircle, Search, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export function ModelStorage() {
  const { models, isLoading, error, refreshModels } = useModels();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ModelType | "All">("All");
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Check if we're in offline mode based on fetch errors
  useEffect(() => {
    const checkOnlineStatus = async () => {
      try {
        await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        });
        setOfflineMode(false);
      } catch (error) {
        setOfflineMode(true);
      }
    };
    
    // Check immediately and then every 30 seconds
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Refresh models on mount
  useEffect(() => {
    refreshModels().finally(() => {
      // Set initialLoadComplete to true when the first load is done
      setInitialLoadComplete(true);
    });
  }, [refreshModels]);

  // Filter models when search query, selected type, or models change
  useEffect(() => {
    let result = [...models];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        model => 
          model.name.toLowerCase().includes(query) ||
          model.algorithm.toLowerCase().includes(query) ||
          model.datasetName.toLowerCase().includes(query) ||
          // Also search in targets
          (model.targets && model.targets.some(target => 
            target.toLowerCase().includes(query)
          ))
      );
    }
    
    // Filter by type
    if (selectedType !== "All") {
      result = result.filter(model => model.type === selectedType);
    }
    
    setFilteredModels(result);
  }, [searchQuery, selectedType, models]);

  // Group models by dataset
  const modelsByDataset = filteredModels.reduce((acc, model) => {
    const { datasetName } = model;
    if (!acc[datasetName]) {
      acc[datasetName] = [];
    }
    acc[datasetName].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  // Render loading skeletons
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </div>
          <Skeleton className="h-2 w-full mt-2" />
          <div className="flex gap-1 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Storage</CardTitle>
        <CardDescription>
          View, manage, and fine-tune your trained models.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {offlineMode && (
          <Alert className="mb-4">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>
              Operating in offline mode. Model changes will be stored locally.
            </AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Models</TabsTrigger>
              <TabsTrigger value="by-dataset">By Dataset</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select 
                value={selectedType} 
                onValueChange={(value) => setSelectedType(value as ModelType | "All")}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="ML">ML</SelectItem>
                  <SelectItem value="DL">DL</SelectItem>
                  <SelectItem value="Clustering">Clustering</SelectItem>
                  <SelectItem value="Dimensionality Reduction">Dim. Reduction</SelectItem>
                  <SelectItem value="Anomaly Detection">Anomaly Detection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="all" className="m-0">
            {isLoading && !initialLoadComplete ? (
              renderSkeletons()
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No models found. Train a model first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                  <ModelCard key={model.id} model={model} />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="by-dataset" className="m-0">
            {isLoading && !initialLoadComplete ? (
              renderSkeletons()
            ) : Object.keys(modelsByDataset).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No models found. Train a model first.
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(modelsByDataset).map(([datasetName, datasetModels]) => (
                  <div key={datasetName} className="space-y-2">
                    <h3 className="font-medium text-lg">{datasetName}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {datasetModels.map((model) => (
                        <ModelCard key={model.id} model={model} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
