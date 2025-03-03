
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Model } from "@/context/ModelContext";
import { getRecommendedExtensions } from "@/utils/modelExportFormats";

interface ModelExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: Model;
  onExport: (fileExtension: string) => void;
}

export function ModelExportDialog({
  open,
  onOpenChange,
  model,
  onExport,
}: ModelExportDialogProps) {
  const recommendedExtensions = getRecommendedExtensions(model);
  const [selectedExtension, setSelectedExtension] = useState(recommendedExtensions[0] || 'json');

  const handleExport = () => {
    onExport(selectedExtension);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Model: {model.name}</DialogTitle>
          <DialogDescription>
            Choose a file format to export this simulated model. Note that this is a demonstration
            model and won't have actual prediction capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select
              value={selectedExtension}
              onValueChange={setSelectedExtension}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                {recommendedExtensions.map((ext) => (
                  <SelectItem key={ext} value={ext}>
                    .{ext}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
