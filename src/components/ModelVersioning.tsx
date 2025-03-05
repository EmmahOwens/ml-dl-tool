
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { GitBranch, GitCompare, GitMerge, RotateCcw } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ModelVersion {
  id: string;
  name: string;
  accuracy: number;
  created: string;
  algorithm: string;
  hyperparams: Record<string, any>;
  isActive: boolean;
}

export function ModelVersioning() {
  const { theme } = useTheme();
  const [versions, setVersions] = useState<ModelVersion[]>([
    {
      id: "v1",
      name: "Initial Model",
      accuracy: 0.82,
      created: "2023-06-15",
      algorithm: "RandomForest",
      hyperparams: { n_estimators: 100, max_depth: 10 },
      isActive: false
    },
    {
      id: "v2",
      name: "Hyperparameter Tuned",
      accuracy: 0.87,
      created: "2023-06-20",
      algorithm: "RandomForest",
      hyperparams: { n_estimators: 200, max_depth: 15 },
      isActive: true
    }
  ]);

  const handleActivateVersion = (id: string) => {
    setVersions(versions.map(v => ({
      ...v,
      isActive: v.id === id
    })));
  };

  const handleCompareVersions = () => {
    console.log("Comparing model versions");
    // This would trigger a comparison view in a real implementation
  };

  const currentVersion = versions.find(v => v.isActive) || versions[0];

  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-bold mb-1">Model Versioning</CardTitle>
            <CardDescription>Track and compare different model iterations</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCompareVersions}
            className="flex gap-1 items-center"
          >
            <GitCompare className="h-4 w-4" />
            Compare
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="versions">
          <TabsList className="mb-4">
            <TabsTrigger value="versions">Version History</TabsTrigger>
            <TabsTrigger value="current">Current Version</TabsTrigger>
          </TabsList>
          
          <TabsContent value="versions">
            <Table>
              <TableCaption>Model version history and performance</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map(version => (
                  <TableRow key={version.id}>
                    <TableCell>{version.id}</TableCell>
                    <TableCell>{version.name}</TableCell>
                    <TableCell>{(version.accuracy * 100).toFixed(2)}%</TableCell>
                    <TableCell>{formatDate(version.created)}</TableCell>
                    <TableCell>
                      {version.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!version.isActive && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleActivateVersion(version.id)}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="current">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">{currentVersion.name}</h3>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-secondary/70" : "bg-secondary/30"
                }`}>
                  <h4 className="font-medium mb-2">Model Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span>{currentVersion.algorithm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span>{(currentVersion.accuracy * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{formatDate(currentVersion.created)}</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  theme === "light" ? "bg-secondary/70" : "bg-secondary/30"
                }`}>
                  <h4 className="font-medium mb-2">Hyperparameters</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(currentVersion.hyperparams).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <GitBranch className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {versions.length} versions
          </span>
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <GitMerge className="h-4 w-4" />
          Create New Version
        </Button>
      </CardFooter>
    </Card>
  );
}
