
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModelProvider } from "@/context/ModelContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModelSidebar } from "@/components/ModelSidebar";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <ModelProvider>
          <Toaster />
          <Sonner position="top-center" />
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <ModelSidebar />
              <main className="flex-1">
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </main>
            </div>
          </SidebarProvider>
        </ModelProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
