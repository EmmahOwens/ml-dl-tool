
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useModels, NeuralNetworkLayer } from "@/context/ModelContext";
import { optimizeNeuralNetwork } from "@/utils/dlNetworks";
import { toast } from "sonner";
import { 
  Network,
  Timer,
  CheckCircle2,
  TrendingUp,
  Layers,
  AlertCircle,
  Brain
} from "lucide-react";

interface DLTrainingProps {
  data: any[];
  features: string[];
  target: string;
  datasetName: string;
  onTrainingComplete: () => void;
}

export function DLTraining({
  data,
  features,
  target,
  datasetName,
  onTrainingComplete
}: DLTrainingProps) {
  const { theme } = useTheme();
  const { addModel } = useModels();
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentArchitecture, setCurrentArchitecture] = useState<number[]>([]);
  const [bestModel, setBestModel] = useState<{
    accuracy: number;
    architecture: number[] | NeuralNetworkLayer[];
    parameters: Record<string, any>;
  } | null>(null);

  const handleStartTraining = async () => {
    if (isTraining) return;
    
    setIsTraining(true);
    setProgress(0);
    setBestModel(null);
    
    try {
      // Simulate progress and architecture optimization
      const architecturesToTry = [
        [32],
        [64, 32],
        [128, 64, 32],
        [256, 128, 64, 32]
      ];
      
      let currentProgress = 0;
      
      for (const architecture of architecturesToTry) {
        setCurrentArchitecture(architecture);
        
        // Simulate architecture-specific training progress
        const startProgress = currentProgress;
        const endProgress = currentProgress + (100 / architecturesToTry.length);
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= endProgress - 1) {
              clearInterval(progressInterval);
              return endProgress - 1;
            }
            return prev + (Math.random() * 0.5);
          });
        }, 300);
        
        // Wait before moving to next architecture
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
        
        clearInterval(progressInterval);
        currentProgress = endProgress;
        setProgress(currentProgress);
      }
      
      // Optimize the neural network
      const result = await optimizeNeuralNetwork(data, features, target);
      
      setBestModel({
        accuracy: result.accuracy,
        architecture: result.neuralNetworkArchitecture,
        parameters: result.parameters
      });
      
      // Add the model to storage
      addModel({
        name: `Neural Network - ${datasetName}`,
        type: "DL",
        algorithm: "Neural Network",
        accuracy: result.accuracy,
        datasetName,
        parameters: result.parameters,
        neuralNetworkArchitecture: result.neuralNetworkArchitecture
      });
      
      setProgress(100);
      
      toast.success(`Training complete! Optimized network accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
      
      // Notify parent component
      onTrainingComplete();
    } catch (error) {
      console.error("Training error:", error);
      toast.error("An error occurred during training");
    } finally {
      setIsTraining(false);
    }
  };

  // Helper function to render architecture nodes
  const renderArchitectureNodes = (architecture: number[] | NeuralNetworkLayer[]) => {
    if (architecture.length === 0) return null;
    
    if (typeof architecture[0] === 'number') {
      // Handle number[] type
      return (architecture as number[]).map((neurons, index) => (
        <div key={index} className="flex items-center">
          <div className="h-px w-3 bg-border" />
          <div className={`
            px-3 py-1 text-xs rounded-full
            ${theme === "light" 
              ? "bg-primary/10 text-primary" 
              : "bg-primary/20 text-primary-foreground"}
          `}>
            Hidden ({neurons})
          </div>
        </div>
      ));
    } else {
      // Handle NeuralNetworkLayer[] type
      return (architecture as NeuralNetworkLayer[]).map((layer, index) => (
        <div key={index} className="flex items-center">
          <div className="h-px w-3 bg-border" />
          <div className={`
            px-3 py-1 text-xs rounded-full
            ${theme === "light" 
              ? "bg-primary/10 text-primary" 
              : "bg-primary/20 text-primary-foreground"}
          `}>
            Hidden ({layer.neurons})
          </div>
        </div>
      ));
    }
  };

  return (
    <div className={`
      card-container
      ${theme === "light" ? "card-container-light" : "card-container-dark"}
    `}>
      <h2 className="text-2xl font-semibold mb-4">Deep Learning Training</h2>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Dataset: {datasetName}</span>
          <span>Features: {features.length}</span>
        </div>
        
        <div className={`
          p-4 rounded-lg
          ${theme === "light" 
            ? "bg-secondary/50" 
            : "bg-secondary/30"}
        `}>
          <div className="flex items-center gap-2 mb-3">
            <Network className="h-5 w-5 text-primary" />
            <span className="font-medium">Dynamic Neural Network Optimization</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            The system will automatically adjust the neural network architecture
            to find the optimal configuration for your dataset.
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Target:</span>
            <span className={`
              px-3 py-1 text-xs rounded-full
              ${theme === "light" 
                ? "bg-accent/30 text-accent-foreground" 
                : "bg-accent/40 text-accent-foreground"}
            `}>
              {target}
            </span>
          </div>
        </div>
      </div>
      
      {!isTraining && !bestModel && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleStartTraining}
            className={`
              button-primary
              ${theme === "light" 
                ? "button-primary-light" 
                : "button-primary-dark"}
            `}
          >
            Start DL Training
          </button>
        </div>
      )}
      
      {(isTraining || bestModel) && (
        <div className="space-y-6">
          {isTraining && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-medium">Optimizing neural network...</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {progress.toFixed(0)}%
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
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {currentArchitecture.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Testing architecture:
                  </p>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <div className={`
                      px-3 py-1 text-xs rounded-full
                      ${theme === "light" 
                        ? "bg-muted/80 text-muted-foreground" 
                        : "bg-muted/40 text-muted-foreground"}
                    `}>
                      Input ({features.length})
                    </div>
                    
                    {currentArchitecture.map((neurons, index) => (
                      <div key={index} className="flex items-center">
                        <div className="h-px w-3 bg-border" />
                        <div className={`
                          px-3 py-1 text-xs rounded-full
                          ${theme === "light" 
                            ? "bg-primary/10 text-primary" 
                            : "bg-primary/20 text-primary-foreground"}
                        `}>
                          Hidden ({neurons})
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex items-center">
                      <div className="h-px w-3 bg-border" />
                      <div className={`
                        px-3 py-1 text-xs rounded-full
                        ${theme === "light" 
                          ? "bg-accent/30 text-accent-foreground" 
                          : "bg-accent/40 text-accent-foreground"}
                      `}>
                        Output (1)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {bestModel && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Optimized Neural Network</h3>
              </div>
              
              <div className={`
                p-4 rounded-lg
                ${theme === "light" 
                  ? "bg-secondary/50 shadow-neulight-sm" 
                  : "bg-secondary/30 shadow-neudark-sm"}
              `}>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium">
                    Accuracy: {(bestModel.accuracy * 100).toFixed(2)}%
                  </span>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Network Architecture</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <div className={`
                      px-3 py-1 text-xs rounded-full
                      ${theme === "light" 
                        ? "bg-muted/80 text-muted-foreground" 
                        : "bg-muted/40 text-muted-foreground"}
                    `}>
                      Input ({features.length})
                    </div>
                    
                    {renderArchitectureNodes(bestModel.architecture)}
                    
                    <div className="flex items-center">
                      <div className="h-px w-3 bg-border" />
                      <div className={`
                        px-3 py-1 text-xs rounded-full
                        ${theme === "light" 
                          ? "bg-accent/30 text-accent-foreground" 
                          : "bg-accent/40 text-accent-foreground"}
                      `}>
                        Output (1)
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      This model has been saved and can be accessed from the Model Storage
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`
                p-4 rounded-lg mt-4 border
                ${theme === "light" 
                  ? "border-green-200 bg-green-50" 
                  : "border-green-900/30 bg-green-900/10"}
              `}>
                <div className="flex items-start gap-3">
                  <TrendingUp className={`
                    h-5 w-5 mt-0.5
                    ${theme === "light" 
                      ? "text-green-600" 
                      : "text-green-400"}
                  `} />
                  <div>
                    <h4 className={`
                      font-medium
                      ${theme === "light" 
                        ? "text-green-800" 
                        : "text-green-400"}
                    `}>
                      Optimized Deep Learning Model
                    </h4>
                    <p className={`
                      text-sm mt-1
                      ${theme === "light" 
                        ? "text-green-700" 
                        : "text-green-500"}
                    `}>
                      The system automatically tested different neural network architectures
                      and selected the best performing one.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
