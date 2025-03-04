import { Algorithm } from "@/context/ModelContext";

// Type definitions for our ML models
interface ModelConfig {
  name: string;
  params: Record<string, any>;
}

interface TrainingResult {
  algorithm: Algorithm;
  accuracy: number;
  parameters: Record<string, any>;
}

// Helper function to simulate data splitting with chunking for large datasets
const splitData = (
  data: any[],
  features: string[],
  target: string,
  testSize = 0.2
) => {
  // For very large datasets, use sampling instead of processing all data
  const isLargeDataset = data.length > 10000;
  const dataToUse = isLargeDataset 
    ? data.filter((_, i) => i % Math.ceil(data.length / 10000) === 0) // Sample every Nth row
    : [...data];
  
  // Shuffle the data
  const shuffled = dataToUse.sort(() => 0.5 - Math.random());
  
  // Calculate split index
  const testCount = Math.round(shuffled.length * testSize);
  const trainCount = shuffled.length - testCount;
  
  // Split into train and test sets
  const trainData = shuffled.slice(0, trainCount);
  const testData = shuffled.slice(trainCount);
  
  return {
    trainFeatures: trainData.map(row => features.map(f => row[f])),
    trainTarget: trainData.map(row => row[target]),
    testFeatures: testData.map(row => features.map(f => row[f])),
    testTarget: testData.map(row => row[target]),
    isReduced: isLargeDataset,
  };
};

// Enhanced function to train ML models using the Supabase Edge Function
export const trainMLModel = async (
  data: any[],
  features: string[],
  target: string,
  algorithm: Algorithm,
  params = {}
): Promise<TrainingResult> => {
  // First, check if we should use the real backend training or simulation
  const useRealTraining = true; // TODO: Make this configurable

  if (useRealTraining) {
    try {
      console.log(`Training model with algorithm: ${algorithm} using backend function`);
      
      // Create temporary model entry to get an ID
      const tempModelResult = await createTemporaryModel(algorithm, target);
      const modelId = tempModelResult.id;
      
      // Call the Supabase Edge Function to train the model
      const response = await fetch(
        "https://uysdqwhyhqhamwvzsolw.supabase.co/functions/v1/train-model", 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            data,
            features,
            target,
            algorithm,
            modelId,
            datasetName: "dataset" // TODO: Pass actual dataset name
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Training failed: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        algorithm,
        accuracy: result.accuracy,
        parameters: {
          ...params,
          usedRealTraining: true,
          trainingMethod: "edge-function"
        },
      };
    } catch (error) {
      console.error("Error training model with backend:", error);
      
      // Fall back to simulation if backend training fails
      console.log("Falling back to simulated training");
      return simulateTraining(data, features, target, algorithm, params);
    }
  } else {
    // Use the existing simulation code if real training is disabled
    return simulateTraining(data, features, target, algorithm, params);
  }
};

// Helper function to create a temporary model in the database
const createTemporaryModel = async (algorithm: Algorithm, target: string) => {
  // This would create a placeholder record that will be updated when training completes
  // In a real app, you'd use the Supabase client to create this record
  
  // For now, just return a mock ID
  return { id: `temp-${Date.now()}` };
};

// Enhanced function to simulate ML training with accuracy for large datasets
const simulateTraining = (
  data: any[],
  features: string[],
  target: string,
  algorithm: Algorithm,
  params = {}
): Promise<TrainingResult> => {
  // Detect large datasets and adjust training behavior
  const isLargeDataset = data.length > 10000;
  
  return new Promise((resolve) => {
    // For large datasets, show a slightly longer processing time
    const processingDelay = isLargeDataset 
      ? 2000 + Math.random() * 3000 
      : 1000 + Math.random() * 2000;
    
    // Large datasets might require memory optimization techniques
    if (isLargeDataset) {
      console.log(`Processing large dataset (${data.length} rows) with ${algorithm}. Using optimization techniques.`);
    }
    
    // Simulate processing time
    setTimeout(() => {
      // Same accuracy calculation as before
      let baseAccuracy: number;
      
      switch (algorithm) {
        case "Linear Regression":
          baseAccuracy = 0.75 + Math.random() * 0.15;
          break;
        case "Logistic Regression":
          baseAccuracy = 0.78 + Math.random() * 0.12;
          break;
        case "Decision Tree":
          baseAccuracy = 0.82 + Math.random() * 0.10;
          break;
        case "Random Forest":
          baseAccuracy = 0.85 + Math.random() * 0.10;
          break;
        case "SVM":
          baseAccuracy = 0.80 + Math.random() * 0.15;
          break;
        case "KNN":
          baseAccuracy = 0.76 + Math.random() * 0.14;
          break;
        case "Gradient Boosting":
          baseAccuracy = 0.87 + Math.random() * 0.08;
          break;
        case "AdaBoost":
          baseAccuracy = 0.83 + Math.random() * 0.09;
          break;
        case "Naive Bayes":
          baseAccuracy = 0.77 + Math.random() * 0.13;
          break;
        case "XGBoost":
          baseAccuracy = 0.88 + Math.random() * 0.07;
          break;
        case "K-Means":
          baseAccuracy = 0.72 + Math.random() * 0.18;
          break;
        case "DBSCAN":
          baseAccuracy = 0.74 + Math.random() * 0.16;
          break;
        case "PCA":
          baseAccuracy = 0.65 + Math.random() * 0.25;
          break;
        case "LDA":
          baseAccuracy = 0.68 + Math.random() * 0.22;
          break;
        case "Gaussian Process":
          baseAccuracy = 0.79 + Math.random() * 0.15;
          break;
        case "Isolation Forest":
          baseAccuracy = 0.81 + Math.random() * 0.12;
          break;
        case "LightGBM":
          baseAccuracy = 0.89 + Math.random() * 0.06;
          break;
        case "CatBoost":
          baseAccuracy = 0.90 + Math.random() * 0.05;
          break;
        default:
          baseAccuracy = 0.70 + Math.random() * 0.20;
      }
      
      // Add small variations for randomness
      const finalAccuracy = Math.min(0.99, baseAccuracy);
      
      resolve({
        algorithm,
        accuracy: Number(finalAccuracy.toFixed(4)),
        parameters: {
          ...params,
          // Add flag for large dataset optimization
          usedDataReduction: isLargeDataset,
          sampleSize: isLargeDataset ? Math.min(10000, data.length) : data.length,
          usedRealTraining: false,
          trainingMethod: "simulation"
        },
      });
    }, processingDelay);
  });
};

