
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

// Helper function to simulate data splitting
const splitData = (
  data: any[],
  features: string[],
  target: string,
  testSize = 0.2
) => {
  // Shuffle the data
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  
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
  };
};

// Function to simulate ML training with accuracy
export const trainMLModel = (
  data: any[],
  features: string[],
  target: string,
  algorithm: Algorithm,
  params = {}
): Promise<TrainingResult> => {
  // In a real implementation, this would use actual ML libraries
  // Here we simulate training with random accuracies for demonstration
  
  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Base accuracy is random but influenced by the algorithm
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
        parameters: params,
      });
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
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

// Function to train all ML models and return the results
export const trainAllMLModels = async (
  data: any[],
  features: string[],
  target: string
): Promise<TrainingResult[]> => {
  const algorithms: { algorithm: Algorithm; config: ModelConfig }[] = [
    { 
      algorithm: "Linear Regression", 
      config: { name: "Linear Regression", params: { fitIntercept: true } }
    },
    { 
      algorithm: "Logistic Regression", 
      config: { name: "Logistic Regression", params: { regularization: 'l2', C: 1.0 } }
    },
    { 
      algorithm: "Decision Tree", 
      config: { name: "Decision Tree", params: { maxDepth: 10 } }
    },
    { 
      algorithm: "Random Forest", 
      config: { name: "Random Forest", params: { nEstimators: 100 } }
    },
    { 
      algorithm: "SVM", 
      config: { name: "SVM", params: { kernel: 'rbf', C: 1.0 } }
    },
    { 
      algorithm: "KNN", 
      config: { name: "KNN", params: { nNeighbors: 5 } }
    },
    { 
      algorithm: "Gradient Boosting", 
      config: { name: "Gradient Boosting", params: { learningRate: 0.1, nEstimators: 100 } }
    },
    { 
      algorithm: "Naive Bayes", 
      config: { name: "Naive Bayes", params: { alpha: 1.0 } }
    },
    { 
      algorithm: "AdaBoost", 
      config: { name: "AdaBoost", params: { learningRate: 1.0, nEstimators: 50 } }
    },
    { 
      algorithm: "XGBoost", 
      config: { name: "XGBoost", params: { learningRate: 0.1, maxDepth: 6, nEstimators: 100 } }
    },
    { 
      algorithm: "LightGBM", 
      config: { name: "LightGBM", params: { learningRate: 0.1, maxDepth: 8, nEstimators: 100 } }
    },
    { 
      algorithm: "CatBoost", 
      config: { name: "CatBoost", params: { learningRate: 0.05, depth: 6, iterations: 100 } }
    }
  ];
  
  // Train all models in parallel
  const results = await Promise.all(
    algorithms.map(({ algorithm, config }) => 
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
