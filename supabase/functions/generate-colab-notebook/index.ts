import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, features, targets, algorithm, datasetName, modelId, neuralNetworkArchitecture, epochs, learningRate } = await req.json();
    
    console.log(`Generating Colab notebook for ${datasetName}`);
    console.log(`Features: ${features.length}, Targets: ${targets.length}, Rows: ${data.length}`);
    
    // Create notebook content
    const notebookContent = generateColabNotebookContent(
      data, 
      features, 
      targets, 
      algorithm, 
      datasetName, 
      modelId, 
      neuralNetworkArchitecture, 
      epochs, 
      learningRate
    );
    
    // In a production system, we would create a real Colab notebook URL
    // For this demo, we'll return the notebook content and instructions for manual import
    
    return new Response(
      JSON.stringify({
        success: true,
        notebookContent: notebookContent,
        message: "Notebook generated successfully. Use the 'Download Notebook' button to save and upload to Colab."
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating notebook:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});

// Helper function to generate notebook content
function generateColabNotebookContent(
  data, 
  features, 
  targets, 
  algorithm, 
  datasetName, 
  modelId,
  neuralNetworkArchitecture = null,
  epochs = 100,
  learningRate = 0.001
) {
  const isNeuralNetwork = algorithm === "Neural Network";
  
  let architectureCode = "";
  
  if (isNeuralNetwork && neuralNetworkArchitecture) {
    // Generate code for custom architecture
    architectureCode = `
# Using custom neural network architecture
nn_model = Sequential([
    ${neuralNetworkArchitecture.map((layer, index) => 
      `Dense(${layer.neurons}, activation='${layer.activation.toLowerCase()}', ${index === 0 ? 'input_shape=(X_train_scaled.shape[1],)' : ''}),
      ${layer.dropout > 0 ? `Dropout(${layer.dropout}),` : ''}`
    ).join('\n    ')}
    Dense(1, activation='sigmoid' if len(np.unique(y)) <= 2 else 'softmax')
])

print("Using custom architecture with ${neuralNetworkArchitecture.length} hidden layers")
`;
  } else {
    // Generate code for auto architecture
    architectureCode = `
# Auto-generated neural network architecture
nn_model = Sequential([
    Dense(64, activation='relu', input_shape=(X_train_scaled.shape[1],)),
    Dropout(0.2),
    Dense(32, activation='relu'),
    Dropout(0.1),
    Dense(1, activation='sigmoid' if len(np.unique(y)) <= 2 else 'softmax')
])

print("Using auto-generated architecture")
`;
  }

  const notebook = {
    "cells": [
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          `# ${isNeuralNetwork ? 'Deep Learning' : 'Machine Learning'} Training Notebook for ${datasetName}`,
          "\n",
          `This notebook was automatically generated for training ${isNeuralNetwork ? 'neural networks' : 'machine learning models'} on your dataset.`,
          "\n",
          "Follow these steps to train your model:",
          "\n",
          "1. Run all cells in order",
          "2. The trained model will be saved to Google Drive",
          "3. Return to the app to import the trained model"
        ]
      },
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          "## Setup and Dependencies"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "# Install required packages\n",
          "!pip install -q numpy pandas scikit-learn matplotlib seaborn tensorflow"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "import numpy as np\n",
          "import pandas as pd\n",
          "import matplotlib.pyplot as plt\n",
          "import seaborn as sns\n",
          "from sklearn.model_selection import train_test_split, cross_val_score\n",
          "from sklearn.preprocessing import StandardScaler\n",
          "from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, mean_squared_error\n",
          "from google.colab import drive\n",
          "\n",
          "# Import algorithm-specific libraries\n",
          "from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier\n",
          "from sklearn.linear_model import LinearRegression, LogisticRegression\n",
          "from sklearn.svm import SVC\n",
          "from sklearn.tree import DecisionTreeClassifier\n",
          "import tensorflow as tf\n",
          "from tensorflow.keras.models import Sequential\n",
          "from tensorflow.keras.layers import Dense, Dropout\n",
          "\n",
          "# Mount Google Drive for saving the model\n",
          "drive.mount('/content/drive')"
        ]
      },
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          "## Load and Prepare Data"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "# Dataset Information\n",
          `print(f"Dataset: {'${datasetName}'}")`,
          `print(f"Features: {${JSON.stringify(features)}}")`,
          `print(f"Target(s): {${JSON.stringify(targets)}}")`,
          "\n",
          "# Load the data\n",
          `data = ${JSON.stringify(data)}`,
          "\n",
          "# Convert to DataFrame\n",
          "df = pd.DataFrame(data)\n",
          "\n",
          "# Display the first few rows\n",
          "print(\"\\nFirst 5 rows of the dataset:\")\n",
          "df.head()"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "# Prepare features and target\n",
          `X = df[${JSON.stringify(features)}]`,
          `y = df['${targets[0]}']`,
          "\n",
          "# Split the data\n",
          "X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n",
          "\n",
          "# Scale the features\n",
          "scaler = StandardScaler()\n",
          "X_train_scaled = scaler.fit_transform(X_train)\n",
          "X_test_scaled = scaler.transform(X_test)\n",
          "\n",
          "print(f\"Training set size: {X_train.shape[0]} samples\")\n",
          "print(f\"Test set size: {X_test.shape[0]} samples\")"
        ]
      },
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          "## Exploratory Data Analysis"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "# Data statistics\n",
          "print(\"Dataset statistics:\")\n",
          "df.describe()\n",
          "\n",
          "# Check for missing values\n",
          "print(\"\\nMissing values per column:\")\n",
          "df.isnull().sum()\n",
          "\n",
          "# Correlation matrix\n",
          "plt.figure(figsize=(12, 10))\n",
          "correlation_matrix = df.corr()\n",
          "sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', fmt='.2f')\n",
          "plt.title('Feature Correlation Matrix')\n",
          "plt.show()"
        ]
      },
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          `## ${isNeuralNetwork ? 'Neural Network Training' : 'Train and Evaluate Models'}`
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": isNeuralNetwork ? [
          "# Train a neural network model\n",
          "print(\"Training Neural Network...\")\n",
          "\n",
          "# Define the model architecture\n",
          architectureCode,
          "\n",
          "# Compile the model with specified parameters\n",
          "nn_model.compile(\n",
          `    optimizer=tf.keras.optimizers.Adam(learning_rate=${learningRate}),`,
          "    loss='binary_crossentropy' if len(np.unique(y)) <= 2 else 'sparse_categorical_crossentropy',\n",
          "    metrics=['accuracy']\n",
          ")\n",
          "\n",
          "# Display model summary\n",
          "nn_model.summary()\n",
          "\n",
          "# Early stopping to prevent overfitting\n",
          "early_stopping = tf.keras.callbacks.EarlyStopping(\n",
          "    monitor='val_loss',\n",
          "    patience=10,\n",
          "    restore_best_weights=True\n",
          ")\n",
          "\n",
          "# Train the model\n",
          "history = nn_model.fit(\n",
          "    X_train_scaled, y_train,\n",
          `    epochs=${epochs},`,
          "    batch_size=32,\n",
          "    validation_split=0.2,\n",
          "    callbacks=[early_stopping],\n",
          "    verbose=1\n",
          ")\n",
          "\n",
          "# Evaluate the model\n",
          "nn_loss, nn_accuracy = nn_model.evaluate(X_test_scaled, y_test)\n",
          "print(f\"\\nNeural Network Accuracy: {nn_accuracy:.4f}\")\n",
          "\n",
          "# Plot training history\n",
          "plt.figure(figsize=(12, 4))\n",
          "plt.subplot(1, 2, 1)\n",
          "plt.plot(history.history['accuracy'])\n",
          "plt.plot(history.history['val_accuracy'])\n",
          "plt.title('Model Accuracy')\n",
          "plt.ylabel('Accuracy')\n",
          "plt.xlabel('Epoch')\n",
          "plt.legend(['Train', 'Validation'], loc='lower right')\n",
          "\n",
          "plt.subplot(1, 2, 2)\n",
          "plt.plot(history.history['loss'])\n",
          "plt.plot(history.history['val_loss'])\n",
          "plt.title('Model Loss')\n",
          "plt.ylabel('Loss')\n",
          "plt.xlabel('Epoch')\n",
          "plt.legend(['Train', 'Validation'], loc='upper right')\n",
          "plt.tight_layout()\n",
          "plt.show()\n",
          "\n",
          "# Additional evaluation\n",
          "y_pred_proba = nn_model.predict(X_test_scaled)\n",
          "y_pred = (y_pred_proba > 0.5).astype(int) if len(np.unique(y)) <= 2 else np.argmax(y_pred_proba, axis=1)\n",
          "\n",
          "try:\n",
          "    print(\"\\nClassification Report:\")\n",
          "    print(classification_report(y_test, y_pred))\n",
          "    \n",
          "    print(\"\\nConfusion Matrix:\")\n",
          "    cm = confusion_matrix(y_test, y_pred)\n",
          "    plt.figure(figsize=(8, 6))\n",
          "    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')\n",
          "    plt.xlabel('Predicted')\n",
          "    plt.ylabel('Actual')\n",
          "    plt.title('Confusion Matrix')\n",
          "    plt.show()\n",
          "except Exception as e:\n",
          "    print(f\"Could not generate classification metrics: {e}\")\n",
          "    print(\"\\nRegression Metrics:\")\n",
          "    mse = mean_squared_error(y_test, y_pred)\n",
          "    print(f\"Mean Squared Error: {mse:.4f}\")\n",
          "    print(f\"Root Mean Squared Error: {np.sqrt(mse):.4f}\")\n",
          "\n",
          "# Final model variable for saving\n",
          "final_model = nn_model\n",
          "final_model_type = 'nn'\n",
          "final_accuracy = nn_accuracy"
        ] : [
          "# Train and evaluate multiple ML models\n",
          "models = {\n",
          "    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),\n",
          "    'Gradient Boosting': GradientBoostingClassifier(random_state=42),\n",
          "    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),\n",
          "    'SVM': SVC(probability=True, random_state=42),\n",
          "    'Decision Tree': DecisionTreeClassifier(random_state=42)\n",
          "}\n",
          "\n",
          "# Dictionary to store results\n",
          "results = {}\n",
          "\n",
          "# Train and evaluate each model\n",
          "for name, model in models.items():\n",
          "    print(f\"\\nTraining {name}...\")\n",
          "    model.fit(X_train_scaled, y_train)\n",
          "    \n",
          "    # Make predictions\n",
          "    y_pred = model.predict(X_test_scaled)\n",
          "    \n",
          "    # Calculate accuracy\n",
          "    accuracy = accuracy_score(y_test, y_pred)\n",
          "    results[name] = accuracy\n",
          "    \n",
          "    print(f\"{name} Accuracy: {accuracy:.4f}\")\n",
          "\n",
          "# Find the best model\n",
          "best_model_name = max(results, key=results.get)\n",
          "best_model = models[best_model_name]\n",
          "best_accuracy = results[best_model_name]\n",
          "\n",
          "print(f\"\\nBest Model: {best_model_name} with accuracy: {best_accuracy:.4f}\")\n",
          "print(\"\\nDetails for the best model:\")\n",
          "y_pred = best_model.predict(X_test_scaled)\n",
          "\n",
          "try:\n",
          "    print(\"\\nClassification Report:\")\n",
          "    print(classification_report(y_test, y_pred))\n",
          "    \n",
          "    print(\"\\nConfusion Matrix:\")\n",
          "    cm = confusion_matrix(y_test, y_pred)\n",
          "    plt.figure(figsize=(8, 6))\n",
          "    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')\n",
          "    plt.xlabel('Predicted')\n",
          "    plt.ylabel('Actual')\n",
          "    plt.title('Confusion Matrix')\n",
          "    plt.show()\n",
          "except Exception as e:\n",
          "    print(f\"Could not generate classification metrics: {e}\")\n",
          "    print(\"\\nRegression Metrics:\")\n",
          "    mse = mean_squared_error(y_test, y_pred)\n",
          "    print(f\"Mean Squared Error: {mse:.4f}\")\n",
          "    print(f\"Root Mean Squared Error: {np.sqrt(mse):.4f}\")\n",
          "\n",
          "# Set the final model variables for saving\n",
          "final_model = best_model\n",
          "final_model_type = 'traditional'\n",
          "final_accuracy = best_accuracy"
        ]
      },
      {
        "cell_type": "markdown",
        "metadata": {},
        "source": [
          "## Save the Model"
        ]
      },
      {
        "cell_type": "code",
        "execution_count": null,
        "metadata": {},
        "source": [
          "# Save the model\n",
          "import pickle\n",
          "import json\n",
          "import os\n",
          "\n",
          "# Create directory for saving\n",
          "save_dir = '/content/drive/MyDrive/ml_models'\n",
          "if not os.path.exists(save_dir):\n",
          "    os.makedirs(save_dir)\n",
          "\n",
          "# Save the model and metadata\n",
          "model_info = {\n",
          `    'modelId': '${modelId}',`,
          `    'datasetName': '${datasetName}',`,
          `    'features': ${JSON.stringify(features)},`,
          `    'targets': ${JSON.stringify(targets)},`,
          "    'accuracy': float(final_accuracy),\n",
          "    'modelType': final_model_type,\n",
          `    'algorithm': '${isNeuralNetwork ? "Neural Network" : (algorithm || "Auto-selected")}',`,
          "    'scaler': 'standard_scaler',\n",
          "    'timestamp': pd.Timestamp.now().isoformat()\n",
          "}\n",
          "\n",
          "# Save model info as JSON\n",
          `with open(f'{save_dir}/{modelId}_info.json', 'w') as f:`,
          "    json.dump(model_info, f)\n",
          "\n",
          "# Save the model based on its type\n",
          "if final_model_type == 'nn':\n",
          "    # Save neural network model\n",
          `    final_model.save(f'{save_dir}/{modelId}_model')`,
          `    print(f\"Neural Network model saved to {save_dir}/{modelId}_model\")`,
          "    \n",
          "    # Also save the scaler\n",
          `    with open(f'{save_dir}/{modelId}_scaler.pkl', 'wb') as f:`,
          "        pickle.dump(scaler, f)\n",
          "else:\n",
          "    # Save traditional ML model with pickle\n",
          `    with open(f'{save_dir}/{modelId}_model.pkl', 'wb') as f:`,
          "        pickle.dump(final_model, f)\n",
          "    \n",
          "    # Save the scaler as well\n",
          `    with open(f'{save_dir}/{modelId}_scaler.pkl', 'wb') as f:`,
          "        pickle.dump(scaler, f)\n",
          "    \n",
          `    print(f\"Traditional ML model saved to {save_dir}/{modelId}_model.pkl\")`,
          "\n",
          "print(\"Training complete and model saved! Return to the app to import the model.\")"
        ]
      }
    ],
    "metadata": {
      "kernelspec": {
        "display_name": "Python 3",
        "language": "python",
        "name": "python3"
      },
      "language_info": {
        "codemirror_mode": {
          "name": "ipython",
          "version": 3
        },
        "file_extension": ".py",
        "mimetype": "text/x-python",
        "name": "python",
        "nbconvert_exporter": "python",
        "pygments_lexer": "ipython3",
        "version": "3.8.10"
      }
    },
    "nbformat": 4,
    "nbformat_minor": 4
  };
  
  return JSON.stringify(notebook);
}
