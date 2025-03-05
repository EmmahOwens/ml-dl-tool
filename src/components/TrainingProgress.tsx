
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ChevronDown, Play, Square } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TrainingProgressProps {
  modelName: string;
  isTraining?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

export function TrainingProgress({ 
  modelName, 
  isTraining = false,
  onPause,
  onResume,
  onCancel
}: TrainingProgressProps) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "training" | "paused" | "completed" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [trainingTime, setTrainingTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Initialize or update status based on isTraining prop
  useEffect(() => {
    if (isTraining && status === "idle") {
      setStatus("training");
      setProgress(0);
      setLogs([]);
      setStartTime(Date.now());
    } else if (!isTraining && status === "training") {
      // If external control stops training but we haven't reached 100%
      if (progress < 100) {
        setStatus("paused");
      }
    }
  }, [isTraining, status, progress]);
  
  // Simulate training progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === "training" && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 3; // Random progress increment
          const newValue = Math.min(prev + increment, 100);
          
          // Simulate adding logs
          if (Math.random() > 0.7) {
            const epoch = Math.floor(newValue / 5);
            const accuracy = (0.7 + (newValue / 100) * 0.25).toFixed(4);
            const loss = (0.8 - (newValue / 100) * 0.6).toFixed(4);
            setLogs(prev => [...prev, `Epoch ${epoch}: accuracy=${accuracy}, loss=${loss}`]);
          }
          
          // Complete when reaching 100%
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
  }, [status, progress, startTime]);
  
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
    training: <Play className="h-4 w-4" />,
    paused: <Play className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />
  };

  // Format the training time as minutes and seconds
  const formatTrainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Training Progress</CardTitle>
        <CardDescription>{modelName}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
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
              {statusIcons[status]}
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
            <span className="animate-pulse">Estimating time remaining...</span>
          ) : status === "completed" && trainingTime ? (
            <span>Training completed in {formatTrainingTime(trainingTime)}</span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
