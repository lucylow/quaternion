import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";

// Lazy load routes for better initial load performance
const Game = lazy(() => import("./pages/Game"));
const QuaternionGame = lazy(() => import("./pages/QuaternionGame"));
const Lobby = lazy(() => import("./pages/Lobby"));
const About = lazy(() => import("./pages/About"));
const Commanders = lazy(() => import("./pages/Commanders"));
const HowToPlay = lazy(() => import("./pages/HowToPlay"));
const AIFeatures = lazy(() => import("./pages/AIFeatures"));
const Replays = lazy(() => import("./pages/Replays"));
const TechTree = lazy(() => import("./pages/TechTree"));
const MapGenerator = lazy(() => import("./pages/MapGenerator"));
const CosmeticShop = lazy(() => import("./pages/CosmeticShop"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BattlePass = lazy(() => import("./pages/BattlePass"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
              <Route path="/game" element={<Game />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/quaternion" element={<QuaternionGame />} />
              <Route path="/about" element={<About />} />
              <Route path="/commanders" element={<Commanders />} />
              <Route path="/how-to-play" element={<HowToPlay />} />
              <Route path="/ai-features" element={<AIFeatures />} />
              <Route path="/replays" element={<Replays />} />
              <Route path="/tech-tree" element={<TechTree />} />
              <Route path="/map-generator" element={<MapGenerator />} />
              <Route path="/shop" element={<CosmeticShop />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/battle-pass" element={<BattlePass />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
