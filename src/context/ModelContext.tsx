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
  downloadModel: (id: string) => Promise<void>;
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

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch models from Supabase
  const fetchModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
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
    } catch (err) {
      console.error("Error fetching models:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to load models");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchModels();
  }, []);

  const addModel = async (modelData: Omit<Model, "id" | "created">) => {
    try {
      setIsLoading(true);
      
      // Transform our model data to Supabase format
      const supabaseData = {
        name: modelData.name,
        type: modelData.type,
        algorithm: modelData.algorithm,
        accuracy: modelData.accuracy,
        dataset_name: modelData.datasetName,
        parameters: modelData.parameters || {},
        neural_network_architecture: modelData.neuralNetworkArchitecture ? 
          JSON.parse(JSON.stringify(modelData.neuralNetworkArchitecture)) : null,
        targets: modelData.targets ? 
          JSON.parse(JSON.stringify(modelData.targets)) : null,
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
      
      setModels(prevModels => [newModel, ...prevModels]);
      
    } catch (err) {
      console.error("Error adding model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to save model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteModel = async (id: string) => {
    try {
      setIsLoading(true);
      
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
      toast.error("Failed to delete model");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateModel = async (id: string, updates: Partial<Omit<Model, "id" | "created">>) => {
    try {
      setIsLoading(true);
      
      // Transform our updates to Supabase format
      const supabaseUpdates: Record<string, any> = {};
      
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.type) supabaseUpdates.type = updates.type;
      if (updates.algorithm) supabaseUpdates.algorithm = updates.algorithm;
      if (updates.accuracy !== undefined) supabaseUpdates.accuracy = updates.accuracy;
      if (updates.datasetName) supabaseUpdates.dataset_name = updates.datasetName;
      if (updates.parameters) supabaseUpdates.parameters = updates.parameters;
      if (updates.neuralNetworkArchitecture !== undefined) 
        supabaseUpdates.neural_network_architecture = updates.neuralNetworkArchitecture;
      if (updates.targets !== undefined)
        supabaseUpdates.targets = updates.targets;
      
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
      toast.error("Failed to update model");
      throw err;
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
  const downloadModel = async (id: string) => {
    try {
      const model = getModelById(id);
      
      if (!model) {
        throw new Error("Model not found");
      }
      
      // Create a JSON representation of the model
      const modelData = JSON.stringify(model, null, 2);
      
      // Create a blob from the JSON data
      const blob = new Blob([modelData], { type: "application/json" });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `${model.name.replace(/\s+/g, "_")}_${model.id.slice(0, 8)}.json`;
      
      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Model downloaded successfully");
      
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
