import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, Component, ReactNode } from "react";
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

// Error boundary to catch lazy loading errors
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Route loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Failed to load page</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An error occurred while loading this page'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