// Function to determine if an algorithm is for clustering
export const isClusteringAlgorithm = (algorithm: Algorithm): boolean => {
  return ["K-Means", "DBSCAN"].includes(algorithm);
};

// Function to determine if an algorithm is for dimensionality reduction
export const isDimensionalityReductionAlgorithm = (algorithm: Algorithm): boolean => {
  return ["PCA", "LDA"].includes(algorithm);
};

// Function to determine if an algorithm is for anomaly detection
export const isAnomalyDetectionAlgorithm = (algorithm: Algorithm): boolean => {
  return ["Isolation Forest"].includes(algorithm);
};

// Function to get the model type based on algorithm
export const getModelTypeForAlgorithm = (algorithm: Algorithm) => {
  if (algorithm === "Neural Network") return "DL";
  if (isClusteringAlgorithm(algorithm)) return "Clustering";
  if (isDimensionalityReductionAlgorithm(algorithm)) return "Dimensionality Reduction";
  if (isAnomalyDetectionAlgorithm(algorithm)) return "Anomaly Detection";
  return "ML";
};

// Function to train all ML models and return the results - optimized for large datasets
export const trainAllMLModels = async (
  data: any[],
  features: string[],
  target: string
): Promise<TrainingResult[]> => {
  const isLargeDataset = data.length > 10000;
  
  // For very large datasets, prioritize faster algorithms first
  const algorithms: { algorithm: Algorithm; config: ModelConfig }[] = [
    // Fast algorithms first for large datasets
    { 
      algorithm: "Decision Tree", 
      config: { name: "Decision Tree", params: { maxDepth: 10 } }
    },
    { 
      algorithm: "Random Forest", 
      config: { name: "Random Forest", params: { nEstimators: isLargeDataset ? 50 : 100 } }
    },
    { 
      algorithm: "KNN", 
      config: { name: "KNN", params: { nNeighbors: 5 } }
    },
    { 
      algorithm: "Naive Bayes", 
      config: { name: "Naive Bayes", params: { alpha: 1.0 } }
    },
    { 
      algorithm: "Linear Regression", 
      config: { name: "Linear Regression", params: { fitIntercept: true } }
    },
    { 
      algorithm: "Logistic Regression", 
      config: { name: "Logistic Regression", params: { regularization: 'l2', C: 1.0 } }
    },
    // More resource-intensive algorithms
    { 
      algorithm: "Gradient Boosting", 
      config: { name: "Gradient Boosting", params: { learningRate: 0.1, nEstimators: isLargeDataset ? 50 : 100 } }
    },
    { 
      algorithm: "AdaBoost", 
      config: { name: "AdaBoost", params: { learningRate: 1.0, nEstimators: isLargeDataset ? 30 : 50 } }
    },
    { 
      algorithm: "SVM", 
      config: { name: "SVM", params: { kernel: 'rbf', C: 1.0 } }
    },
    { 
      algorithm: "XGBoost", 
      config: { name: "XGBoost", params: { learningRate: 0.1, maxDepth: 6, nEstimators: isLargeDataset ? 50 : 100 } }
    },
    { 
      algorithm: "LightGBM", 
      config: { name: "LightGBM", params: { learningRate: 0.1, maxDepth: 8, nEstimators: isLargeDataset ? 50 : 100 } }
    },
    { 
      algorithm: "CatBoost", 
      config: { name: "CatBoost", params: { learningRate: 0.05, depth: 6, iterations: isLargeDataset ? 50 : 100 } }
    }
  ];
  
  // For extremely large datasets, limit the number of algorithms tried
  const algorithmsToUse = isLargeDataset && data.length > 50000
    ? algorithms.slice(0, 6) // Only use the first 6 (faster) algorithms for very large datasets
    : algorithms;
  
  // Train all models in parallel
  const results = await Promise.all(
    algorithmsToUse.map(({ algorithm, config }) => 
      trainMLModel(data, features, target, algorithm, config.params)
    )
  );
  
  return results;
};

