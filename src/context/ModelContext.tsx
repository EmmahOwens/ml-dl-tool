
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        neural_network_architecture: modelData.neuralNetworkArchitecture || null,
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
      };
      
      setModels(prevModels => 
        prevModels.map(model => 
          model.id === id ? updatedModel : model
        )
      );
      
    } catch (err) {
      console.error("Error updating model:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to update model");
      throw err;
    } finally {
      setIsLoading(false);
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
