
import { useTheme } from "@/context/ThemeContext";
import { useModels, Model } from "@/context/ModelContext";
import { 
  Database,
  Calendar,
  TrendingUp,
  Trash2,
  Filter,
  Brain,
  Search,
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ModelStorage() {
  const { theme } = useTheme();
  const { models, isLoading, error, deleteModel, refreshModels } = useModels();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "ML" | "DL">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      // Error is already handled in the context and a toast is shown
      console.error("Delete model failed:", error);
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`
      card-container
      ${theme === "light" ? "card-container-light" : "card-container-dark"}
    `}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-semibold">Model Storage</h2>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className={`
              p-2 rounded-full
              ${theme === "light" 
                ? "hover:bg-secondary text-muted-foreground hover:text-foreground" 
                : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"}
              ${(isLoading || isRefreshing) ? "opacity-50 cursor-not-allowed" : ""}
            `}
            aria-label="Refresh models"
          >
            {isRefreshing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </button>
          <div className="text-sm text-muted-foreground">
            {models.length} model{models.length !== 1 ? "s" : ""} saved
          </div>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`
              input-field pl-10
              ${theme === "light" 
                ? "input-field-light" 
                : "input-field-dark"}
            `}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex">
            <button
              onClick={() => setTypeFilter("all")}
              className={`
                px-3 py-2 text-sm rounded-l-md
                ${typeFilter === "all"
                  ? theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                  : theme === "light"
                    ? "bg-secondary hover:bg-secondary/80"
                    : "bg-secondary hover:bg-secondary/80"}
              `}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter("ML")}
              className={`
                px-3 py-2 text-sm
                ${typeFilter === "ML"
                  ? theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                  : theme === "light"
                    ? "bg-secondary hover:bg-secondary/80"
                    : "bg-secondary hover:bg-secondary/80"}
              `}
            >
              ML
            </button>
            <button
              onClick={() => setTypeFilter("DL")}
              className={`
                px-3 py-2 text-sm rounded-r-md
                ${typeFilter === "DL"
                  ? theme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary text-primary-foreground"
                  : theme === "light"
                    ? "bg-secondary hover:bg-secondary/80"
                    : "bg-secondary hover:bg-secondary/80"}
              `}
            >
              DL
            </button>
          </div>
        </div>
      </div>
      
      {isLoading && !isRefreshing && (
        <div className={`
          p-8 rounded-lg text-center
          ${theme === "light" 
            ? "bg-secondary/50" 
            : "bg-secondary/30"}
        `}>
          <Loader2 className="h-8 w-8 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading models...</p>
        </div>
      )}
      
      {error && (
        <div className={`
          p-6 rounded-lg border
          ${theme === "light" 
            ? "border-red-200 bg-red-50" 
            : "border-red-900/30 bg-red-900/10"}
        `}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`
              h-5 w-5 mt-0.5
              ${theme === "light" 
                ? "text-red-600" 
                : "text-red-400"}
            `} />
            <div>
              <h4 className={`
                font-medium
                ${theme === "light" 
                  ? "text-red-800" 
                  : "text-red-400"}
              `}>
                Error loading models
              </h4>
              <p className={`
                text-sm mt-1
                ${theme === "light" 
                  ? "text-red-700" 
                  : "text-red-500"}
              `}>
                {error.message || "Something went wrong. Please try refreshing."}
              </p>
              <button
                onClick={handleRefresh}
                className={`
                  mt-3 px-3 py-1 text-sm rounded
                  ${theme === "light" 
                    ? "bg-red-100 text-red-800 hover:bg-red-200" 
                    : "bg-red-900/20 text-red-400 hover:bg-red-900/30"}
                `}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isLoading && !error && sortedModels.length === 0 && (
        <div className={`
          p-6 rounded-lg text-center
          ${theme === "light" 
            ? "bg-secondary/50" 
            : "bg-secondary/30"}
        `}>
          <p className="text-muted-foreground">No models found</p>
          {searchTerm || typeFilter !== "all" ? (
            <p className="text-sm mt-2 text-muted-foreground">
              Try adjusting your search or filter
            </p>
          ) : (
            <p className="text-sm mt-2 text-muted-foreground">
              Train some models to see them here
            </p>
          )}
        </div>
      )}
      
      {!isLoading && !error && sortedModels.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedModels.map((model) => (
            <div
              key={model.id}
              className={`
                p-4 rounded-lg border
                ${theme === "light" 
                  ? "border-border/30 shadow-neulight-sm" 
                  : "border-border/10 shadow-neudark-sm"}
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {model.type === "ML" ? (
                    <TrendingUp className="h-5 w-5 mt-1 text-primary" />
                  ) : (
                    <Brain className="h-5 w-5 mt-1 text-accent" />
                  )}
                  <div>
                    <h3 className="font-medium">{model.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`
                        px-2 py-0.5 text-xs rounded-full
                        ${model.type === "ML"
                          ? theme === "light"
                            ? "bg-primary/10 text-primary"
                            : "bg-primary/20 text-primary-foreground"
                          : theme === "light"
                            ? "bg-accent/30 text-accent-foreground"
                            : "bg-accent/40 text-accent-foreground"}
                      `}>
                        {model.type}
                      </span>
                      <span className={`
                        px-2 py-0.5 text-xs rounded-full
                        ${theme === "light" 
                          ? "bg-muted/80 text-muted-foreground" 
                          : "bg-muted/40 text-muted-foreground"}
                      `}>
                        {model.algorithm}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteModel(model.id, model.name)}
                  className={`
                    p-2 rounded-full
                    ${theme === "light" 
                      ? "text-red-500 hover:bg-red-50" 
                      : "text-red-400 hover:bg-red-900/20"}
                  `}
                  aria-label="Delete model"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Accuracy:</span>
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
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dataset:</span>
                  <span className="font-medium">{model.datasetName}</span>
                </div>
                
                {model.neuralNetworkArchitecture && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Architecture:</span>
                    <span className="font-medium">
                      {Array.isArray(model.neuralNetworkArchitecture) && 
                       typeof model.neuralNetworkArchitecture[0] === 'number'
                        ? (model.neuralNetworkArchitecture as number[]).join(" → ")
                        : (model.neuralNetworkArchitecture as any[]).map(layer => 
                            typeof layer === 'number' ? layer : layer.neurons
                          ).join(" → ")}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(model.created)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
