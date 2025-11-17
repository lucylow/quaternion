import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import Index from "./pages/Index";
import {
  LazyGame,
  LazyQuaternionGame,
  LazyLobby,
  LazyAbout,
  LazyCommanders,
  LazyHowToPlay,
  LazyAIFeatures,
  LazyReplays,
  LazyTechTree,
  LazyMapGenerator,
  LazyCosmeticShop,
  LazyCheckout,
  LazyBattlePass,
  LazyNotFound,
} from "./routes";

// Loading fallback component
const RouteLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-h-screen w-full overflow-x-hidden">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/game" element={<LazyGame />} />
              <Route path="/lobby" element={<LazyLobby />} />
              <Route path="/quaternion" element={<LazyQuaternionGame />} />
              <Route path="/about" element={<LazyAbout />} />
              <Route path="/commanders" element={<LazyCommanders />} />
              <Route path="/how-to-play" element={<LazyHowToPlay />} />
              <Route path="/ai-features" element={<LazyAIFeatures />} />
              <Route path="/replays" element={<LazyReplays />} />
              <Route path="/tech-tree" element={<LazyTechTree />} />
              <Route path="/map-generator" element={<LazyMapGenerator />} />
              <Route path="/shop" element={<LazyCosmeticShop />} />
              <Route path="/checkout" element={<LazyCheckout />} />
              <Route path="/battle-pass" element={<LazyBattlePass />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<LazyNotFound />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
