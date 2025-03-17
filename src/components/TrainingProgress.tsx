import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, ChevronDown, Play, Square, Loader2, Terminal } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TrainingProgressProps {
  modelName: string;
  isTraining?: boolean;
  estimatedTime?: number; // in seconds
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  logs?: string[];
  progress?: number;
  error?: string | null;
  algorithmType?: string;
}

export function TrainingProgress({ 
  modelName, 
  isTraining = false,
  estimatedTime,
  onPause,
  onResume,
  onCancel,
  logs: externalLogs,
  progress: externalProgress,
  error: externalError,
  algorithmType
}: TrainingProgressProps) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "training" | "paused" | "completed" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [trainingTime, setTrainingTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) {
      setLogs(externalLogs);
    }
  }, [externalLogs]);
  
  useEffect(() => {
    if (externalProgress !== undefined) {
      setProgress(externalProgress);
      
      if (externalProgress >= 100 && status === "training") {
        setStatus("completed");
        if (startTime) {
          setTrainingTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }
    }
  }, [externalProgress, status]);
  
  useEffect(() => {
    if (externalError) {
      setError(externalError);
      setStatus("error");
    } else {
      setError(null);
    }
  }, [externalError]);
  
  useEffect(() => {
    if (isTraining && (status === "idle" || status === "paused")) {
      setStatus("training");
      if (status === "idle") {
        setProgress(0);
        setLogs([]);
        setStartTime(Date.now());
      }
    } else if (!isTraining && status === "training") {
      if (progress < 100 && !externalError) {
        setStatus("paused");
      }
    }
  }, [isTraining, status, progress, externalError]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === "training" && progress < 100 && externalProgress === undefined) {
      interval = setInterval(() => {
        setProgress(prev => {
          let incrementFactor = 1;
          if (algorithmType === "Neural Network") {
            incrementFactor = 0.5;
          } else if (["Random Forest", "XGBoost", "Gradient Boosting"].includes(algorithmType || "")) {
            incrementFactor = 0.7;
          }
          
          const increment = Math.random() * 3 * incrementFactor;
          const newValue = Math.min(prev + increment, 100);
          
          if (Math.random() > 0.7) {
            const epoch = Math.floor(newValue / 5);
            const accuracy = (0.7 + (newValue / 100) * 0.25).toFixed(4);
            const loss = (0.8 - (newValue / 100) * 0.6).toFixed(4);
            
            let logMessage = "";
            if (algorithmType === "Neural Network") {
              logMessage = `Epoch ${epoch}: accuracy=${accuracy}, loss=${loss}`;
            } else if (["K-Means", "DBSCAN", "PCA"].includes(algorithmType || "")) {
              logMessage = `Iteration ${epoch}: inertia=${loss}, silhouette=${accuracy}`;
            } else {
              logMessage = `Training progress ${newValue.toFixed(1)}%: accuracy=${accuracy}`;
            }
            
            setLogs(prev => [...prev, logMessage]);
          }
          
          if (newValue >= 100) {
            setStatus("completed");
            if (startTime) {
              setTrainingTime(Math.floor((Date.now() - startTime) / 1000));
            }
            clearInterval(interval);
          }
          
          return newValue;
        });
      }, 300);
    }
    
    return () => clearInterval(interval);
  }, [status, progress, externalProgress, algorithmType]);
  
  const handlePause = () => {
    setStatus("paused");
    if (onPause) onPause();
  };
  
  const handleResume = () => {
    setStatus("training");
    if (onResume) onResume();
  };
  
  const handleCancel = () => {
    setStatus("idle");
    setProgress(0);
    setLogs([]);
    setError(null);
    if (onCancel) onCancel();
  };
  
  const statusColors = {
    idle: "bg-muted",
    training: "bg-blue-500",
    paused: "bg-amber-500",
    completed: "bg-green-500",
    error: "bg-red-500"
  };
  
  const statusLabels = {
    idle: "Ready",
    training: "Training...",
    paused: "Paused",
    completed: "Completed",
    error: "Error"
  };
  
  const statusIcons = {
    idle: <Play className="h-4 w-4" />,
    training: <Loader2 className="h-4 w-4 animate-spin" />,
    paused: <Play className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />
  };

  const formatTrainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const calculateTimeRemaining = () => {
    if (!startTime || progress <= 0 || status !== "training") return null;
    
    if (estimatedTime) {
      const remainingPercentage = (100 - progress) / 100;
      return Math.ceil(estimatedTime * remainingPercentage);
    }
    
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const progressRate = progress / elapsedSeconds;
    if (progressRate <= 0) return null;
    
    const remainingProgress = 100 - progress;
    const remainingSeconds = Math.ceil(remainingProgress / progressRate);
    
    return remainingSeconds;
  };
  
  const timeRemaining = calculateTimeRemaining();

  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Training Progress</CardTitle>
        <CardDescription>{modelName}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${statusColors[status]}`}></span>
              <span>{statusLabels[status]}</span>
            </div>
            <span>{Math.round(progress)}%</span>
          </div>
          
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex gap-2 justify-end">
          {status === "training" && (
            <Button variant="outline" size="sm" onClick={handlePause}>
              <Square className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
          
          {status === "paused" && (
            <Button variant="outline" size="sm" onClick={handleResume}>
              <Play className="h-4 w-4 mr-1" />
              Resume
            </Button>
          )}
          
          {(status === "training" || status === "paused") && (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
        
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Terminal className="h-4 w-4" />
              <span>Training logs</span>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                <span className="sr-only">Toggle logs</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent>
            <div className={`
              h-40 overflow-y-auto rounded-md p-3 text-xs font-mono mt-1
              ${theme === "light" 
                ? "bg-secondary/80 shadow-neulight-inset" 
                : "bg-secondary/40 shadow-neudark-inset"}
            `}>
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div key={i} className="py-0.5">{log}</div>
                ))
              ) : (
                <span className="text-muted-foreground">No logs available</span>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {status === "training" ? (
            timeRemaining ? (
              <span>Estimated time remaining: {formatTrainingTime(timeRemaining)}</span>
            ) : (
              <span className="animate-pulse">Estimating time remaining...</span>
            )
          ) : status === "completed" && trainingTime ? (
            <span>Training completed in {formatTrainingTime(trainingTime)}</span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
