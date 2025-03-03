
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Model, useModels } from "@/context/ModelContext";
import { ModelExportDialog } from "@/components/ModelExportDialog";
import { getRecommendedExtensions } from "@/utils/modelExportFormats";
import { Download, BarChart, Trash, FileCode, Settings, Database, Brain } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface ModelCardProps {
  model: Model;
}

export function ModelCard({ model }: ModelCardProps) {
  const { deleteModel, updateModel, downloadModel, fineTuneModel, predictWithModel } = useModels();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isFineTuningOpen, setIsFineTuningOpen] = useState(false);
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [fineTuneOptions, setFineTuneOptions] = useState({
    epochs: 50,
    learningRate: 0.001,
  });
  const [predictionInput, setPredictionInput] = useState("");
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteModel(model.id);
      setConfirmDelete(false);
      toast.success("Model deleted successfully");
    } catch (error) {
      toast.error("Failed to delete model");
    }
  };

  const handleExport = async (fileExtension: string) => {
    try {
      await downloadModel(model.id, fileExtension);
    } catch (error) {
      toast.error("Failed to export model");
    }
  };

  const handleFineTune = async () => {
    try {
      setIsSubmitting(true);
      await fineTuneModel(model.id, fineTuneOptions);
      setIsFineTuningOpen(false);
      toast.success("Model fine-tuned successfully");
    } catch (error) {
      toast.error("Failed to fine-tune model");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePredict = async () => {
    try {
      setIsSubmitting(true);
      
      // Parse input data (assuming comma-separated values for simplicity)
      const inputValues = predictionInput.split(',').map(val => {
        const parsed = parseFloat(val.trim());
        return isNaN(parsed) ? val.trim() : parsed;
      });
      
      const result = await predictWithModel(model.id, [inputValues]);
      
      if (result.success) {
        setPredictionResult(result.predictions);
        toast.success("Prediction successful");
      } else {
        toast.error("Prediction failed");
      }
    } catch (error) {
      toast.error(`Prediction error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate color for the accuracy badge
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "green";
    if (accuracy >= 0.8) return "emerald";
    if (accuracy >= 0.7) return "blue";
    if (accuracy >= 0.6) return "yellow";
    return "red";
  };

  const accuracyColor = getAccuracyColor(model.accuracy);
  const accuracyPercent = (model.accuracy * 100).toFixed(1);
  
  // Check if model can be used for prediction
  const canMakePredictions = true; // model.is_trained or some other condition

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="mb-2">
            <div className="flex justify-between items-start">
              <h3 className="font-medium truncate">{model.name}</h3>
              <Badge variant="outline">{model.type}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{model.algorithm}</p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Accuracy</span>
              <span className="text-sm font-medium">{accuracyPercent}%</span>
            </div>
            
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-${accuracyColor}-500`}
                style={{ width: `${model.accuracy * 100}%` }}
              />
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Dataset</span>
              <span className="text-sm truncate max-w-[150px]">{model.datasetName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm">Created</span>
              <span className="text-sm">{formatDate(model.created)}</span>
            </div>
          </div>
          
          {model.targets && model.targets.length > 0 && (
            <div className="mt-3">
              <span className="text-sm text-muted-foreground block mb-1">Targets:</span>
              <div className="flex flex-wrap gap-1">
                {model.targets.map((target, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{target}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/50 px-4 py-3 flex justify-between">
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => setExportDialogOpen(true)}>
              <FileCode className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFineTuningOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-1">
            {canMakePredictions && (
              <Button variant="outline" size="sm" onClick={() => setIsPredictionOpen(true)}>
                <Database className="h-4 w-4 mr-1" />
                Predict
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Export Dialog */}
      <ModelExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        model={model}
        onExport={handleExport}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this model? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Fine-tuning Dialog */}
      <Dialog open={isFineTuningOpen} onOpenChange={setIsFineTuningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fine-tune Model</DialogTitle>
            <DialogDescription>
              Adjust parameters to improve model performance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="epochs" className="text-right">
                Epochs
              </Label>
              <Input
                id="epochs"
                type="number"
                value={fineTuneOptions.epochs}
                onChange={(e) => setFineTuneOptions({...fineTuneOptions, epochs: parseInt(e.target.value)})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="learning-rate" className="text-right">
                Learning Rate
              </Label>
              <Input
                id="learning-rate"
                type="number"
                step="0.0001"
                value={fineTuneOptions.learningRate}
                onChange={(e) => setFineTuneOptions({...fineTuneOptions, learningRate: parseFloat(e.target.value)})}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFineTuningOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFineTune} disabled={isSubmitting}>
              Fine-tune
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Prediction Dialog */}
      <Dialog open={isPredictionOpen} onOpenChange={setIsPredictionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Prediction</DialogTitle>
            <DialogDescription>
              Enter input values separated by commas to make a prediction.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="input-data" className="text-right">
                Input Data
              </Label>
              <Input
                id="input-data"
                placeholder="1.2, 3.4, 5.6"
                value={predictionInput}
                onChange={(e) => setPredictionInput(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            {predictionResult !== null && (
              <div className="bg-secondary p-3 rounded-md">
                <p className="font-medium">Prediction Result:</p>
                <pre className="text-sm mt-2 overflow-x-auto">
                  {JSON.stringify(predictionResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPredictionOpen(false)}>
              Close
            </Button>
            <Button onClick={handlePredict} disabled={isSubmitting || !predictionInput.trim()}>
              <Brain className="h-4 w-4 mr-1" />
              Predict
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
