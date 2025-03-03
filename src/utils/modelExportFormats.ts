
import { Model, Algorithm } from "@/context/ModelContext";

// Helper to create different model file structures based on file type
export const createModelExportData = (model: Model, fileExtension: string): string => {
  // Base model metadata that's included in all formats
  const baseMetadata = {
    name: model.name,
    algorithm: model.algorithm,
    accuracy: model.accuracy,
    created: model.created,
    type: model.type,
  };

  switch (fileExtension) {
    case 'pkl':
    case 'pickle':
      // Simulated pickle format with metadata and parameters
      return JSON.stringify({
        ...baseMetadata,
        _sklearn_version: "1.2.0",
        parameters: model.parameters,
        feature_names: model.targets,
        metadata: {
          is_fitted: true,
          simulation_note: "This is a simulated model structure for demonstration purposes only."
        }
      }, null, 2);

    case 'h5':
    case 'hdf5':
    case 'keras':
      // Simulated keras/TF model structure
      return JSON.stringify({
        ...baseMetadata,
        format: "Keras H5",
        keras_version: "2.11.0",
        backend: "tensorflow",
        model_config: {
          class_name: "Sequential",
          config: {
            name: "sequential",
            layers: model.neuralNetworkArchitecture ? 
              createSimulatedLayers(model.neuralNetworkArchitecture) : 
              [{ "class_name": "Dense", "config": { "units": 64, "activation": "relu" } }]
          }
        },
        training_config: {
          optimizer_config: {
            class_name: "Adam",
            config: { learning_rate: model.parameters?.learningRate || 0.001 }
          },
          loss: model.parameters?.problemType === "regression" ? "mse" : "binary_crossentropy",
          metrics: ["accuracy"],
          weighted_metrics: null,
          epochs: model.parameters?.epochs || 100
        },
        simulation_note: "This is a simulated model structure for demonstration purposes only."
      }, null, 2);

    case 'pt':
    case 'pth':
      // Simulated PyTorch model structure
      return JSON.stringify({
        ...baseMetadata,
        torch_version: "1.13.0",
        model_state_dict: {
          "layers.0.weight": "[simulated tensor data]",
          "layers.0.bias": "[simulated tensor data]",
          "layers.1.weight": "[simulated tensor data]",
          "layers.1.bias": "[simulated tensor data]"
        },
        optimizer_state_dict: {
          state: {},
          param_groups: [
            {
              lr: model.parameters?.learningRate || 0.001,
              momentum: 0.9,
              weight_decay: 0.0001
            }
          ]
        },
        simulation_note: "This is a simulated model structure for demonstration purposes only."
      }, null, 2);

    case 'onnx':
      // Simulated ONNX model structure
      return JSON.stringify({
        ...baseMetadata,
        onnx_version: "1.12.0",
        graph: {
          name: model.name,
          nodes: [
            {
              name: "input",
              op_type: "Input",
              inputs: [],
              outputs: ["features"]
            },
            {
              name: "layer1",
              op_type: "Dense",
              inputs: ["features"],
              outputs: ["hidden1"]
            },
            {
              name: "output",
              op_type: "Output",
              inputs: ["hidden1"],
              outputs: ["predictions"]
            }
          ]
        },
        simulation_note: "This is a simulated model structure for demonstration purposes only."
      }, null, 2);

    case 'json':
    default:
      // Default JSON format with all model data
      return JSON.stringify({
        ...model,
        simulation_note: "This is a simulated model structure for demonstration purposes only. To use actual models, implement training with ML libraries like TensorFlow, PyTorch or scikit-learn."
      }, null, 2);
  }
};

// Helper to create simulated layers for neural network exports
const createSimulatedLayers = (architecture: any[]): any[] => {
  // Check if architecture is an array of numbers or layer objects
  if (architecture.length > 0 && typeof architecture[0] === 'number') {
    return architecture.map((neurons, index) => ({
      class_name: "Dense",
      config: {
        units: neurons,
        activation: index === architecture.length - 1 ? "linear" : "relu",
        use_bias: true
      }
    }));
  } else {
    return (architecture as any[]).map(layer => ({
      class_name: "Dense",
      config: {
        units: layer.neurons,
        activation: layer.activation.toLowerCase(),
        use_bias: true,
        dropout: layer.dropout || 0
      }
    }));
  }
};

// Get appropriate file extensions based on model type
export const getRecommendedExtensions = (model: Model): string[] => {
  if (model.type === "DL") {
    return ['h5', 'keras', 'pb', 'pt', 'onnx', 'json'];
  } else if (model.type === "ML") {
    const algorithm = model.algorithm;
    
    // Tree-based models
    if (["Decision Tree", "Random Forest", "Gradient Boosting", "XGBoost", "LightGBM", "CatBoost"].includes(algorithm)) {
      return ['pkl', 'joblib', 'json'];
    }
    
    // Linear models
    if (["Linear Regression", "Logistic Regression", "SVM"].includes(algorithm)) {
      return ['pkl', 'joblib', 'json', 'onnx'];
    }
    
    return ['pkl', 'joblib', 'json'];
  }
  
  return ['json'];
};
