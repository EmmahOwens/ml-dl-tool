
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// The main function to handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, features, target, algorithm, modelId, datasetName, neuralNetworkArchitecture, epochs, learningRate } = await req.json();
    
    console.log(`Starting model training for ${algorithm} with modelId ${modelId}`);
    console.log(`Dataset: ${datasetName}, Features: ${features.length}, Rows: ${data.length}`);
    
    // Determine algorithm type
    const isDL = algorithm === "Neural Network";
    const isUnsupervised = ["K-Means", "DBSCAN", "PCA", "LDA", "Isolation Forest"].includes(algorithm);
    
    // Create temporary Python script with the training code
    const tempScriptPath = await Deno.makeTempFile({suffix: ".py"});
    
    // Generate Python script content based on algorithm
    const pythonScript = generatePythonScript(algorithm, data, features, target, isDL, isUnsupervised, 
      epochs, learningRate, neuralNetworkArchitecture);
    
    // Write the Python script to the temporary file
    await Deno.writeTextFile(tempScriptPath, pythonScript);
    
    console.log(`Executing Python script at ${tempScriptPath}`);
    
    try {
      // Execute the Python script using Deno's subprocess API
      const command = new Deno.Command("python3", {
        args: [tempScriptPath],
        stdout: "piped",
        stderr: "piped",
      });
      
      const { stdout, stderr, success } = await command.output();
      
      console.log("Python execution completed");
      
      if (!success) {
        const errorOutput = new TextDecoder().decode(stderr);
        console.error(`Python execution failed: ${errorOutput}`);
        throw new Error(`Python execution failed: ${errorOutput}`);
      }
      
      // Parse the output from the Python script
      const output = new TextDecoder().decode(stdout);
      console.log(`Python output: ${output}`);
      
      let result;
      try {
        result = JSON.parse(output);
      } catch (parseError) {
        console.error(`Error parsing Python output: ${parseError.message}`);
        console.error(`Raw output: ${output}`);
        throw new Error(`Error parsing Python output: ${parseError.message}`);
      }
      
      // Clean up the temporary file
      await Deno.remove(tempScriptPath);
      
      return new Response(
        JSON.stringify({
          success: true,
          accuracy: result.accuracy,
          modelId,
          message: `Model ${algorithm} trained successfully`,
          model: result.model,
          metrics: result.metrics || {},
          confusion_matrix: result.confusion_matrix || null,
          feature_importance: result.feature_importance || null
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        }
      );
    } catch (execError) {
      console.error("Error executing Python script:", execError.message);
      
      // Clean up the temporary file
      try {
        await Deno.remove(tempScriptPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError.message);
      }
      
      throw new Error(`Python execution failed: ${execError.message}`);
    }
  } catch (error) {
    console.error("Error training model:", error.message);
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

// Helper function to generate Python script based on algorithm
function generatePythonScript(
  algorithm, 
  data, 
  features, 
  target, 
  isDL, 
  isUnsupervised, 
  epochs = 100, 
  learningRate = 0.001,
  neuralNetworkArchitecture = null
) {
  // Common imports
  let script = `
import json
import sys
import numpy as np
import pandas as pd
import pickle
import base64
from io import BytesIO
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.metrics import confusion_matrix
`;

  // Algorithm-specific imports
  if (algorithm === "Linear Regression") {
    script += `from sklearn.linear_model import LinearRegression\n`;
  } else if (algorithm === "Logistic Regression") {
    script += `from sklearn.linear_model import LogisticRegression\n`;
  } else if (algorithm === "Decision Tree") {
    script += `from sklearn.tree import DecisionTreeClassifier\nfrom sklearn.tree import DecisionTreeRegressor\n`;
  } else if (algorithm === "Random Forest") {
    script += `from sklearn.ensemble import RandomForestClassifier\nfrom sklearn.ensemble import RandomForestRegressor\n`;
  } else if (algorithm === "SVM") {
    script += `from sklearn.svm import SVC\nfrom sklearn.svm import SVR\n`;
  } else if (algorithm === "K-Means") {
    script += `from sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\n`;
  } else if (algorithm === "Neural Network") {
    script += `
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    from tensorflow.keras.optimizers import Adam
    HAS_TF = True
except ImportError:
    # Fall back to scikit-learn's MLPClassifier
    from sklearn.neural_network import MLPClassifier, MLPRegressor
    HAS_TF = False
`;
  } else if (algorithm === "DBSCAN") {
    script += `from sklearn.cluster import DBSCAN\nfrom sklearn.metrics import silhouette_score\n`;
  } else if (algorithm === "PCA") {
    script += `from sklearn.decomposition import PCA\n`;
  } else if (algorithm === "Isolation Forest") {
    script += `from sklearn.ensemble import IsolationForest\n`;
  } else if (algorithm === "XGBoost") {
    script += `import xgboost as xgb\n`;
  } else if (algorithm === "LightGBM") {
    script += `import lightgbm as lgb\n`;
  } else if (algorithm === "CatBoost") {
    script += `from catboost import CatBoostClassifier, CatBoostRegressor\n`;
  }

  // Script body
  script += `
# Convert input data to numpy arrays
data = ${JSON.stringify(data)}
features = ${JSON.stringify(features)}
target = "${target}"

# Check if this is a classification or regression problem
def is_classification(y):
    if len(set(y)) < 10 or not all(isinstance(val, (int, float)) for val in y):
        return True
    return False

# Prepare the dataset
X = np.array([[row[f] for f in features] for row in data])
`;

  // Add target handling based on algorithm type
  if (!isUnsupervised) {
    script += `
y = np.array([row[target] for row in data])
is_classification_problem = is_classification(y)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
`;
  } else {
    script += `
# Standardize features for unsupervised learning
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
`;
  }

  // Algorithm-specific training code
  if (algorithm === "Linear Regression") {
    script += `
model = LinearRegression()
model.fit(X_train_scaled, y_train)
y_pred = model.predict(X_test_scaled)
accuracy = r2_score(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
metrics = {
    "r2_score": float(accuracy),
    "mse": float(mse),
    "coef": model.coef_.tolist(),
    "intercept": float(model.intercept_)
}
feature_importance = dict(zip(features, abs(model.coef_).tolist()))
`;
  } else if (algorithm === "Logistic Regression") {
    script += `
model = LogisticRegression(max_iter=1000)
model.fit(X_train_scaled, y_train)
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
metrics = {
    "accuracy": float(accuracy),
    "precision": float(precision),
    "recall": float(recall),
    "f1_score": float(f1)
}
try:
    cm = confusion_matrix(y_test, y_pred).tolist()
except:
    cm = []
feature_importance = dict(zip(features, abs(model.coef_[0]).tolist()))
`;
  } else if (algorithm === "Decision Tree") {
    script += `
if is_classification_problem:
    model = DecisionTreeClassifier()
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1)
    }
    try:
        cm = confusion_matrix(y_test, y_pred).tolist()
    except:
        cm = []
else:
    model = DecisionTreeRegressor()
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    metrics = {
        "r2_score": float(accuracy),
        "mse": float(mse)
    }
    cm = None
feature_importance = dict(zip(features, model.feature_importances_.tolist()))
`;
  } else if (algorithm === "Random Forest") {
    script += `
if is_classification_problem:
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1)
    }
    try:
        cm = confusion_matrix(y_test, y_pred).tolist()
    except:
        cm = []
else:
    model = RandomForestRegressor(n_estimators=100)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    metrics = {
        "r2_score": float(accuracy),
        "mse": float(mse)
    }
    cm = None
feature_importance = dict(zip(features, model.feature_importances_.tolist()))
`;
  } else if (algorithm === "SVM") {
    script += `
if is_classification_problem:
    model = SVC(kernel='rbf', probability=True)
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1)
    }
    try:
        cm = confusion_matrix(y_test, y_pred).tolist()
    except:
        cm = []
    feature_importance = {}  # SVM doesn't provide direct feature importance
else:
    model = SVR(kernel='rbf')
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = r2_score(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    metrics = {
        "r2_score": float(accuracy),
        "mse": float(mse)
    }
    cm = None
    feature_importance = {}  # SVM doesn't provide direct feature importance
`;
  } else if (algorithm === "K-Means") {
    script += `
# Determine optimal number of clusters using silhouette score
n_clusters = min(len(X_scaled), 10)  # Upper limit for testing
silhouette_scores = []

for n in range(2, n_clusters + 1):
    kmeans = KMeans(n_clusters=n, random_state=42)
    cluster_labels = kmeans.fit_predict(X_scaled)
    try:
        score = silhouette_score(X_scaled, cluster_labels)
        silhouette_scores.append((n, score))
    except:
        pass

# Find best number of clusters
best_n_clusters = 3  # Default
if silhouette_scores:
    best_n_clusters = max(silhouette_scores, key=lambda x: x[1])[0]

model = KMeans(n_clusters=best_n_clusters)
model.fit(X_scaled)
accuracy = model.inertia_  # Use inertia as a measure of fit

# Calculate silhouette score
try:
    silhouette_avg = silhouette_score(X_scaled, model.labels_)
except:
    silhouette_avg = 0

metrics = {
    "silhouette_score": float(silhouette_avg),
    "inertia": float(accuracy),
    "n_clusters": int(best_n_clusters)
}
cm = None
feature_importance = {}  # K-means doesn't provide direct feature importance
`;
  } else if (algorithm === "Neural Network") {
    // Extract architecture if provided
    let layerConfig = "";
    if (neuralNetworkArchitecture) {
      layerConfig = "nn_architecture = " + JSON.stringify(neuralNetworkArchitecture);
    } else {
      layerConfig = `nn_architecture = [
    {"neurons": 64, "activation": "relu", "dropout": 0.2},
    {"neurons": 32, "activation": "relu", "dropout": 0.1}
]`;
    }
    
    script += `
${layerConfig}
epochs = ${epochs || 100}
learning_rate = ${learningRate || 0.001}

if HAS_TF:
    # Try using TensorFlow if available
    # Determine if classification or regression
    if is_classification_problem:
        # Determine if binary or multiclass
        unique_classes = len(set(y_train))
        last_layer_units = 1 if unique_classes == 2 else unique_classes
        last_activation = 'sigmoid' if unique_classes == 2 else 'softmax'
        loss_function = 'binary_crossentropy' if unique_classes == 2 else 'sparse_categorical_crossentropy'
        
        model = Sequential()
        # Input layer
        model.add(Dense(nn_architecture[0]["neurons"], activation=nn_architecture[0]["activation"], input_shape=(X_train_scaled.shape[1],)))
        if "dropout" in nn_architecture[0] and nn_architecture[0]["dropout"] > 0:
            model.add(Dropout(nn_architecture[0]["dropout"]))
        
        # Hidden layers
        for layer in nn_architecture[1:]:
            model.add(Dense(layer["neurons"], activation=layer["activation"]))
            if "dropout" in layer and layer["dropout"] > 0:
                model.add(Dropout(layer["dropout"]))
        
        # Output layer
        model.add(Dense(last_layer_units, activation=last_activation))
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss=loss_function,
            metrics=['accuracy']
        )
        
        # Early stopping to prevent overfitting
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train model
        history = model.fit(
            X_train_scaled, y_train,
            epochs=epochs,
            batch_size=32,
            validation_split=0.2,
            callbacks=[early_stopping],
            verbose=0
        )
        
        # Evaluate model
        if unique_classes == 2:
            y_pred_proba = model.predict(X_test_scaled)
            y_pred = (y_pred_proba > 0.5).astype(int).flatten()
        else:
            y_pred = model.predict(X_test_scaled).argmax(axis=1)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "val_accuracy": float(history.history['val_accuracy'][-1]),
            "epochs_used": len(history.history['loss'])
        }
        
        try:
            cm = confusion_matrix(y_test, y_pred).tolist()
        except:
            cm = []
            
    else:  # Regression
        model = Sequential()
        # Input layer
        model.add(Dense(nn_architecture[0]["neurons"], activation=nn_architecture[0]["activation"], input_shape=(X_train_scaled.shape[1],)))
        if "dropout" in nn_architecture[0] and nn_architecture[0]["dropout"] > 0:
            model.add(Dropout(nn_architecture[0]["dropout"]))
        
        # Hidden layers
        for layer in nn_architecture[1:]:
            model.add(Dense(layer["neurons"], activation=layer["activation"]))
            if "dropout" in layer and layer["dropout"] > 0:
                model.add(Dropout(layer["dropout"]))
        
        # Output layer - linear for regression
        model.add(Dense(1, activation='linear'))
        
        # Compile model
        model.compile(
            optimizer=Adam(learning_rate=learning_rate),
            loss='mse',
            metrics=['mae']
        )
        
        # Early stopping to prevent overfitting
        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True
        )
        
        # Train model
        history = model.fit(
            X_train_scaled, y_train,
            epochs=epochs,
            batch_size=32,
            validation_split=0.2,
            callbacks=[early_stopping],
            verbose=0
        )
        
        # Evaluate model
        y_pred = model.predict(X_test_scaled).flatten()
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        metrics = {
            "mse": float(mse),
            "r2_score": float(r2),
            "val_mae": float(history.history['val_mae'][-1]),
            "epochs_used": len(history.history['loss'])
        }
        accuracy = r2
        cm = None
    
    # For neural networks, we use permutation importance or just a placeholder
    feature_importance = {}
    
else:
    # Fallback to sklearn's MLPClassifier/MLPRegressor
    hidden_layer_sizes = tuple(layer["neurons"] for layer in nn_architecture)
    
    if is_classification_problem:
        model = MLPClassifier(
            hidden_layer_sizes=hidden_layer_sizes,
            max_iter=epochs,
            learning_rate_init=learning_rate,
            early_stopping=True,
            random_state=42
        )
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1)
        }
        
        try:
            cm = confusion_matrix(y_test, y_pred).tolist()
        except:
            cm = []
    else:
        model = MLPRegressor(
            hidden_layer_sizes=hidden_layer_sizes,
            max_iter=epochs,
            learning_rate_init=learning_rate,
            early_stopping=True,
            random_state=42
        )
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        metrics = {
            "mse": float(mse),
            "r2_score": float(r2)
        }
        accuracy = r2
        cm = None
    
    feature_importance = {}
`;
  } else if (algorithm === "XGBoost") {
    script += `
try:
    if is_classification_problem:
        # Determine if binary or multiclass
        unique_classes = len(set(y_train))
        if unique_classes == 2:
            model = xgb.XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                random_state=42
            )
        else:
            model = xgb.XGBClassifier(
                n_estimators=100,
                learning_rate=0.1,
                objective='multi:softprob',
                num_class=unique_classes,
                random_state=42
            )
        
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1)
        }
        
        try:
            cm = confusion_matrix(y_test, y_pred).tolist()
        except:
            cm = []
    else:
        model = xgb.XGBRegressor(
            n_estimators=100,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        metrics = {
            "mse": float(mse),
            "r2_score": float(r2)
        }
        accuracy = r2
        cm = None
    
    feature_importance = dict(zip(features, model.feature_importances_.tolist()))
    
except:
    # Fallback to RandomForest if XGBoost fails
    if is_classification_problem:
        model = RandomForestClassifier(n_estimators=100)
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        metrics = {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "note": "Fallback to RandomForest as XGBoost failed"
        }
        
        try:
            cm = confusion_matrix(y_test, y_pred).tolist()
        except:
            cm = []
    else:
        model = RandomForestRegressor(n_estimators=100)
        model.fit(X_train_scaled, y_train)
        y_pred = model.predict(X_test_scaled)
        
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        metrics = {
            "mse": float(mse),
            "r2_score": float(r2),
            "note": "Fallback to RandomForest as XGBoost failed"
        }
        accuracy = r2
        cm = None
    
    feature_importance = dict(zip(features, model.feature_importances_.tolist()))
`;
  }

  // Serialize model to base64 string for storage
  script += `
# Serialize model to base64 string
model_bytes = BytesIO()
pickle.dump(model, model_bytes)
model_bytes.seek(0)
model_base64 = base64.b64encode(model_bytes.read()).decode('utf-8')

# Output results as JSON
result = {
    "accuracy": float(accuracy),
    "algorithm": "${algorithm}",
    "model": model_base64,
    "metrics": metrics,
    "confusion_matrix": cm,
    "feature_importance": feature_importance
}
print(json.dumps(result))
`;

  return script;
}
