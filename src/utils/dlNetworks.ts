
import { Algorithm, ActivationFunction, NeuralNetworkLayer } from "@/context/ModelContext";

interface NeuralNetworkResult {
  algorithm: Algorithm;
  accuracy: number;
  parameters: Record<string, any>;
  neuralNetworkArchitecture: NeuralNetworkLayer[];
}

type ProblemType = "regression" | "classification" | "multiclass";

// Helper to determine activation functions based on problem type
const getOutputActivation = (problemType: ProblemType): ActivationFunction => {
  switch (problemType) {
    case "regression":
      return "Linear";
    case "classification":
      return "Sigmoid";
    case "multiclass":
      return "Softmax";
    default:
      return "Sigmoid";
  }
};

// Function to determine problem type from data
const detectProblemType = (target: any[]): ProblemType => {
  // Check if target values are all numbers in a continuous range
  const isNumeric = target.every(val => typeof val === 'number' || !isNaN(Number(val)));
  if (isNumeric) {
    const uniqueValues = new Set(target);
    // If there are only a few unique values, it's likely classification
    if (uniqueValues.size <= 5) {
      return uniqueValues.size === 2 ? "classification" : "multiclass";
    }
    return "regression";
  }
  // If values are strings/booleans, it's classification
  return "classification";
};

// Function to simulate training a neural network
export const trainNeuralNetwork = (
  data: any[],
  features: string[],
  target: string,
  architecture: NeuralNetworkLayer[] | number[] = [
    { neurons: 64, activation: "ReLU", dropout: 0.2 },
    { neurons: 32, activation: "ReLU", dropout: 0.1 }
  ],
  epochs = 100,
  learningRate = 0.001
): Promise<NeuralNetworkResult> => {
  // In a real implementation, this would use actual DL libraries
  // Here we simulate training with random accuracies

  // Convert simple number array to layer objects if needed
  const normalizedArchitecture: NeuralNetworkLayer[] = Array.isArray(architecture) && typeof architecture[0] === 'number'
    ? (architecture as number[]).map(neurons => ({ 
        neurons, 
        activation: "ReLU",
        dropout: Math.random() < 0.5 ? undefined : Math.random() * 0.5 
      }))
    : (architecture as NeuralNetworkLayer[]);

  const problemType = detectProblemType(data.map(d => d[target]));

  return new Promise((resolve) => {
    // Simulate processing time
    setTimeout(() => {
      // Base accuracy related to architecture complexity
      const complexityFactor = normalizedArchitecture.reduce((sum, layer) => sum + layer.neurons, 0) / 100;
      
      // More complex models do better on more complex problems
      const featureComplexity = Math.min(1, features.length / 20);
      const dataSize = Math.min(1, data.length / 1000);
      
      // Calculate base accuracy with multiple factors
      const baseAccuracy = 0.80 + 
        Math.min(0.15, complexityFactor * 0.1) + 
        Math.min(0.05, featureComplexity * 0.1) +
        Math.min(0.05, dataSize * 0.1) +
        Math.random() * 0.05;
      
      // Add a penalty for over-complex architectures on simple problems
      const overComplexityPenalty = 
        complexityFactor > 2 && features.length < 10 ? 
        Math.random() * 0.1 : 0;
      
      // Final accuracy calculation
      const finalAccuracy = Math.min(0.98, Math.max(0.6, baseAccuracy - overComplexityPenalty));
      
      resolve({
        algorithm: "Neural Network",
        accuracy: Number(finalAccuracy.toFixed(4)),
        parameters: { 
          epochs, 
          learningRate,
          problemType,
          optimizer: "Adam"
        },
        neuralNetworkArchitecture: [
          ...normalizedArchitecture,
          // Add output layer based on problem type
          { 
            neurons: problemType === "multiclass" ? 
              Math.max(3, new Set(data.map(d => d[target])).size) : 1, 
            activation: getOutputActivation(problemType),
            dropout: 0
          }
        ],
      });
    }, 2000 + Math.random() * 3000); // Random delay between 2-5 seconds
  });
};

// Function to optimize neural network architecture
export const optimizeNeuralNetwork = async (
  data: any[],
  features: string[],
  target: string
): Promise<NeuralNetworkResult> => {
  const problemType = detectProblemType(data.map(d => d[target]));
  const dataSize = data.length;
  const featureCount = features.length;

  // Generate dynamic architectures based on data characteristics
  const architectures: NeuralNetworkLayer[][] = [];

  // Simple architecture for small datasets
  if (dataSize < 100 || featureCount < 5) {
    architectures.push([
      { neurons: 16, activation: "ReLU", dropout: 0.1 }
    ]);
  }

  // Medium architectures
  architectures.push([
    { neurons: 64, activation: "ReLU", dropout: 0.2 },
    { neurons: 32, activation: "ReLU", dropout: 0.1 }
  ]);

  // Complex architectures for large datasets
  if (dataSize > 500 && featureCount > 10) {
    architectures.push([
      { neurons: 128, activation: "ReLU", dropout: 0.3 },
      { neurons: 64, activation: "ReLU", dropout: 0.2 },
      { neurons: 32, activation: "ReLU", dropout: 0.1 }
    ]);
  }

  // Very complex architecture for very large datasets
  if (dataSize > 1000 && featureCount > 20) {
    architectures.push([
      { neurons: 256, activation: "ReLU", dropout: 0.4 },
      { neurons: 128, activation: "ReLU", dropout: 0.3 },
      { neurons: 64, activation: "ReLU", dropout: 0.2 },
      { neurons: 32, activation: "ReLU", dropout: 0.1 }
    ]);
  }

  // Try different learning rates
  const learningRates = [0.01, 0.001, 0.0001];
  
  // Train networks with different architectures and learning rates
  const trainingPromises = [];
  
  for (const architecture of architectures) {
    for (const lr of learningRates) {
      trainingPromises.push(
        trainNeuralNetwork(data, features, target, architecture, 100, lr)
      );
    }
  }
  
  const results = await Promise.all(trainingPromises);
  
  // Return the best performing network
  return results.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best, 
    results[0]
  );
};

// Function to get feature importance from neural network
export const getNeuralNetworkFeatureImportance = async (
  data: any[],
  features: string[],
  target: string,
  architecture: NeuralNetworkLayer[]
): Promise<{ feature: string, importance: number }[]> => {
  // In a real implementation, this would use actual techniques like permutation importance
  // Here we simulate it
  
  // Wait a bit to simulate computation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Generate random importance values
  return features.map(feature => ({
    feature,
    importance: Math.random()
  })).sort((a, b) => b.importance - a.importance);
};

// Function to evaluate a neural network on different metrics
export const evaluateNeuralNetwork = async (
  data: any[],
  features: string[],
  target: string,
  architecture: NeuralNetworkLayer[]
): Promise<Record<string, number>> => {
  // In a real implementation, this would calculate various metrics
  // Here we simulate it
  
  const problemType = detectProblemType(data.map(d => d[target]));
  
  // Wait a bit to simulate computation
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (problemType === "regression") {
    return {
      mse: 0.1 + Math.random() * 0.2,
      mae: 0.2 + Math.random() * 0.3,
      r2: 0.7 + Math.random() * 0.3
    };
  } else {
    return {
      accuracy: 0.8 + Math.random() * 0.2,
      precision: 0.75 + Math.random() * 0.25,
      recall: 0.75 + Math.random() * 0.25,
      f1Score: 0.75 + Math.random() * 0.25
    };
  }
};

