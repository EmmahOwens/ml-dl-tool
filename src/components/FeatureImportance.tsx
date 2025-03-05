
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/context/ThemeContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

interface FeatureImportanceProps {
  features: Array<{
    name: string;
    importance: number;
  }>;
  title?: string;
  description?: string;
}

export function FeatureImportance({ 
  features,
  title = "Feature Importance",
  description = "Understanding which features have the most impact on your model"
}: FeatureImportanceProps) {
  const { theme } = useTheme();
  
  // Sort features by importance
  const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance);
  
  // Generate color gradient based on importance
  const getBarColor = (value: number, index: number) => {
    if (theme === "light") {
      // Blue gradient for light mode
      return `rgba(37, 99, 235, ${0.4 + value * 0.6})`;
    } else {
      // Purple gradient for dark mode
      return `rgba(124, 58, 237, ${0.4 + value * 0.6})`;
    }
  };

  return (
    <Card className={`w-full ${
      theme === "light" ? "card-container-light" : "card-container-dark"
    }`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedFeatures}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                horizontal={true}
                vertical={false}
                stroke={theme === "light" ? "#e5e7eb" : "#374151"}
              />
              <XAxis 
                type="number"
                domain={[0, Math.ceil(Math.max(...features.map(f => f.importance)) * 10) / 10]}
                tickFormatter={(value) => value.toFixed(2)}
                stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
              />
              <YAxis 
                dataKey="name"
                type="category"
                width={120}
                tick={{ fontSize: 12 }}
                stroke={theme === "light" ? "#6b7280" : "#9ca3af"}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "light" ? "#fff" : "#1f2937",
                  borderColor: theme === "light" ? "#e5e7eb" : "#374151",
                  color: theme === "light" ? "#111827" : "#f3f4f6",
                  borderRadius: "0.5rem",
                  boxShadow: theme === "light" 
                    ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                    : "0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
                }}
                formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Importance"]}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {sortedFeatures.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.importance, index)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 text-sm">
          <p className="text-muted-foreground">
            Feature importance helps identify which input variables have the strongest impact on your
            model's predictions. Focus on high-importance features to improve model performance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
