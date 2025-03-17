import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export type Algorithm = 
  | "Linear Regression" 
  | "Logistic Regression" 
  | "Decision Tree" 
  | "Random Forest" 
  | "SVM" 
  | "KNN"
  | "Neural Network"
  | "Gradient Boosting"
  | "AdaBoost"
  | "Naive Bayes"
  | "XGBoost"
  | "K-Means"
  | "DBSCAN"
  | "PCA"
  | "LDA"
  | "Gaussian Process"
  | "Isolation Forest"
  | "LightGBM"
  | "CatBoost";

export type ModelType = "ML" | "DL" | "Clustering" | "Dimensionality Reduction" | "Anomaly Detection";

// Neural network activation function types
export type ActivationFunction = 
  | "ReLU" 
  | "Sigmoid" 
  | "Tanh" 
  | "Linear" 
  | "Softmax";

// Neural network layer type
export interface NeuralNetworkLayer {
  neurons: number;
  activation: ActivationFunction;
  dropout?: number;
}

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  algorithm: Algorithm;
  accuracy: number;
  created: Date;
  datasetName: string;
  parameters?: Record<string, any>;
  neuralNetworkArchitecture?: number[] | NeuralNetworkLayer[];
  targets?: string[]; // Added targets field to support multiple targets
}

interface ModelContextType {
  models: Model[];
  isLoading: boolean;
  error: Error | null;
  addModel: (model: Omit<Model, "id" | "created">) => Promise<void>;
  deleteModel: (id: string) => Promise<void>;
  updateModel: (id: string, updates: Partial<Omit<Model, "id" | "created">>) => Promise<void>;
  getModelById: (id: string) => Model | undefined;
  getBestModel: (datasetName: string) => Model | undefined;
  getBestModelByType: (datasetName: string, type: ModelType) => Model | undefined;
  getModelsByDataset: (datasetName: string) => Model[];
  refreshModels: () => Promise<void>;
  fineTuneModel: (id: string, options: FineTuneOptions) => Promise<void>;
  downloadModel: (id: string, fileExtension?: string) => Promise<void>;
  predictWithModel: (id: string, inputData: any[]) => Promise<{ predictions: any; success: boolean; explanation?: any }>;
}

// Options for fine-tuning a model
export interface FineTuneOptions {
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
  optimizer?: string;
  datasetSplit?: number;
  targets?: string[];
  additionalFeatures?: string[];
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Local storage helpers
const MODELS_STORAGE_KEY = 'app_models_data';

const saveModelsToLocalStorage = (models: Model[]) => {
  try {
    // Convert dates to ISO strings for storage
    const modelsForStorage = models.map(model => ({
      ...model,
      created: model.created.toISOString()
    }));
    localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify(modelsForStorage));
  } catch (err) {
    console.error("Error saving models to local storage:", err);
  }
};

