
import { useState } from "react";
import { Header } from "@/components/Header";
import { DatasetUploader } from "@/components/DatasetUploader";
import { MLTraining } from "@/components/MLTraining";
import { DLTraining } from "@/components/DLTraining";
import { ModelStorage } from "@/components/ModelStorage";
import { AnimatedTransition } from "@/components/AnimatedTransition";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ModelDisclaimer } from "@/components/ModelDisclaimer";
import { useTheme } from "@/context/ThemeContext";
import { TrainingProgress } from "@/components/TrainingProgress";
import { FeatureImportance } from "@/components/FeatureImportance";
import { HyperparameterTuning } from "@/components/HyperparameterTuning";
import { ModelVersioning } from "@/components/ModelVersioning";
import { CrossValidation } from "@/components/CrossValidation";
import { DataPreprocessing } from "@/components/DataPreprocessing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const { theme } = useTheme();
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<{
    data: any[];
    features: string[];
    target: string;
    name: string;
  } | null>(null);
  
  const [mlTrainingComplete, setMlTrainingComplete] = useState(false);
  const [dlTrainingComplete, setDlTrainingComplete] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  const handleDatasetLoad = (
    data: any[],
    features: string[],
    target: string,
    name: string
  ) => {
    setDatasetInfo({ data, features, target, name });
    setDatasetLoaded(true);
    setMlTrainingComplete(false);
    setDlTrainingComplete(false);
  };

  const handleMLTrainingComplete = () => {
    setMlTrainingComplete(true);
    setIsTraining(false);
  };

  const handleDLTrainingComplete = () => {
    setDlTrainingComplete(true);
    setIsTraining(false);
  };
  
  const handleStartTraining = () => {
    setIsTraining(true);
  };
  
  // Sample feature importance data
  const featureImportanceData = [
    { name: "age", importance: 0.82 },
    { name: "income", importance: 0.75 },
    { name: "credit_score", importance: 0.68 },
    { name: "account_balance", importance: 0.61 },
    { name: "num_products", importance: 0.54 },
    { name: "active_member", importance: 0.47 },
    { name: "tenure", importance: 0.39 },
    { name: "country", importance: 0.32 },
    { name: "gender", importance: 0.25 },
    { name: "has_card", importance: 0.18 },
  ];

  return (
    <div className={`min-h-screen pb-20 transition-colors duration-300 ${
      theme === "dark" ? "bg-gradient-to-b from-background to-background/80" : ""
    }`}>
      <Header />
      
      <main className="max-w-7xl mx-auto pt-24 px-4">
        <div className="grid gap-8">
          <ModelDisclaimer />
          
          <div className={`
            p-4 rounded-lg mb-4 text-sm flex flex-col md:flex-row justify-between gap-4
            ${theme === "light" ? "bg-secondary/50" : "bg-secondary/30"}
          `}>
            <div>
              Want to build real, production-ready machine learning models? Check out these industry-standard 
              ML libraries that provide actual training and prediction capabilities.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://scikit-learn.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  scikit-learn <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.tensorflow.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  TensorFlow <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://pytorch.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  PyTorch <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
          
          <AnimatedTransition>
            <DatasetUploader onDatasetLoad={handleDatasetLoad} />
          </AnimatedTransition>
          
          {datasetLoaded && datasetInfo && (
            <>
              <AnimatedTransition>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DataPreprocessing />
                  <TrainingProgress 
                    modelName={datasetInfo.name}
                    isTraining={isTraining}
                    onPause={() => setIsTraining(false)}
                    onResume={() => setIsTraining(true)}
                    onCancel={() => setIsTraining(false)}
                  />
                </div>
              </AnimatedTransition>
              
              <AnimatedTransition>
                <Tabs defaultValue="ml" className="mt-2">
                  <TabsList className="mb-4">
                    <TabsTrigger value="ml">Machine Learning</TabsTrigger>
                    <TabsTrigger value="dl">Deep Learning</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ml">
                    <div className="grid gap-6">
                      <MLTraining
                        data={datasetInfo.data}
                        features={datasetInfo.features}
                        target={datasetInfo.target}
                        datasetName={datasetInfo.name}
                        onTrainingComplete={handleMLTrainingComplete}
                        onStartTraining={handleStartTraining}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <HyperparameterTuning />
                        <CrossValidation />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="dl">
                    <div className="grid gap-6">
                      <DLTraining
                        data={datasetInfo.data}
                        features={datasetInfo.features}
                        target={datasetInfo.target}
                        datasetName={datasetInfo.name}
                        onTrainingComplete={handleDLTrainingComplete}
                        onStartTraining={handleStartTraining}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </AnimatedTransition>
              
              {(mlTrainingComplete || dlTrainingComplete) && (
                <AnimatedTransition>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FeatureImportance features={featureImportanceData} />
                    <ModelVersioning />
                  </div>
                </AnimatedTransition>
              )}
            </>
          )}
          
          <AnimatedTransition>
            <ModelStorage />
          </AnimatedTransition>
        </div>
      </main>
    </div>
  );
};

export default Index;
