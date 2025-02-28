
import { useState } from "react";
import { Header } from "@/components/Header";
import { DatasetUploader } from "@/components/DatasetUploader";
import { MLTraining } from "@/components/MLTraining";
import { DLTraining } from "@/components/DLTraining";
import { ModelStorage } from "@/components/ModelStorage";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModelProvider } from "@/context/ModelContext";
import { AnimatedTransition } from "@/components/AnimatedTransition";

const Index = () => {
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState<{
    data: any[];
    features: string[];
    target: string;
    name: string;
  } | null>(null);
  
  const [mlTrainingComplete, setMlTrainingComplete] = useState(false);
  const [dlTrainingComplete, setDlTrainingComplete] = useState(false);

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
  };

  const handleDLTrainingComplete = () => {
    setDlTrainingComplete(true);
  };

  return (
    <ThemeProvider>
      <ModelProvider>
        <div className="min-h-screen pb-20">
          <Header />
          
          <main className="max-w-7xl mx-auto pt-24 px-4">
            <div className="grid gap-8">
              <AnimatedTransition>
                <DatasetUploader onDatasetLoad={handleDatasetLoad} />
              </AnimatedTransition>
              
              {datasetLoaded && datasetInfo && (
                <>
                  <AnimatedTransition>
                    <MLTraining
                      data={datasetInfo.data}
                      features={datasetInfo.features}
                      target={datasetInfo.target}
                      datasetName={datasetInfo.name}
                      onTrainingComplete={handleMLTrainingComplete}
                    />
                  </AnimatedTransition>
                  
                  <AnimatedTransition>
                    <DLTraining
                      data={datasetInfo.data}
                      features={datasetInfo.features}
                      target={datasetInfo.target}
                      datasetName={datasetInfo.name}
                      onTrainingComplete={handleDLTrainingComplete}
                    />
                  </AnimatedTransition>
                </>
              )}
              
              <AnimatedTransition>
                <ModelStorage />
              </AnimatedTransition>
            </div>
          </main>
        </div>
      </ModelProvider>
    </ThemeProvider>
  );
};

export default Index;
