
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Model, useModels } from "@/context/ModelContext";
import { Download, MoreVertical, Trash, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/MultiSelect";
import { toast } from "sonner";

export const ModelCard: React.FC<{ model: Model }> = ({ model }) => {
  const { deleteModel, downloadModel, fineTuneModel } = useModels();
  const [isFineTuneOpen, setIsFineTuneOpen] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState("json");
  const [isDeleting, setIsDeleting] = useState(false);
  const [fineTuneOptions, setFineTuneOptions] = useState({
    epochs: 50,
    learningRate: 0.001,
    batchSize: 32,
    optimizer: "Adam",
    datasetSplit: 0.2,
    targets: model.targets || []
  });
  const [availableTargets] = useState(["price", "sales", "revenue", "rating", "quantity", "conversion", "clicks"]);
  
  // Available file extensions based on model type
  const getFileExtensions = () => {
    const commonFormats = ["json", "onnx"];
    
    if (model.type === "ML") {
      return [...commonFormats, "pkl", "pickle", "joblib"];
    } else if (model.type === "DL") {
      return [...commonFormats, "h5", "keras", "pb", "pt", "pth"];
    }
    
    return commonFormats;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return "bg-green-500";
    if (accuracy >= 0.8) return "bg-emerald-500";
    if (accuracy >= 0.7) return "bg-blue-500";
    if (accuracy >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleFineTune = async () => {
    try {
      await fineTuneModel(model.id, fineTuneOptions);
      setIsFineTuneOpen(false);
      toast.success("Model fine-tuning started");
    } catch (error) {
      console.error("Error fine-tuning model:", error);
      toast.error("Failed to fine-tune model");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteModel(model.id);
      toast.success("Model deleted successfully");
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadModel(model.id, selectedExtension);
      setIsDownloadOpen(false);
    } catch (error) {
      console.error("Error downloading model:", error);
      toast.error("Failed to download model");
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md">
        <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
          <div>
            <h3 className="font-medium text-base truncate">{model.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{model.algorithm}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mt-1">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsFineTuneOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Fine-tune
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDownloadOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 gap-2 text-sm mb-2">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p>{model.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dataset</p>
              <p className="truncate">{model.datasetName}</p>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Accuracy</span>
              <span className="text-sm font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full ${getAccuracyColor(model.accuracy)}`}
                style={{ width: `${model.accuracy * 100}%` }}
              />
            </div>
          </div>
          {model.targets && model.targets.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground mb-1">Targets</p>
              <div className="flex flex-wrap gap-1">
                {model.targets.map((target) => (
                  <Badge key={target} variant="secondary" className="text-xs">
                    {target}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
          Created {model.created.toLocaleDateString()}
        </CardFooter>
      </Card>

      {/* Fine-tune Dialog */}
      <Dialog open={isFineTuneOpen} onOpenChange={setIsFineTuneOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Fine-tune Model</DialogTitle>
            <DialogDescription>
              Adjust parameters to fine-tune the {model.name} model.
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
                onChange={(e) => setFineTuneOptions({...fineTuneOptions, epochs: parseInt(e.target.value) || 1})}
                className="col-span-3"
                min="1"
                max="1000"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="learningRate" className="text-right">
                Learning Rate
              </Label>
              <Input
                id="learningRate"
                type="number"
                value={fineTuneOptions.learningRate}
                onChange={(e) => setFineTuneOptions({...fineTuneOptions, learningRate: parseFloat(e.target.value) || 0.001})}
                className="col-span-3"
                step="0.001"
                min="0.0001"
                max="1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="batchSize" className="text-right">
                Batch Size
              </Label>
              <Input
                id="batchSize"
                type="number"
                value={fineTuneOptions.batchSize}
                onChange={(e) => setFineTuneOptions({...fineTuneOptions, batchSize: parseInt(e.target.value) || 1})}
                className="col-span-3"
                min="1"
                max="1024"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="optimizer" className="text-right">
                Optimizer
              </Label>
              <Select 
                value={fineTuneOptions.optimizer} 
                onValueChange={(value) => setFineTuneOptions({...fineTuneOptions, optimizer: value})}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select optimizer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Adam">Adam</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="RMSprop">RMSprop</SelectItem>
                  <SelectItem value="Adagrad">Adagrad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targets" className="text-right">
                Targets
              </Label>
              <div className="col-span-3">
                <MultiSelect 
                  selected={fineTuneOptions.targets}
                  setSelected={(selected) => setFineTuneOptions({...fineTuneOptions, targets: selected})}
                  options={availableTargets.map(t => ({ label: t, value: t }))}
                  placeholder="Select targets"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFineTuneOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFineTune}>
              Fine-tune
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Dialog */}
      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Download Model</DialogTitle>
            <DialogDescription>
              Choose a file format to download the {model.name} model.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fileExtension" className="text-right">
                File Format
              </Label>
              <Select
                value={selectedExtension}
                onValueChange={setSelectedExtension}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select file format" />
                </SelectTrigger>
                <SelectContent>
                  {getFileExtensions().map((ext) => (
                    <SelectItem key={ext} value={ext}>
                      .{ext}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownload}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
