
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { Brain, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme } = useTheme();

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4
      backdrop-blur-md transition-all duration-300
      ${theme === "light" 
        ? "bg-background/80 shadow-sm border-b border-border/30" 
        : "bg-background/80 shadow-md border-b border-border/20"}
    `}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`
            p-2 rounded-lg transition-all duration-300
            ${theme === "light" 
              ? "bg-secondary shadow-neulight-sm" 
              : "bg-secondary shadow-neudark-sm"}
          `}>
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-semibold tracking-tight">ModelMagic</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">ML & DL Training Tool</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            size="sm" 
            className="flex items-center gap-1 hidden sm:flex"
            onClick={() => console.log("Start Training")}
          >
            <Play className="h-4 w-4" />
            Start Training
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
