import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModels, Model, ModelType } from "@/context/ModelContext";
import { ModelCard } from "@/components/ModelCard";
import { AlertCircle, Search, WifiOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ModelDisclaimer } from "@/components/ModelDisclaimer";

export function ModelStorage() {
  const { models, isLoading, error, refreshModels } = useModels();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ModelType | "All">("All");
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [offlineMode, setOfflineMode] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [paginatedModels, setPaginatedModels] = useState<Model[]>([]);
  
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
    
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    refreshModels().finally(() => {
      setInitialLoadComplete(true);
    });
  }, [refreshModels]);

  useEffect(() => {
    let result = [...models];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        model => 
          model.name.toLowerCase().includes(query) ||
          model.algorithm.toLowerCase().includes(query) ||
          model.datasetName.toLowerCase().includes(query) ||
          (model.targets && model.targets.some(target => 
            target.toLowerCase().includes(query)
          ))
      );
    }
    
    if (selectedType !== "All") {
      result = result.filter(model => model.type === selectedType);
    }
    
    setFilteredModels(result);
    setCurrentPage(1);
  }, [searchQuery, selectedType, models]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedModels(filteredModels.slice(startIndex, endIndex));
  }, [filteredModels, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);

  const modelsByDataset = filteredModels.reduce((acc, model) => {
    const { datasetName } = model;
    if (!acc[datasetName]) {
      acc[datasetName] = [];
    }
    acc[datasetName].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  const getPaginatedModelsByDataset = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    const result: Record<string, Model[]> = {};
    let currentCount = 0;
    
    for (const [datasetName, models] of Object.entries(modelsByDataset)) {
      if (currentCount >= itemsPerPage) break;
      
      if (currentCount + models.length > startIndex) {
        const modelsToInclude = models.slice(
          Math.max(0, startIndex - currentCount), 
          endIndex - currentCount
        );
        
        if (modelsToInclude.length > 0) {
          result[datasetName] = modelsToInclude;
        }
      }
      
      currentCount += models.length;
    }
    
    return result;
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageToShow: number;
            if (totalPages <= 5) {
              pageToShow = i + 1;
            } else if (currentPage <= 3) {
              pageToShow = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4 + i;
            } else {
              pageToShow = currentPage - 2 + i;
            }
            
            if (pageToShow > 0 && pageToShow <= totalPages) {
              return (
                <PaginationItem key={pageToShow}>
                  <Button 
                    variant={pageToShow === currentPage ? "default" : "outline"} 
                    size="icon"
                    onClick={() => handlePageChange(pageToShow)}
                  >
                    {pageToShow}
                  </Button>
                </PaginationItem>
              );
            }
            return null;
          })}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const itemsPerPageOptions = [9, 18, 36, 72];

  return (
    <Card>
      <ModelDisclaimer />
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
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-muted-foreground">
                    Showing {paginatedModels.length} of {filteredModels.length} models
                  </div>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsPerPageOptions.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                          {option} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedModels.map((model) => (
                    <ModelCard key={model.id} model={model} />
                  ))}
                </div>
                
                {renderPagination()}
              </>
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
              <>
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm text-muted-foreground">
                    Showing models from {Object.keys(getPaginatedModelsByDataset()).length} datasets
                  </div>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                      {itemsPerPageOptions.map(option => (
                        <SelectItem key={option} value={option.toString()}>
                          {option} per page
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(getPaginatedModelsByDataset()).map(([datasetName, datasetModels]) => (
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
                
                {renderPagination()}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
