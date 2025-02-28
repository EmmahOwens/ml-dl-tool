
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";
import { useModels, Algorithm } from "@/context/ModelContext";
import { trainAnomalyDetectionModels, getBestMLModel } from "@/utils/mlAlgorithms";
import { toast } from "sonner";
import { 
  AlertTriangle,
  Timer,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Scan
} from "lucide-react";

interface AnomalyDetectionTrainingProps {
  data: any[];
  features: string[];
  datasetName: string;
  onTrainingComplete: () => void;
}

interface TrainingResult {
  algorithm: Algorithm;
  accuracy: number;
  parameters: Record<string, any>;
}

export function AnomalyDetectionTraining({
  data,
  features,
  datasetName,
  onTrainingComplete
}: AnomalyDetectionTrainingProps) {
  const { theme } = useTheme();
  const { addModel } = useModels();
  const [isTraining, setIsTraining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TrainingResult[]>([]);
  const [bestModel, setBestModel] = useState<TrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartTraining = async () => {
    if (isTraining || isSaving) return;
    
    setIsTraining(true);
    setProgress(0);
    setResults([]);
    setBestModel(null);
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
      
      // Train all anomaly detection models
      const results = await trainAnomalyDetectionModels(data, features);
      
      // Sort results by accuracy (descending)
      const sortedResults = [...results].sort((a, b) => b.accuracy - a.accuracy);
      setResults(sortedResults);
      
      // Get the best model
      const best = getBestMLModel(results);
      setBestModel(best);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Add the best model to storage
      setIsSaving(true);
      await addModel({
        name: `${best.algorithm} - ${datasetName}`,
        type: "Anomaly Detection",
        algorithm: best.algorithm,
        accuracy: best.accuracy,
        datasetName,
        parameters: best.parameters,
      });
      
      toast.success(`Training complete! Best model: ${best.algorithm} (${(best.accuracy * 100).toFixed(2)}%)`);
      
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

  return (
    <div className={`
      card-container
      ${theme === "light" ? "card-container-light" : "card-container-dark"}
    `}>
      <h2 className="text-2xl font-semibold mb-4">Anomaly Detection</h2>
      
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
            <Scan className="h-5 w-5 text-primary" />
            <span className="font-medium">Outlier & Anomaly Detection</span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            Identify unusual patterns that do not conform to expected behavior, such as fraud or system failures.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {features.map(feature => (
              <span 
                key={feature}
                className={`
                  px-3 py-1 text-xs rounded-full
                  ${theme === "light" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-primary/20 text-primary-foreground"}
                `}
              >
                {feature}
              </span>
            ))}
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
      
      {!isTraining && !isSaving && results.length === 0 && (
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
            Start Anomaly Detection
          </button>
        </div>
      )}
      
      {(isTraining || isSaving || results.length > 0) && (
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
                  ? "Saving best model to database..." 
                  : "Detecting outliers and anomalies in your dataset"}
              </p>
            </div>
          )}
          
          {results.length > 0 && !isTraining && !isSaving && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Training Results</h3>
              </div>
              
              <div className={`
                rounded-lg overflow-hidden
                ${theme === "light" 
                  ? "bg-secondary/50 shadow-neulight-sm" 
                  : "bg-secondary/30 shadow-neudark-sm"}
              `}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`
                        text-left
                        ${theme === "light" 
                          ? "bg-muted/50" 
                          : "bg-muted/30"}
                      `}>
                        <th className="px-4 py-3 text-sm font-medium">Algorithm</th>
                        <th className="px-4 py-3 text-sm font-medium text-right">Detection Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr 
                          key={result.algorithm}
                          className={`
                            border-t
                            ${theme === "light" 
                              ? "border-border/30" 
                              : "border-border/10"}
                            ${bestModel && result.algorithm === bestModel.algorithm 
                              ? theme === "light" 
                                ? "bg-primary/5" 
                                : "bg-primary/10" 
                              : ""}
                          `}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {bestModel && result.algorithm === bestModel.algorithm && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                              <span>{result.algorithm}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`
                              px-2 py-1 rounded-md
                              ${bestModel && result.algorithm === bestModel.algorithm
                                ? theme === "light" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-green-900/30 text-green-400"
                                : theme === "light"
                                  ? "bg-muted/80 text-muted-foreground" 
                                  : "bg-muted/40 text-muted-foreground"}
                            `}>
                              {(result.accuracy * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {bestModel && (
                <div className={`
                  p-4 rounded-lg mt-6 border
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
                        Best Detector: {bestModel.algorithm}
                      </h4>
                      <p className={`
                        text-sm mt-1
                        ${theme === "light" 
                          ? "text-green-700" 
                          : "text-green-500"}
                      `}>
                        {(bestModel.accuracy * 100).toFixed(2)}% detection rate
                      </p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          This model has been saved to the database and can be accessed from the Model Storage
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
