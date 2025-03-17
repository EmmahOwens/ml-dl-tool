
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// The main function to handle HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelId, inputData } = await req.json();
    
    console.log(`Making prediction with model ${modelId}`);
    console.log(`Input data: ${JSON.stringify(inputData)}`);
    
    // Fetch the model from the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "https://uysdqwhyhqhamwvzsolw.supabase.co";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    const response = await fetch(`${supabaseUrl}/rest/v1/models?id=eq.${modelId}&select=*`, {
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.statusText}`);
    }
    
    const models = await response.json();
    if (!models || models.length === 0) {
      throw new Error(`Model with ID ${modelId} not found`);
    }
    
    const model = models[0];
    
    // Create temporary Python script for prediction
    const tempScriptPath = await Deno.makeTempFile({suffix: ".py"});
    
    // Generate Python script for prediction
    const pythonScript = generatePredictionScript(model, inputData);
    
    // Write the Python script to the temporary file
    await Deno.writeTextFile(tempScriptPath, pythonScript);
    
    console.log(`Executing Python prediction script at ${tempScriptPath}`);
    
    try {
      // Execute the Python script using Deno's subprocess API
      const command = new Deno.Command("python3", {
        args: [tempScriptPath],
        stdout: "piped",
        stderr: "piped",
      });
      
      const { stdout, stderr, success } = await command.output();
      
      console.log("Python prediction completed");
      
      if (!success) {
        const errorOutput = new TextDecoder().decode(stderr);
        console.error(`Python prediction failed: ${errorOutput}`);
        throw new Error(`Python prediction failed: ${errorOutput}`);
      }
      
      // Parse the output from the Python script
      const output = new TextDecoder().decode(stdout);
      console.log(`Python prediction output: ${output}`);
      
      let result;
      try {
        result = JSON.parse(output);
      } catch (parseError) {
        console.error(`Error parsing Python output: ${parseError.message}`);
        console.error(`Raw output: ${output}`);
        throw new Error(`Error parsing Python output: ${parseError.message}`);
      }
      
      const predictions = result.predictions || [];
      const probabilities = result.probabilities || [];
      const explanation = result.explanation || null;
      
      // Clean up the temporary file
      await Deno.remove(tempScriptPath);
      
      return new Response(
        JSON.stringify({
          success: true,
          predictions,
          probabilities,
          explanation,
          message: "Prediction completed successfully"
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
      console.error("Error executing Python prediction script:", execError.message);
      
      // Clean up the temporary file
      try {
        await Deno.remove(tempScriptPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temporary file:", cleanupError.message);
      }
      
      throw new Error(`Prediction failed: ${execError.message}`);
    }
  } catch (error) {
    console.error("Error making prediction:", error.message);
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

// Helper function to generate Python prediction script
function generatePredictionScript(model, inputData) {
  const { algorithm, model_data } = model;
  
  const script = `
import json
import pickle
import base64
import numpy as np
import pandas as pd
from io import BytesIO
from sklearn.preprocessing import StandardScaler

# Load model from base64 string
model_base64 = """${model_data || ''}"""
if model_base64:
    try:
        model_bytes = BytesIO(base64.b64decode(model_base64))
        model = pickle.load(model_bytes)
    except Exception as e:
        print(json.dumps({
            "error": f"Failed to load model: {str(e)}"
        }))
        exit(1)
else:
    print(json.dumps({
        "error": "No model data available"
    }))
    exit(1)

# Load input data
input_data = ${JSON.stringify(inputData)}

# Convert input data to numpy array
X = np.array(input_data)

# Standardize the input data (using same approach as during training)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Make predictions
try:
    # Check if model has predict_proba method (classification)
    if hasattr(model, 'predict_proba'):
        predictions = model.predict(X_scaled).tolist()
        probabilities = model.predict_proba(X_scaled).tolist()
    else:
        # For regression models
        predictions = model.predict(X_scaled).tolist()
        probabilities = []
    
    # Generate simple explanation if possible
    explanation = None
    if hasattr(model, 'feature_importances_'):
        # For tree-based models
        explanation = {"feature_importance": model.feature_importances_.tolist()}
    elif hasattr(model, 'coef_'):
        # For linear models
        explanation = {"coefficients": model.coef_.tolist()}
    
    # Output results as JSON
    result = {
        "predictions": predictions,
        "probabilities": probabilities,
        "explanation": explanation
    }
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({
        "error": f"Prediction failed: {str(e)}"
    }))
    exit(1)
`;

  return script;
}
