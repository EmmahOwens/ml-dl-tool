
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useModels, Algorithm } from "@/context/ModelContext";
import { trainMLModel } from "@/utils/mlAlgorithms";
import { toast } from "sonner";
import { 
  Zap,
  Timer,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Sliders
} from "lucide-react";

interface AdvancedMLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
}

export function AdvancedMLTraining({
  data,
  features,
  target,
  datasetName,
  onTrainingComplete
}: AdvancedMLTrainingProps) {
  const { theme } = useTheme();
  const { addModel } = useModels();
  const [isTraining, setIsTraining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>("LightGBM");
  const [algorithmParams, setAlgorithmParams] = useState<Record<string, any>>({
    learningRate: 0.1,
    maxDepth: 8,
    nEstimators: 100
  });
  const [error, setError] = useState<string | null>(null);
  const [trainedModel, setTrainedModel] = useState<{
    algorithm: Algorithm;
    accuracy: number;
    parameters: Record<string, any>;
  } | null>(null);

  const handleStartTraining = async () => {
    if (isTraining || isSaving) return;
    
    setIsTraining(true);
    setProgress(0);
    setTrainedModel(null);
    setError(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 5;
        });
      }, 300);
      
      // Train the selected model
      const result = await trainMLModel(
        data, 
        features, 
        target, 
        selectedAlgorithm, 
        algorithmParams
      );
      
      setTrainedModel(result);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Add the model to storage
      setIsSaving(true);
      await addModel({
        name: `${result.algorithm} - ${datasetName}`,
        type: "ML",
        algorithm: result.algorithm,
        accuracy: result.accuracy,
        datasetName,
        parameters: result.parameters,
      });
      
      toast.success(`Training complete! Model: ${result.algorithm} (${(result.accuracy * 100).toFixed(2)}%)`);
      
      // Notify parent component
      onTrainingComplete();
    } catch (error) {
      console.error("Training error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error("An error occurred during training");
    } finally {
      setIsTraining(false);
      setIsSaving(false);
    }
  };

  const renderParamsInput = () => {
    switch (selectedAlgorithm) {
      case "LightGBM":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Learning Rate</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max="1"
                value={algorithmParams.learningRate}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  learningRate: parseFloat(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Max Depth</label>
              <input 
                type="number" 
                step="1"
                min="1"
                max="15"
                value={algorithmParams.maxDepth}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  maxDepth: parseInt(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Number of Estimators</label>
              <input 
                type="number" 
                step="10"
                min="10"
                max="500"
                value={algorithmParams.nEstimators}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  nEstimators: parseInt(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
          </div>
        );
      case "CatBoost":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Learning Rate</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                max="1"
                value={algorithmParams.learningRate || 0.05}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  learningRate: parseFloat(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Depth</label>
              <input 
                type="number" 
                step="1"
                min="1"
                max="10"
                value={algorithmParams.depth || 6}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  depth: parseInt(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Iterations</label>
              <input 
                type="number" 
                step="10"
                min="10"
                max="500"
                value={algorithmParams.iterations || 100}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  iterations: parseInt(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
          </div>
        );
      case "Gaussian Process":
        return (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Kernel</label>
              <select
                value={algorithmParams.kernel || 'rbf'}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  kernel: e.target.value
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              >
                <option value="rbf">RBF</option>
                <option value="linear">Linear</option>
                <option value="polynomial">Polynomial</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Alpha</label>
              <input 
                type="number" 
                step="0.001"
                min="0.001"
                max="1"
                value={algorithmParams.alpha || 0.1}
                onChange={(e) => setAlgorithmParams({
                  ...algorithmParams,
                  alpha: parseFloat(e.target.value)
                })}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="py-2 text-sm text-muted-foreground">
            Select an algorithm to configure its parameters.
          </div>
        );
    }
  };

  return (
    <div className={`
      card-container
      ${theme === "light" ? "card-container-light" : "card-container-dark"}
    `}>
      <h2 className="text-2xl font-semibold mb-4">Advanced ML Training</h2>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Dataset: {datasetName}</span>
          <span>Target: {target}</span>
        </div>
        
        <div className={`
          p-4 rounded-lg
          ${theme === "light" 
            ? "bg-secondary/50" 
            : "bg-secondary/30"}
        `}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-medium">Advanced Algorithm Configuration</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Select and fine-tune state-of-the-art ML algorithms for optimal performance.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Algorithm</label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => {
                  setSelectedAlgorithm(e.target.value as Algorithm);
                  // Reset params based on selected algorithm
                  if (e.target.value === "LightGBM") {
                    setAlgorithmParams({
                      learningRate: 0.1,
                      maxDepth: 8,
                      nEstimators: 100
                    });
                  } else if (e.target.value === "CatBoost") {
                    setAlgorithmParams({
                      learningRate: 0.05,
                      depth: 6,
                      iterations: 100
                    });
                  } else if (e.target.value === "Gaussian Process") {
                    setAlgorithmParams({
                      kernel: 'rbf',
                      alpha: 0.1
                    });
                  }
                }}
                className={`
                  w-full px-3 py-2 rounded-md border
                  ${theme === "light" 
                    ? "border-gray-300 bg-white" 
                    : "border-gray-700 bg-gray-800"}
                `}
                disabled={isTraining || isSaving}
              >
                <option value="LightGBM">LightGBM</option>
                <option value="CatBoost">CatBoost</option>
                <option value="Gaussian Process">Gaussian Process</option>
              </select>
            </div>
            
            <div className={`
              p-3 rounded-lg border
              ${theme === "light" 
                ? "border-border/50 bg-background/50" 
                : "border-border/30 bg-background/20"}
            `}>
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Algorithm Parameters</span>
              </div>
              
              {renderParamsInput()}
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className={`
          p-4 rounded-lg border mb-6
          ${theme === "light" 
            ? "border-red-200 bg-red-50" 
            : "border-red-900/30 bg-red-900/10"}
        `}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`
              h-5 w-5 mt-0.5
              ${theme === "light" 
                ? "text-red-600" 
                : "text-red-400"}
            `} />
            <div>
              <p className={`
                ${theme === "light" 
                  ? "text-red-700" 
                  : "text-red-500"}
              `}>
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className={`
                  mt-2 px-3 py-1 text-sm rounded
                  ${theme === "light" 
                    ? "bg-red-100 text-red-800 hover:bg-red-200" 
                    : "bg-red-900/20 text-red-400 hover:bg-red-900/30"}
                `}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isTraining && !isSaving && !trainedModel && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleStartTraining}
            disabled={isTraining || isSaving}
            className={`
              button-primary
              ${theme === "light" 
                ? "button-primary-light" 
                : "button-primary-dark"}
              ${(isTraining || isSaving) ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            Train {selectedAlgorithm}
          </button>
        </div>
      )}
      
      {(isTraining || isSaving || trainedModel) && (
        <div className="space-y-6">
          {(isTraining || isSaving) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-medium">
                    {isSaving ? "Saving model..." : "Training in progress..."}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {isSaving ? "100%" : progress.toFixed(0) + "%"}
                </span>
              </div>
              
              <div className={`
                h-2 rounded-full overflow-hidden
                ${theme === "light" 
                  ? "bg-secondary" 
                  : "bg-secondary/50"}
              `}>
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${isSaving ? 100 : progress}%` }}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {isSaving 
                  ? "Saving model to database..." 
                  : `Training ${selectedAlgorithm} with custom parameters`}
              </p>
            </div>
          )}
          
          {trainedModel && !isTraining && !isSaving && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium">Training Complete</h3>
              </div>
              
              <div className={`
                p-4 rounded-lg
                ${theme === "light" 
                  ? "bg-secondary/50 shadow-neulight-sm" 
                  : "bg-secondary/30 shadow-neudark-sm"}
              `}>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">{trainedModel.algorithm}</span>
                  <span className={`
                    px-3 py-1 rounded-full text-sm
                    ${theme === "light" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-green-900/30 text-green-400"}
                  `}>
                    {(trainedModel.accuracy * 100).toFixed(2)}% Accuracy
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Parameters Used:</h4>
                  <div className={`
                    p-3 rounded-md text-xs font-mono overflow-x-auto
                    ${theme === "light" 
                      ? "bg-gray-100" 
                      : "bg-gray-800"}
                  `}>
                    {Object.entries(trainedModel.parameters).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      This model has been saved to the database and can be accessed from the Model Storage
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setTrainedModel(null);
                    setProgress(0);
                  }}
                  className={`
                    px-4 py-2 text-sm rounded-md
                    ${theme === "light" 
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                      : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"}
                  `}
                >
                  Train Another Model
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
