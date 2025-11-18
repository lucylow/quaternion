import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, Component, ReactNode, ErrorInfo } from "react";
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
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Error boundary to catch lazy loading errors
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Route loading error:", error, errorInfo);
    // You could also send this to an error reporting service here
  }

  handleReload = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center max-w-md px-4">
            <h1 className="text-2xl font-bold mb-4">Failed to load page</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message ||
                "An error occurred while loading this page"}
            </p>
            {typeof window !== "undefined" && (
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                type="button"
              >
                Reload Page
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Create QueryClient with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

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
