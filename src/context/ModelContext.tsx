
import React, { createContext, useContext, useState, useEffect } from "react";

export type Algorithm = 
  | "Linear Regression" 
  | "Logistic Regression" 
  | "Decision Tree" 
  | "Random Forest" 
  | "SVM" 
  | "KNN"
  | "Neural Network";

export type ModelType = "ML" | "DL";

export interface Model {
  id: string;
  name: string;
  type: ModelType;
  algorithm: Algorithm;
  accuracy: number;
  created: Date;
  datasetName: string;
  parameters?: Record<string, any>;
  neuralNetworkArchitecture?: number[];
}

interface ModelContextType {
  models: Model[];
  addModel: (model: Omit<Model, "id" | "created">) => void;
  deleteModel: (id: string) => void;
  getModelById: (id: string) => Model | undefined;
  getBestModel: (datasetName: string) => Model | undefined;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [models, setModels] = useState<Model[]>(() => {
    // Load models from localStorage if available
    if (typeof window !== "undefined") {
      const storedModels = window.localStorage.getItem("ml-dl-models");
      return storedModels ? JSON.parse(storedModels) : [];
    }
    return [];
  });

  // Save models to localStorage when they change
  useEffect(() => {
    window.localStorage.setItem("ml-dl-models", JSON.stringify(models));
  }, [models]);

  const addModel = (modelData: Omit<Model, "id" | "created">) => {
    const newModel: Model = {
      ...modelData,
      id: crypto.randomUUID(),
      created: new Date(),
    };
    setModels((prevModels) => [...prevModels, newModel]);
  };

  const deleteModel = (id: string) => {
    setModels((prevModels) => prevModels.filter((model) => model.id !== id));
  };

  const getModelById = (id: string) => {
    return models.find((model) => model.id === id);
  };

  const getBestModel = (datasetName: string) => {
    const modelsForDataset = models.filter(
      (model) => model.datasetName === datasetName
    );
    
    if (modelsForDataset.length === 0) return undefined;
    
    return modelsForDataset.reduce((best, current) => 
      current.accuracy > best.accuracy ? current : best, 
      modelsForDataset[0]
    );
  };

  return (
    <ModelContext.Provider
      value={{
        models,
        addModel,
        deleteModel,
        getModelById,
        getBestModel,
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