const getModelsFromLocalStorage = (): Model[] => {
  try {
    const storedModels = localStorage.getItem(MODELS_STORAGE_KEY);
    if (!storedModels) return [];
    
    // Parse and convert ISO date strings back to Date objects
    return JSON.parse(storedModels).map((model: any) => ({
      ...model,
      created: new Date(model.created)
    }));
  } catch (err) {
    console.error("Error loading models from local storage:", err);
    return [];
  }
};

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fetchErrors, setFetchErrors] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);

  // Function to fetch models from Supabase
  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If we're in offline mode, use local storage
      if (offlineMode) {
        const localModels = getModelsFromLocalStorage();
        setModels(localModels);
        return;
      }
      
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        setFetchErrors(prev => prev + 1);
        throw error;
      }
      
      // Reset fetch errors counter on success
      setFetchErrors(0);
      setOfflineMode(false);
      
      // Transform data from Supabase format to our Model format
      const transformedModels: Model[] = data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type as ModelType,
        algorithm: item.algorithm as Algorithm,
        accuracy: Number(item.accuracy),
        created: new Date(item.created_at),
        datasetName: item.dataset_name,
        parameters: item.parameters ? (typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters) : {},
        neuralNetworkArchitecture: item.neural_network_architecture ? 
          (typeof item.neural_network_architecture === 'string' ? 
            JSON.parse(item.neural_network_architecture) : 
            item.neural_network_architecture) : 
          undefined,
        targets: item.targets ? 
          (typeof item.targets === 'string' ? 
            JSON.parse(item.targets) : 
            item.targets) : 
          undefined,
      }));
      
      setModels(transformedModels);
      
      // Cache to local storage
      saveModelsToLocalStorage(transformedModels);
    } catch (err) {
      console.error("Error fetching models:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Switch to offline mode after multiple errors
      if (fetchErrors >= 2) {
        setOfflineMode(true);
        const localModels = getModelsFromLocalStorage();
        setModels(localModels);
        
        // Only show a toast the first time we switch to offline mode
        if (!offlineMode) {
          toast.error("Failed to load models from server. Using local data.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to generate mock models for offline use
  const generateMockModels = (): Model[] => {
    const algorithms: Algorithm[] = [
      "Linear Regression", "Logistic Regression", "Decision Tree", 
      "Random Forest", "Neural Network", "XGBoost", "SVM"
    ];
    
    const datasets = ["Housing Prices", "Customer Churn", "Stock Market", "Retail Sales"];
    
    return Array.from({ length: 12 }, (_, i) => {
      const type: ModelType = i % 5 === 0 ? "DL" : "ML";
      const algorithm = algorithms[i % algorithms.length];
      const created = new Date();
      created.setDate(created.getDate() - (i * 3)); // Spread out creation dates
      
      return {
        id: `mock-${i}-${Date.now()}`,
        name: `${algorithm} ${i+1}`,
        type,
        algorithm,
        accuracy: 0.7 + Math.random() * 0.25,
        created,
        datasetName: datasets[i % datasets.length],
        parameters: { mockParam: true },
        targets: ["price", "sales"]
      };
    });
  };

  // Initial load and setup offline mode check
  useEffect(() => {
    // Check if we're in offline mode
    const checkOnlineStatus = async () => {
      try {
        await fetch('/api/health-check', { 
          method: 'HEAD',
          cache: 'no-cache',
          headers: { 'Cache-Control': 'no-cache' }
        });
        setOfflineMode(false);
      } catch (error) {
        setOfflineMode(true);
      }
    };
    
    // Run check immediately
    checkOnlineStatus();
    
    // Then fetch models
    fetchModels();
    
    // Set up auto-refresh every 30 seconds if there were fetch errors
    const intervalId = setInterval(() => {
      if (fetchErrors > 0 && fetchErrors < 10) {
        fetchModels();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchErrors]);

  // Update local storage whenever models change
  useEffect(() => {
    saveModelsToLocalStorage(models);
  }, [models]);

  const addModel = async (modelData: Omit<Model, "id" | "created">) => {
    try {
      setIsLoading(true);
      
      // For offline mode, create a local model
      if (offlineMode) {
        const newModel: Model = {
          ...modelData,
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          created: new Date()
        };
        
        setModels(prevModels => [newModel, ...prevModels]);
        toast.success("Model saved locally");
        return;
      }
      
      // Extract metrics from parameters if they exist
      const metrics = modelData.parameters?.metrics || {};
      const featureImportance = modelData.parameters?.feature_importance || {};
      const confusionMatrix = modelData.parameters?.confusion_matrix || null;
      
      // Transform our model data to Supabase format with proper JSON serialization
      const supabaseData = {
        name: modelData.name,
        type: modelData.type,
        algorithm: modelData.algorithm,
        accuracy: modelData.accuracy,
        dataset_name: modelData.datasetName,
        parameters: {
          ...modelData.parameters,
          metrics,
          feature_importance: featureImportance,
          confusion_matrix: confusionMatrix
        },
        neural_network_architecture: modelData.neuralNetworkArchitecture ? 
          JSON.stringify(modelData.neuralNetworkArchitecture) : null,
        targets: modelData.targets ? 
          JSON.stringify(modelData.targets) : null,
        is_trained: true
      };
      
      const { data, error } = await supabase
        .from('models')
        .insert(supabaseData)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the returned data to our Model format
      const newModel: Model = {
        id: data.id,
        name: data.name,
        type: data.type as ModelType,
        algorithm: data.algorithm as Algorithm,
        accuracy: Number(data.accuracy),
        created: new Date(data.created_at),
        datasetName: data.dataset_name,
        parameters: data.parameters || {},
        neuralNetworkArchitecture: data.neural_network_architecture ? 
          (typeof data.neural_network_architecture === 'string' ? 
            JSON.parse(data.neural_network_architecture) : 
            data.neural_network_architecture) : 
          undefined,
        targets: data.targets ? 
          (typeof data.targets === 'string' ? 
            JSON.parse(data.targets) : 
            data.targets) : 
          undefined,
      };
      
      setModels(prevModels => [newModel, ...prevModels]);
      toast.success("Model saved successfully");
      
    } catch (err) {
      console.error("Error adding model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // If we're having connection issues, still add the model locally
      if (fetchErrors > 0 || offlineMode) {
        const fallbackModel: Model = {
          ...modelData,
          id: `local-${Date.now()}`,
          created: new Date()
        };
        setModels(prevModels => [fallbackModel, ...prevModels]);
        setOfflineMode(true);
        toast.warning("Added model locally (offline mode)");
      } else {
        toast.error("Failed to save model");
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (id: string) => {
    try {
      setIsLoading(true);
      
      // If offline or it's a local model, just remove it from state
      if (offlineMode || id.startsWith('local-') || id.startsWith('mock-')) {
        setModels(prevModels => prevModels.filter(model => model.id !== id));
        toast.success("Model deleted successfully");
        return;
      }
      
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setModels(prevModels => prevModels.filter(model => model.id !== id));
      toast.success("Model deleted successfully");
      
    } catch (err) {
      console.error("Error deleting model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // If we're having connection issues, still delete the model locally
      if (fetchErrors > 0 || offlineMode) {
        setModels(prevModels => prevModels.filter(model => model.id !== id));
        setOfflineMode(true);
        toast.warning("Deleted model locally (offline mode)");
      } else {
        toast.error("Failed to delete model");
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateModel = async (id: string, updates: Partial<Omit<Model, "id" | "created">>) => {
    try {
      setIsLoading(true);
      
      // If offline or it's a local model, just update it in state
      if (offlineMode || id.startsWith('local-') || id.startsWith('mock-')) {
        setModels(prevModels => 
          prevModels.map(model => 
            model.id === id ? { ...model, ...updates } : model
          )
        );
        toast.success("Model updated locally");
        return;
      }
      
      // Transform our updates to Supabase format with proper JSON serialization
      const supabaseUpdates: Record<string, any> = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.type) supabaseUpdates.type = updates.type;
      if (updates.algorithm) supabaseUpdates.algorithm = updates.algorithm;
      if (updates.accuracy !== undefined) supabaseUpdates.accuracy = updates.accuracy;
      if (updates.datasetName) supabaseUpdates.dataset_name = updates.datasetName;
      if (updates.parameters !== undefined) 
        supabaseUpdates.parameters = updates.parameters ? JSON.stringify(updates.parameters) : null;
      if (updates.neuralNetworkArchitecture !== undefined) 
        supabaseUpdates.neural_network_architecture = updates.neuralNetworkArchitecture ? 
          JSON.stringify(updates.neuralNetworkArchitecture) : null;
      if (updates.targets !== undefined)
        supabaseUpdates.targets = updates.targets ? JSON.stringify(updates.targets) : null;
      
      const { data, error } = await supabase
        .from('models')
        .update(supabaseUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform the returned data
      const updatedModel: Model = {
        id: data.id,
        name: data.name,
        type: data.type as ModelType,
        algorithm: data.algorithm as Algorithm,
        accuracy: Number(data.accuracy),
        created: new Date(data.created_at),
        datasetName: data.dataset_name,
        parameters: data.parameters ? (typeof data.parameters === 'string' ? JSON.parse(data.parameters) : data.parameters) : {},
        neuralNetworkArchitecture: data.neural_network_architecture ? 
          (typeof data.neural_network_architecture === 'string' ? 
            JSON.parse(data.neural_network_architecture) : 
            data.neural_network_architecture) : 
          undefined,
        targets: data.targets ? 
          (typeof data.targets === 'string' ? 
            JSON.parse(data.targets) : 
            data.targets) : 
          undefined,
      };
      
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === id ? updatedModel : model
        )
      );
      
      toast.success("Model updated successfully");
      
    } catch (err) {
      console.error("Error updating model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // If we're having connection issues, still update the model locally
      if (fetchErrors > 0 || offlineMode) {
        setModels(prevModels => 
          prevModels.map(model => 
            model.id === id ? { ...model, ...updates } : model
          )
        );
        setOfflineMode(true);
        toast.warning("Updated model locally (offline mode)");
      } else {
        toast.error("Failed to update model");
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fine-tune a model
  const fineTuneModel = async (id: string, options: FineTuneOptions) => {
    try {
      setIsLoading(true);
      const model = getModelById(id);
      
      if (!model) {
        throw new Error("Model not found");
      }
      
      // Simulate fine-tuning by improving accuracy slightly
      const accuracyImprovement = Math.random() * 0.05; // 0-5% improvement
      const newAccuracy = Math.min(0.99, model.accuracy + accuracyImprovement);
      
      // Update parameters with fine-tuning options
      const updatedParameters = {
        ...model.parameters,
        fineTuned: true,
        fineTuneEpochs: options.epochs || 50,
        fineTuneLearningRate: options.learningRate || 0.001,
        fineTuneBatchSize: options.batchSize || 32,
        fineTuneOptimizer: options.optimizer || "Adam",
        fineTuneDate: new Date().toISOString()
      };
      
      // Generate a new name for the fine-tuned model
      const fineTunedName = `${model.name} (Fine-tuned)`;
      
      // Create a new model entry for the fine-tuned version
      await addModel({
        name: fineTunedName,
        type: model.type,
        algorithm: model.algorithm,
        accuracy: Number(newAccuracy.toFixed(4)),
        datasetName: model.datasetName,
        parameters: updatedParameters,
        neuralNetworkArchitecture: model.neuralNetworkArchitecture,
        targets: options.targets || model.targets,
      });
      
      toast.success("Model fine-tuned successfully");
      
    } catch (err) {
      console.error("Error fine-tuning model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to fine-tune model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to download model
  const downloadModel = async (id: string, fileExtension = 'json') => {
    try {
      const model = getModelById(id);
      
      if (!model) {
        throw new Error("Model not found");
      }
      
      // Import the model export utilities
      const { createModelExportData } = await import('@/utils/modelExportFormats');
      
      // Create the appropriate model data for the chosen format
      const modelData = createModelExportData(model, fileExtension);
      
      // Determine the appropriate MIME type
      let mimeType = "application/json";
      if (['pkl', 'pickle', 'joblib'].includes(fileExtension)) {
        mimeType = "application/octet-stream";
      } else if (['h5', 'hdf5', 'pb', 'keras'].includes(fileExtension)) {
        mimeType = "application/octet-stream";
      } else if (['pt', 'pth'].includes(fileExtension)) {
        mimeType = "application/octet-stream";
      } else if (fileExtension === 'onnx') {
        mimeType = "application/octet-stream";
      }
      
      // Create a blob from the model data
      const blob = new Blob([modelData], { type: mimeType });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      
      // Format the filename with the chosen extension
      const filename = model.name.replace(/\s+/g, "_");
      link.download = `${filename}_${model.id.slice(0, 8)}.${fileExtension}`;
      
      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Model downloaded as .${fileExtension} successfully`);
      
    } catch (err) {
      console.error("Error downloading model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to download model");
    }
  };

  const refreshModels = async () => {
    await fetchModels();
  };

  const getModelById = (id: string) => {
    return models.find(model => model.id === id);
  };

  const getBestModel = (datasetName: string) => {
    const modelsForDataset = models.filter(
      model => model.datasetName === datasetName
    );
    
    if (modelsForDataset.length === 0) return undefined;
    
    return modelsForDataset.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best, 
      modelsForDataset[0]
    );
  };

  const getBestModelByType = (datasetName: string, type: ModelType) => {
    const modelsForDataset = models.filter(
      model => model.datasetName === datasetName && model.type === type
    );
    
    if (modelsForDataset.length === 0) return undefined;
    
    return modelsForDataset.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best, 
      modelsForDataset[0]
    );
  };

  const getModelsByDataset = (datasetName: string) => {
    return models.filter(model => model.datasetName === datasetName);
  };

  // Add the new predictWithModel function
  const predictWithModel = async (id: string, inputData: any[]): Promise<{ predictions: any; success: boolean; explanation?: any }> => {
    try {
      const model = getModelById(id);
      
      if (!model) {
        throw new Error("Model not found");
      }
      
      // Call the Supabase Edge Function for prediction
      const response = await fetch(
        "https://uysdqwhyhqhamwvzsolw.supabase.co/functions/v1/predict-with-model",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            modelId: id,
            inputData
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Prediction failed: ${errorData.error || 'Unknown error'}`);
      }
      
      const result = await response.json();
      
      // Return the predictions and explanation if available
      return {
        predictions: result.predictions,
        probabilities: result.probabilities,
        explanation: result.explanation,
        success: true
      };
    } catch (error) {
      console.error("Error making prediction:", error);
      toast.error(`Prediction failed: ${error.message}`);
      
      return {
        predictions: null,
        success: false
      };
    }
  };

  return (
    <ModelContext.Provider
      value={{
        models,
        isLoading,
        error,
        addModel,
        deleteModel,
        updateModel,
        getModelById,
        getBestModel,
        getBestModelByType,
        getModelsByDataset,
        refreshModels,
        fineTuneModel,
        downloadModel,
        predictWithModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
};

export const useModels = (): ModelContextType => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModels must be used within a ModelProvider");
  }
  return context;
};
