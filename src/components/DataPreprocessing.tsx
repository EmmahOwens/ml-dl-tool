
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Database, FileSpreadsheet, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "text" | "date" | "boolean";
  missing: number; // % of missing values
  unique: number; // count of unique values
  selected: boolean; // for feature selection
}

export function DataPreprocessing() {
  const { theme } = useTheme();
  const [preprocessing, setPreprocessing] = useState({
    normalize: true,
    impute: true,
    encode: true,
    outliers: false,
    featureSelection: false,
    featureEngineering: false,
  });
  
  const [normalizationMethod, setNormalizationMethod] = useState("standard");
  const [imputationMethod, setImputationMethod] = useState("mean");
  const [encodingMethod, setEncodingMethod] = useState("onehot");
  const [outlierMethod, setOutlierMethod] = useState("iqr");
  const [selectionMethod, setSelectionMethod] = useState("importance");
  
  const [columns, setColumns] = useState<ColumnInfo[]>([
    { name: "age", type: "numeric", missing: 2.5, unique: 87, selected: true },
    { name: "income", type: "numeric", missing: 4.8, unique: 453, selected: true },
    { name: "gender", type: "categorical", missing: 0, unique: 2, selected: true },
    { name: "education", type: "categorical", missing: 1.2, unique: 5, selected: true },
    { name: "occupation", type: "categorical", missing: 3.5, unique: 12, selected: true },
    { name: "marital_status", type: "categorical", missing: 0.8, unique: 4, selected: true },
    { name: "has_children", type: "boolean", missing: 0, unique: 2, selected: true },
    { name: "signup_date", type: "date", missing: 0, unique: 734, selected: false },
    { name: "last_purchase", type: "date", missing: 15.3, unique: 402, selected: true },
    { name: "comments", type: "text", missing: 68.2, unique: 927, selected: false },
  ]);
  
  const [selectionThreshold, setSelectionThreshold] = useState<number>(50);
  
  const handleColumnSelection = (name: string, selected: boolean) => {
    setColumns(columns.map(col => 
      col.name === name ? { ...col, selected } : col
    ));
  };
  
  // Calculate preprocessing summary
  const totalColumns = columns.length;
  const selectedColumns = columns.filter(c => c.selected).length;
  const missingData = columns.reduce((sum, col) => sum + col.missing, 0) / columns.length;
  
  // Toggle preprocessing options
  const togglePreprocessing = (key: keyof typeof preprocessing) => {
    setPreprocessing({ ...preprocessing, [key]: !preprocessing[key] });
  };
  
  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Data Preprocessing
        </CardTitle>
        <CardDescription>Clean, transform, and prepare your data for optimal model performance</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="cleaning">
          <TabsList className="mb-4">
            <TabsTrigger value="cleaning" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Cleaning
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              Features
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Summary
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cleaning">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="normalize"
                      checked={preprocessing.normalize}
                      onCheckedChange={() => togglePreprocessing("normalize")}
                    />
                    <Label htmlFor="normalize">Normalize data</Label>
                  </div>
                  
                  {preprocessing.normalize && (
                    <Select
                      value={normalizationMethod}
                      onValueChange={setNormalizationMethod}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">StandardScaler</SelectItem>
                        <SelectItem value="minmax">MinMaxScaler</SelectItem>
                        <SelectItem value="robust">RobustScaler</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="impute"
                      checked={preprocessing.impute}
                      onCheckedChange={() => togglePreprocessing("impute")}
                    />
                    <Label htmlFor="impute">Handle missing values</Label>
                  </div>
                  
                  {preprocessing.impute && (
                    <Select
                      value={imputationMethod}
                      onValueChange={setImputationMethod}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mean">Mean/Mode</SelectItem>
                        <SelectItem value="median">Median/Mode</SelectItem>
                        <SelectItem value="knn">KNN Imputer</SelectItem>
                        <SelectItem value="remove">Remove Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="encode"
                      checked={preprocessing.encode}
                      onCheckedChange={() => togglePreprocessing("encode")}
                    />
                    <Label htmlFor="encode">Encode categorical data</Label>
                  </div>
                  
                  {preprocessing.encode && (
                    <Select
                      value={encodingMethod}
                      onValueChange={setEncodingMethod}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                        <SelectItem value="label">Label Encoding</SelectItem>
                        <SelectItem value="target">Target Encoding</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="outliers"
                      checked={preprocessing.outliers}
                      onCheckedChange={() => togglePreprocessing("outliers")}
                    />
                    <Label htmlFor="outliers">Handle outliers</Label>
                  </div>
                  
                  {preprocessing.outliers && (
                    <Select
                      value={outlierMethod}
                      onValueChange={setOutlierMethod}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="iqr">IQR Method</SelectItem>
                        <SelectItem value="zscore">Z-Score Method</SelectItem>
                        <SelectItem value="isolation">Isolation Forest</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === "light" ? "bg-secondary/80" : "bg-secondary/30"
              }`}>
                <h3 className="font-medium mb-2">Current Data Health</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Missing Values</span>
                      <span>{missingData.toFixed(1)}%</span>
                    </div>
                    <Progress value={missingData} className="h-2" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {columns.filter(col => col.missing > 0).map(col => (
                      <Badge 
                        key={col.name} 
                        variant={col.missing > 10 ? "destructive" : "secondary"}
                        className="flex gap-1 items-center"
                      >
                        {col.name}
                        <span className="text-xs opacity-80">{col.missing}%</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="features">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="feature-selection"
                      checked={preprocessing.featureSelection}
                      onCheckedChange={() => togglePreprocessing("featureSelection")}
                    />
                    <Label htmlFor="feature-selection">Feature selection</Label>
                  </div>
                  
                  {preprocessing.featureSelection && (
                    <Select
                      value={selectionMethod}
                      onValueChange={setSelectionMethod}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="importance">Importance Based</SelectItem>
                        <SelectItem value="correlation">Correlation Based</SelectItem>
                        <SelectItem value="recursive">Recursive Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                
                {preprocessing.featureSelection && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Selection Threshold</Label>
                      <span>Top {selectionThreshold}%</span>
                    </div>
                    <Slider
                      value={[selectionThreshold]}
                      min={10}
                      max={100}
                      step={5}
                      onValueChange={(value) => setSelectionThreshold(value[0])}
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="feature-engineering"
                    checked={preprocessing.featureEngineering}
                    onCheckedChange={() => togglePreprocessing("featureEngineering")}
                  />
                  <Label htmlFor="feature-engineering">Feature engineering (auto-generate new features)</Label>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted py-2 px-4 text-sm font-medium">Select features to include</div>
                <div className="divide-y">
                  {columns.map(column => (
                    <div key={column.name} className="flex items-center justify-between py-3 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{column.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {column.type}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {column.unique} unique values,{" "}
                          {column.missing > 0 ? `${column.missing}% missing` : "complete"}
                        </div>
                      </div>
                      <Switch
                        id={`col-${column.name}`}
                        checked={column.selected}
                        onCheckedChange={(checked) => handleColumnSelection(column.name, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Selected Features</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-3xl font-bold">
                      {selectedColumns} / {totalColumns}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {((selectedColumns / totalColumns) * 100).toFixed(0)}% of columns used
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Cleaning Steps</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-3xl font-bold">
                      {Object.values(preprocessing).filter(Boolean).length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Data processing techniques applied
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg">Data Health</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    {missingData < 5 ? (
                      <div className="text-3xl font-bold text-green-500">Good</div>
                    ) : missingData < 15 ? (
                      <div className="text-3xl font-bold text-amber-500">Fair</div>
                    ) : (
                      <div className="text-3xl font-bold text-red-500">Poor</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {missingData.toFixed(1)}% missing values overall
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className={`p-4 rounded-lg ${
                theme === "light" ? "bg-secondary/80" : "bg-secondary/30"
              }`}>
                <h3 className="font-medium mb-2">Preprocessing Pipeline</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">1</Badge>
                    <span>Feature Selection: {selectedColumns} columns selected</span>
                  </div>
                  
                  {preprocessing.impute && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">2</Badge>
                      <span>
                        Missing Value Imputation: {imputationMethod === "mean" ? "Mean/Mode" : 
                          imputationMethod === "median" ? "Median/Mode" : 
                          imputationMethod === "knn" ? "K-Nearest Neighbors" : "Remove Rows"}
                      </span>
                    </div>
                  )}
                  
                  {preprocessing.outliers && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                        {preprocessing.impute ? 3 : 2}
                      </Badge>
                      <span>
                        Outlier Handling: {outlierMethod === "iqr" ? "IQR Method" : 
                          outlierMethod === "zscore" ? "Z-Score Method" : "Isolation Forest"}
                      </span>
                    </div>
                  )}
                  
                  {preprocessing.encode && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                        {(preprocessing.impute ? 1 : 0) + (preprocessing.outliers ? 1 : 0) + 2}
                      </Badge>
                      <span>
                        Categorical Encoding: {encodingMethod === "onehot" ? "One-Hot Encoding" : 
                          encodingMethod === "label" ? "Label Encoding" : "Target Encoding"}
                      </span>
                    </div>
                  )}
                  
                  {preprocessing.normalize && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                        {(preprocessing.impute ? 1 : 0) + (preprocessing.outliers ? 1 : 0) + 
                        (preprocessing.encode ? 1 : 0) + 2}
                      </Badge>
                      <span>
                        Normalization: {normalizationMethod === "standard" ? "StandardScaler" : 
                          normalizationMethod === "minmax" ? "MinMaxScaler" : "RobustScaler"}
                      </span>
                    </div>
                  )}
                  
                  {preprocessing.featureEngineering && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0">
                        {(preprocessing.impute ? 1 : 0) + (preprocessing.outliers ? 1 : 0) + 
                        (preprocessing.encode ? 1 : 0) + (preprocessing.normalize ? 1 : 0) + 2}
                      </Badge>
                      <span>Feature Engineering: Automated generation of new features</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-end border-t pt-4">
        <Button>
          Apply Preprocessing
        </Button>
      </CardFooter>
    </Card>
  );
}
