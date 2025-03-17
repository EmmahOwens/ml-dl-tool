
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelId, modelData, datasetName, modelName, algorithm, accuracy, parameters } = await req.json();
    
    console.log(`Importing trained model with ID: ${modelId}`);
    
    // Check if we have the required data
    if (!modelId || !datasetName || !algorithm) {
      throw new Error("Missing required parameters for model import");
    }
    
    // Get Supabase credentials
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY");
    }
    
    // Store the model data in the database
    const modelInfo = {
      id: modelId,
      name: modelName || `Imported ${algorithm} Model`,
      algorithm: algorithm,
      accuracy: accuracy || 0.85,
      dataset_name: datasetName,
      type: algorithm === "Neural Network" ? "DL" : "ML",
      parameters: parameters || {},
      model_data: modelData || null,
      is_trained: true
    };
    
    // Insert into the database
    const response = await fetch(`${supabaseUrl}/rest/v1/models`, {
      method: "POST",
      headers: {
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(modelInfo)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to import model: ${error}`);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        modelId,
        accuracy: modelInfo.accuracy,
        message: "Model imported successfully"
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
    console.error("Error importing model:", error.message);
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
