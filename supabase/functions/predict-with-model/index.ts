
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { modelId, inputData } = await req.json();
    
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Making prediction with model ID: ${modelId}`);
    
    // Get model from the database
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select('*')
      .eq('id', modelId)
      .single();
      
    if (modelError) {
      throw new Error(`Error fetching model: ${modelError.message}`);
    }
    
    if (!model.is_trained) {
      throw new Error('Model is not trained yet');
    }
    
    // In a real implementation, we would load the saved model from model_data
    // and use it to make predictions with the input data
    // For now, we'll simulate making predictions
    
    const predictions = simulatePrediction(inputData, model);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        predictions,
        modelName: model.name,
        algorithm: model.algorithm,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in predict-with-model function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

// For demo purposes, we'll simulate making predictions
// In a real implementation, this would load and use the actual trained model
function simulatePrediction(inputData: any, model: any): any {
  // Use sample predictions if available as a baseline
  const samplePredictions = model.model_predictions || [];
  
  if (Array.isArray(inputData)) {
    // If we have multiple inputs, generate a prediction for each
    return inputData.map(() => {
      // Use a sample prediction if available or generate a random one
      if (samplePredictions.length > 0) {
        return samplePredictions[Math.floor(Math.random() * samplePredictions.length)];
      }
      
      // Generate a random prediction based on model type
      if (model.type === 'Regression') {
        return Math.random() * 100; // Random value for regression
      } else {
        return Math.random() > 0.5 ? 1 : 0; // Binary classification
      }
    });
  } else {
    // Single input
    if (samplePredictions.length > 0) {
      return samplePredictions[Math.floor(Math.random() * samplePredictions.length)];
    }
    
    if (model.type === 'Regression') {
      return Math.random() * 100;
    } else {
      return Math.random() > 0.5 ? 1 : 0;
    }
  }
}
