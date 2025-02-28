
import { useTheme } from "@/context/ThemeContext";
import { Upload, FileType, X, Check, AlertCircle } from "lucide-react";
import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface DatasetUploaderProps {
  onDatasetLoad: (
    data: any[],
    features: string[],
    target: string,
    name: string
  ) => void;
}

export function DatasetUploader({ onDatasetLoad }: DatasetUploaderProps) {
  const { theme } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetColumn, setTargetColumn] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'text/csv', 
      'application/json',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const fileName = file.name.toLowerCase();
    
    return validTypes.includes(file.type) || 
           fileName.endsWith('.csv') || 
           fileName.endsWith('.json') || 
           fileName.endsWith('.xlsx') || 
           fileName.endsWith('.xls');
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const handleFile = (file: File) => {
    if (!isValidFileType(file)) {
      toast.error("Please upload a CSV, Excel, or JSON file");
      return;
    }

    setFile(file);
    setIsProcessing(true);

    const fileExtension = getFileExtension(file.name);
    
    if (fileExtension === 'csv') {
      processCSVFile(file);
    } else if (fileExtension === 'json') {
      processJSONFile(file);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      processExcelFile(file);
    } else {
      toast.error("Unsupported file format");
      setFile(null);
      setIsProcessing(false);
    }
  };

  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        setColumns(headers);
        setTargetColumn(headers[headers.length - 1]); // Default to last column
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing CSV:", error);
        toast.error("Error processing the CSV file");
        setFile(null);
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  const processJSONFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // Check if it's an array of objects
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("JSON file must contain an array of objects");
        }
        
        // Extract headers from the first object
        const headers = Object.keys(jsonData[0]);
        
        if (headers.length === 0) {
          throw new Error("JSON file contains empty objects");
        }
        
        setColumns(headers);
        setTargetColumn(headers[headers.length - 1]); // Default to last column
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing JSON:", error);
        toast.error(error instanceof Error ? error.message : "Error processing the JSON file");
        setFile(null);
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
  };

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert the worksheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // First row contains headers
        if (jsonData.length === 0 || !Array.isArray(jsonData[0])) {
          throw new Error("Excel file has no data or invalid format");
        }
        
        const headers = jsonData[0] as string[];
        
        if (headers.length === 0) {
          throw new Error("Excel file has no columns");
        }
        
        setColumns(headers);
        setTargetColumn(headers[headers.length - 1]); // Default to last column
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing Excel:", error);
        toast.error(error instanceof Error ? error.message : "Error processing the Excel file");
        setFile(null);
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const processDataset = () => {
    if (!file || !targetColumn) return;
    
    setIsProcessing(true);
    
    const fileExtension = getFileExtension(file.name);
    
    if (fileExtension === 'csv') {
      processCSVDataset(file);
    } else if (fileExtension === 'json') {
      processJSONDataset(file);
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      processExcelDataset(file);
    } else {
      toast.error("Unsupported file format");
      setIsProcessing(false);
    }
  };

  const processCSVDataset = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const targetIndex = headers.indexOf(targetColumn);
        
        if (targetIndex === -1) {
          throw new Error("Target column not found");
        }
        
        const data = [];
        
        // Skip header row, process data rows
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue; // Skip empty lines
          
          const values = lines[i].split(',').map(v => v.trim());
          
          if (values.length !== headers.length) {
            console.warn(`Skipping row ${i}: incorrect number of columns`);
            continue;
          }
          
          const row: Record<string, any> = {};
          
          for (let j = 0; j < headers.length; j++) {
            // Convert numeric values to numbers
            const value = values[j];
            const numValue = parseFloat(value);
            row[headers[j]] = isNaN(numValue) ? value : numValue;
          }
          
          data.push(row);
        }
        
        // All columns except target are features
        const features = headers.filter(h => h !== targetColumn);
        
        onDatasetLoad(data, features, targetColumn, file.name);
        toast.success("Dataset loaded successfully");
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing dataset:", error);
        toast.error("Error processing the dataset");
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  const processJSONDataset = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          throw new Error("JSON file must contain an array of objects");
        }
        
        // Convert string values that look like numbers to actual numbers
        const data = jsonData.map(row => {
          const processedRow: Record<string, any> = {};
          
          for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string') {
              const numValue = parseFloat(value);
              processedRow[key] = !isNaN(numValue) ? numValue : value;
            } else {
              processedRow[key] = value;
            }
          }
          
          return processedRow;
        });
        
        // Get all possible columns
        const headers = Object.keys(data[0]);
        
        if (!headers.includes(targetColumn)) {
          throw new Error("Target column not found in JSON data");
        }
        
        // All columns except target are features
        const features = headers.filter(h => h !== targetColumn);
        
        onDatasetLoad(data, features, targetColumn, file.name);
        toast.success("Dataset loaded successfully");
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing JSON dataset:", error);
        toast.error(error instanceof Error ? error.message : "Error processing the dataset");
        setIsProcessing(false);
      }
    };
    
    reader.readAsText(file);
  };

  const processExcelDataset = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          throw new Error("Excel file has no data");
        }
        
        // Check if target column exists
        const headers = Object.keys(jsonData[0]);
        
        if (!headers.includes(targetColumn)) {
          throw new Error("Target column not found in Excel data");
        }
        
        // Convert string values that look like numbers to actual numbers
        const processedData = jsonData.map(row => {
          const processedRow: Record<string, any> = {};
          
          for (const [key, value] of Object.entries(row)) {
            if (typeof value === 'string') {
              const numValue = parseFloat(value as string);
              processedRow[key] = !isNaN(numValue) ? numValue : value;
            } else {
              processedRow[key] = value;
            }
          }
          
          return processedRow;
        });
        
        // All columns except target are features
        const features = headers.filter(h => h !== targetColumn);
        
        onDatasetLoad(processedData, features, targetColumn, file.name);
        toast.success("Dataset loaded successfully");
        setIsProcessing(false);
      } catch (error) {
        console.error("Error processing Excel dataset:", error);
        toast.error(error instanceof Error ? error.message : "Error processing the dataset");
        setIsProcessing(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className={`
      card-container
      ${theme === "light" ? "card-container-light" : "card-container-dark"}
    `}>
      <h2 className="text-2xl font-semibold mb-4">Upload Dataset</h2>
      
      {!file ? (
        <>
          <div
            className={`
              border-2 border-dashed rounded-xl p-8 mb-4 transition-all duration-300
              ${isDragging ? "border-primary" : "border-muted-foreground/30"}
              ${theme === "light" 
                ? "bg-secondary/50" 
                : "bg-secondary/30"}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center gap-4">
              <div className={`
                p-4 rounded-full
                ${theme === "light" 
                  ? "bg-primary/10" 
                  : "bg-primary/20"}
              `}>
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">
                  Drag and drop your dataset file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileType className="h-4 w-4" />
                <span>Accepted formats: CSV, Excel (.xlsx, .xls), JSON</span>
              </div>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.json,.xlsx,.xls"
            className="hidden"
          />
        </>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className={`
            p-4 rounded-lg flex items-center gap-3
            ${theme === "light" 
              ? "bg-secondary/50 shadow-neulight-sm" 
              : "bg-secondary/30 shadow-neudark-sm"}
          `}>
            <Check className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className={`
                p-2 rounded-full
                ${theme === "light" 
                  ? "bg-secondary hover:bg-secondary/80 shadow-neulight-sm" 
                  : "bg-secondary hover:bg-secondary/80 shadow-neudark-sm"}
              `}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {columns.length > 0 && (
            <div className="space-y-3 mt-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Select target column:
                </label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className={`
                    input-field
                    ${theme === "light" 
                      ? "input-field-light" 
                      : "input-field-dark"}
                  `}
                >
                  {columns.map((column) => (
                    <option key={column} value={column}>
                      {column}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2 mt-1">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Select the column you want to predict
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <button
              onClick={processDataset}
              disabled={isProcessing || !targetColumn}
              className={`
                button-primary
                ${theme === "light" 
                  ? "button-primary-light" 
                  : "button-primary-dark"}
                ${isProcessing ? "opacity-70 cursor-not-allowed" : ""}
              `}
            >
              {isProcessing ? "Processing..." : "Load Dataset"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
