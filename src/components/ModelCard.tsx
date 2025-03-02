
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  MoreVertical, 
  Download, 
  Trash2, 
  Settings, 
  BarChart 
} from "lucide-react";
import { Model, useModels, FineTuneOptions } from "@/context/ModelContext";
import { format } from "date-fns";

interface ModelCardProps {
  model: Model;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  const { deleteModel, downloadModel, fineTuneModel } = useModels();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [fineTuneOptions, setFineTuneOptions] = useState<FineTuneOptions>({
    epochs: 50,
    learningRate: 0.001,
    batchSize: 32,
    optimizer: "Adam",
    targets: model.targets || [],
  });
  const [newTarget, setNewTarget] = useState("");

  const handleDelete = async () => {
    try {
      await deleteModel(model.id);
      setIsDeleting(false);
    } catch (error) {
      console.error("Error deleting model:", error);
    }
  };

  const handleDownload = async () => {
    await downloadModel(model.id);
  };

  const handleFineTune = async () => {
    try {
      await fineTuneModel(model.id, fineTuneOptions);
      setIsFineTuning(false);
    } catch (error) {
      console.error("Error fine-tuning model:", error);
    }
  };

  const addTarget = () => {
    if (newTarget && !fineTuneOptions.targets?.includes(newTarget)) {
      setFineTuneOptions({
        ...fineTuneOptions,
        targets: [...(fineTuneOptions.targets || []), newTarget]
      });
      setNewTarget("");
    }
  };

  const removeTarget = (target: string) => {
    setFineTuneOptions({
      ...fineTuneOptions,
      targets: fineTuneOptions.targets?.filter(t => t !== target)
    });
  };

  return (
    <>
      <Card className="relative">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{model.name}</CardTitle>
              <CardDescription>
                {format(model.created, "PPP")}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute top-2 right-2">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsFineTuning(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Fine-tune
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleting(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline">{model.type}</Badge>
            <Badge>{model.algorithm}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Accuracy</span>
              <span className="text-sm">{(model.accuracy * 100).toFixed(2)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${model.accuracy * 100}%` }}
              />
            </div>
            {model.targets && model.targets.length > 0 && (
              <div className="mt-3">
                <span className="text-sm font-medium">Targets:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {model.targets.map((target, index) => (
                    <Badge key={index} variant="secondary">{target}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="text-xs text-muted-foreground w-full">
            <div className="flex justify-between">
              <span>Dataset: {model.datasetName}</span>
              {model.parameters?.fineTuned && (
                <Badge variant="outline" className="text-xs">Fine-tuned</Badge>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the model "{model.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine-tune Dialog */}
      <Dialog open={isFineTuning} onOpenChange={setIsFineTuning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fine-tune Model</DialogTitle>
            <DialogDescription>
              Adjust parameters to fine-tune the "{model.name}" model for improved performance.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="epochs">Epochs</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  id="epochs"
                  min={10} 
                  max={200} 
                  step={10}
                  value={[fineTuneOptions.epochs || 50]}
                  onValueChange={([value]) => setFineTuneOptions({...fineTuneOptions, epochs: value})}
                />
                <span className="w-12 text-center">{fineTuneOptions.epochs}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="learningRate">Learning Rate</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  id="learningRate"
                  min={0.0001} 
                  max={0.01} 
                  step={0.0001}
                  value={[fineTuneOptions.learningRate || 0.001]}
                  onValueChange={([value]) => setFineTuneOptions({...fineTuneOptions, learningRate: value})}
                />
                <span className="w-16 text-center">{fineTuneOptions.learningRate?.toFixed(4)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <div className="flex items-center gap-2">
                <Slider 
                  id="batchSize"
                  min={8} 
                  max={128} 
                  step={8}
                  value={[fineTuneOptions.batchSize || 32]}
                  onValueChange={([value]) => setFineTuneOptions({...fineTuneOptions, batchSize: value})}
                />
                <span className="w-12 text-center">{fineTuneOptions.batchSize}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="optimizer">Optimizer</Label>
              <Select 
                value={fineTuneOptions.optimizer || "Adam"}
                onValueChange={(value) => setFineTuneOptions({...fineTuneOptions, optimizer: value})}
              >
                <SelectTrigger id="optimizer">
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
            
            <div className="space-y-2">
              <Label htmlFor="targets">Targets</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="targets"
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="Add target feature"
                  />
                  <Button type="button" onClick={addTarget} size="sm">
                    Add
                  </Button>
                </div>
                
                {fineTuneOptions.targets && fineTuneOptions.targets.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {fineTuneOptions.targets.map((target, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {target}
                        <button 
                          onClick={() => removeTarget(target)}
                          className="ml-1 h-3 w-3 rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/40 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No targets selected</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFineTuning(false)}>
              Cancel
            </Button>
            <Button onClick={handleFineTune}>
              Fine-tune
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
