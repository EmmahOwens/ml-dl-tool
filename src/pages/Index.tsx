
import { useState } from "react";
import { Header } from "@/components/Header";
import { DatasetUploader } from "@/components/DatasetUploader";
import { MLTraining } from "@/components/MLTraining";
import { DLTraining } from "@/components/DLTraining";
import { ModelStorage } from "@/components/ModelStorage";
import { ThemeProvider } from "@/context/ThemeContext";
import { ModelProvider } from "@/context/ModelContext";
import { AnimatedTransition } from "@/components/AnimatedTransition";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

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
              <div className="bg-secondary/50 p-4 rounded-lg mb-4 text-sm flex justify-between items-center">
                <div>
                  This is a demonstration application that simulates ML/DL training workflows.
                  For actual model training with real capabilities, check out popular ML libraries.
                </div>
                <div className="flex gap-2">
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