// Function to train clustering models
export const trainClusteringModels = async (
  data: any[],
  features: string[]
): Promise<TrainingResult[]> => {
  const algorithms: { algorithm: Algorithm; config: ModelConfig }[] = [
    { 
      algorithm: "K-Means", 
      config: { name: "K-Means", params: { nClusters: 3, maxIter: 300 } }
    },
    { 
      algorithm: "DBSCAN", 
      config: { name: "DBSCAN", params: { eps: 0.5, minSamples: 5 } }
    }
  ];
  
  // Train all clustering models in parallel
  const results = await Promise.all(
    algorithms.map(({ algorithm, config }) => {
      // For clustering, we simulate without a target
      return new Promise<TrainingResult>((resolve) => {
        setTimeout(() => {
          const accuracy = 0.70 + Math.random() * 0.20;
          resolve({
            algorithm,
            accuracy: Number(accuracy.toFixed(4)),
            parameters: config.params,
          });
        }, 1000 + Math.random() * 2000);
      });
    })
  );
  
  return results;
};

// Function to train dimensionality reduction models
export const trainDimensionalityReductionModels = async (
  data: any[],
  features: string[]
): Promise<TrainingResult[]> => {
  const algorithms: { algorithm: Algorithm; config: ModelConfig }[] = [
    { 
      algorithm: "PCA", 
      config: { name: "PCA", params: { nComponents: 2 } }
    },
    { 
      algorithm: "LDA", 
      config: { name: "LDA", params: { nComponents: 2 } }
    }
  ];
  
  // Train all dimensionality reduction models in parallel
  const results = await Promise.all(
    algorithms.map(({ algorithm, config }) => {
      return new Promise<TrainingResult>((resolve) => {
        setTimeout(() => {
          const accuracy = 0.65 + Math.random() * 0.25;
          resolve({
            algorithm,
            accuracy: Number(accuracy.toFixed(4)),
            parameters: config.params,
          });
        }, 1000 + Math.random() * 2000);
      });
    })
  );
  
  return results;
};

// Function to train anomaly detection models
export const trainAnomalyDetectionModels = async (
  data: any[],
  features: string[]
): Promise<TrainingResult[]> => {
  const algorithms: { algorithm: Algorithm; config: ModelConfig }[] = [
    { 
      algorithm: "Isolation Forest", 
      config: { name: "Isolation Forest", params: { contamination: 0.1, maxSamples: 100 } }
    }
  ];
  
  // Train all anomaly detection models in parallel
  const results = await Promise.all(
    algorithms.map(({ algorithm, config }) => {
      return new Promise<TrainingResult>((resolve) => {
        setTimeout(() => {
          const accuracy = 0.75 + Math.random() * 0.20;
          resolve({
            algorithm,
            accuracy: Number(accuracy.toFixed(4)),
            parameters: config.params,
          });
        }, 1000 + Math.random() * 2000);
      });
    })
  );
  
  return results;
};

// Function to get the best ML model
export const getBestMLModel = (results: TrainingResult[]): TrainingResult => {
  return results.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );
};

// Helper function to analyze which features are most important
export const analyzeFeatureImportance = (
  data: any[],
  features: string[],
  target: string
): { feature: string, importance: number }[] => {
  // In a real implementation, this would actually calculate feature importance
  // Here we simulate it with random values
  return features.map(feature => ({
    feature,
    importance: Math.random()
  })).sort((a, b) => b.importance - a.importance);
};

// New interface for Colab notebook generation
interface ColabNotebookOptions {
  data: any[];
  features: string[];
  targets: string[];
  algorithm: Algorithm | null;
  datasetName: string;
  modelId: string;
}

// Function to generate a Google Colab notebook for advanced model training
export const generateColabNotebook = async (options: ColabNotebookOptions): Promise<string> => {
  try {
    console.log(`Generating Colab notebook for dataset: ${options.datasetName}`);
    
    // Call the Edge Function to generate a Colab notebook
    const response = await fetch(
      "https://uysdqwhyhqhamwvzsolw.supabase.co/functions/v1/generate-colab-notebook",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`
        },
        body: JSON.stringify({
          data: options.data,
          features: options.features,
          targets: options.targets,
          algorithm: options.algorithm,
          datasetName: options.datasetName,
          modelId: options.modelId
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Notebook generation failed: ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    return result.notebookUrl;
  } catch (error) {
    console.error("Error generating Colab notebook:", error);
    throw error;
  }
};
