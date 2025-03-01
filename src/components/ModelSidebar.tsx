
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useModels, Model } from "@/context/ModelContext";
import {
  Search,
  Database,
  MoreVertical,
  Download,
  Trash2,
  Filter,
  Brain,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

export function ModelSidebar() {
  const { theme } = useTheme();
  const { models, isLoading, error, deleteModel, refreshModels } = useModels();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "ML" | "DL" | "Clustering" | "Dimensionality Reduction" | "Anomaly Detection">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter models based on search term and type filter
  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        model.datasetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        model.algorithm.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || model.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sort models by creation date (newest first)
  const sortedModels = [...filteredModels].sort((a, b) => {
    return new Date(b.created).getTime() - new Date(a.created).getTime();
  });

  const handleDeleteModel = async (id: string, name: string) => {
    try {
      await deleteModel(id);
      toast.success(`Model "${name}" deleted`);
    } catch (error) {
      console.error("Delete model failed:", error);
    }
  };

  const handleDownloadModel = (model: Model) => {
    try {
      // Create a JSON blob with the model data
      const modelData = {
        name: model.name,
        type: model.type,
        algorithm: model.algorithm,
        accuracy: model.accuracy,
        datasetName: model.datasetName,
        parameters: model.parameters || {},
        neuralNetworkArchitecture: model.neuralNetworkArchitecture || null,
        createdAt: model.created
      };
      
      const blob = new Blob([JSON.stringify(modelData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${model.name.replace(/\s+/g, '_')}_${model.algorithm}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Model "${model.name}" downloaded`);
    } catch (error) {
      console.error("Download model failed:", error);
      toast.error("Failed to download model");
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshModels();
      toast.success("Models refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
      toast.error("Failed to refresh models");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case "ML":
        return <TrendingUp className="h-4 w-4 mr-2 text-primary" />;
      case "DL":
        return <Brain className="h-4 w-4 mr-2 text-accent" />;
      case "Clustering":
        return <Filter className="h-4 w-4 mr-2 text-green-500" />;
      case "Dimensionality Reduction":
        return <TrendingUp className="h-4 w-4 mr-2 text-orange-500" />;
      case "Anomaly Detection":
        return <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative h-screen">
      <Sidebar
        className={`
          border-r 
          ${theme === "light" 
            ? "border-border/30 bg-background" 
            : "border-border/10 bg-background"}
          ${sidebarOpen ? "w-80" : "w-0"}
          transition-all duration-300 ease-in-out
        `}
      >
        <SidebarHeader className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-lg font-medium">Models</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </SidebarHeader>
        
        <SidebarContent className="px-4 py-3 overflow-hidden">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-thin">
              <Button
                variant={typeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("all")}
                className="whitespace-nowrap"
              >
                All
              </Button>
              <Button
                variant={typeFilter === "ML" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("ML")}
                className="whitespace-nowrap"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                ML
              </Button>
              <Button
                variant={typeFilter === "DL" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("DL")}
                className="whitespace-nowrap"
              >
                <Brain className="h-3 w-3 mr-1" />
                DL
              </Button>
              <Button
                variant={typeFilter === "Clustering" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("Clustering")}
                className="whitespace-nowrap"
              >
                <Filter className="h-3 w-3 mr-1" />
                Clustering
              </Button>
              <Button
                variant={typeFilter === "Dimensionality Reduction" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("Dimensionality Reduction")}
                className="whitespace-nowrap"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Dim. Red.
              </Button>
              <Button
                variant={typeFilter === "Anomaly Detection" ? "default" : "outline"}
                size="sm"
                onClick={() => setTypeFilter("Anomaly Detection")}
                className="whitespace-nowrap"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                Anomaly
              </Button>
            </div>
          </div>
          
          {isLoading && !isRefreshing && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading models...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 mt-0.5 text-red-600 dark:text-red-400" />
                <div className="ml-3">
                  <h4 className="font-medium text-red-800 dark:text-red-400">
                    Error loading models
                  </h4>
                  <p className="text-sm mt-1 text-red-700 dark:text-red-500">
                    {error.message || "Something went wrong. Please try refreshing."}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {!isLoading && !error && sortedModels.length === 0 && (
            <div className="text-center py-10">
              <Database className="h-10 w-10 mx-auto text-muted-foreground opacity-30" />
              <p className="mt-2 text-muted-foreground">No models found</p>
              {searchTerm || typeFilter !== "all" ? (
                <p className="text-sm mt-1 text-muted-foreground">
                  Try adjusting your search or filter
                </p>
              ) : null}
            </div>
          )}
          
          <div className="space-y-3 mt-4 overflow-y-auto max-h-[calc(100vh-240px)] pr-1 scrollbar-thin">
            {sortedModels.map((model) => (
              <div
                key={model.id}
                className={`
                  p-3 rounded-lg border
                  ${theme === "light" 
                    ? "border-border/30 hover:bg-secondary/50" 
                    : "border-border/10 hover:bg-secondary/20"}
                  transition-colors duration-150
                `}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      {getModelIcon(model.type)}
                      <h3 className="font-medium text-foreground line-clamp-1">{model.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {model.algorithm}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {model.datasetName}
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className={`
                        font-medium
                        ${model.accuracy > 0.9
                          ? theme === "light" ? "text-green-600" : "text-green-400"
                          : model.accuracy > 0.8
                            ? theme === "light" ? "text-amber-600" : "text-amber-400"
                            : theme === "light" ? "text-red-500" : "text-red-400"}
                      `}>
                        {(model.accuracy * 100).toFixed(2)}%
                      </span>
                      <span className="mx-2">•</span>
                      <span>
                        {new Date(model.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownloadModel(model)}
                        className="cursor-pointer"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteModel(model.id, model.name)}
                        className="cursor-pointer text-red-500 focus:text-red-500"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </SidebarContent>
      </Sidebar>
      
      {/* Sidebar Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`
          absolute top-4 z-10
          ${sidebarOpen 
            ? "left-[17rem]" 
            : "left-4"}
          transition-all duration-300 border
          ${theme === "light" 
            ? "bg-background border-border/30" 
            : "bg-background border-border/10"}
        `}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
