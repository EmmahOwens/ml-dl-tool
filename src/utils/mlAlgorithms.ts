
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
  ];
  
  // Train all models in parallel
  const results = await Promise.all(
    algorithms.map(({ algorithm, config }) => 
      trainMLModel(data, features, target, algorithm, config.params)
    )
  );
  
  return results;
};

// Function to get the best ML model
export const getBestMLModel = (results: TrainingResult[]): TrainingResult => {
  return results.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );
};
