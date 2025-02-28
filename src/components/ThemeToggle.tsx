
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = () => {
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center
          transition-all duration-500 transform
          ${theme === "light" 
            ? "bg-secondary shadow-neulight-sm hover:shadow-neulight" 
            : "bg-secondary shadow-neudark-sm hover:shadow-neudark"}
          ${isAnimating ? "scale-90" : "scale-100"}
        `}
        aria-label="Toggle theme"
      >
        <div className="relative w-6 h-6">
          <Sun 
            className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${
              theme === "light" 
                ? "opacity-100 rotate-0" 
                : "opacity-0 rotate-90"
            }`} 
          />
          <Moon 
            className={`absolute inset-0 h-6 w-6 transition-all duration-500 ${
              theme === "dark" 
                ? "opacity-100 rotate-0" 
                : "opacity-0 -rotate-90"
            }`} 
          />
        </div>
      </button>
    </div>
  );
}
