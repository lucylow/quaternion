import EmbeddedLandingPage from '@/components/EmbeddedLandingPage';

/**
 * Landing page that embeds the external landing page HTML from blank-canvas-state.lovable.app
 * This component fetches the HTML at runtime and injects it into the page.
 */
const EnhancedIndex = () => {
  return <EmbeddedLandingPage />;
};

export default EnhancedIndex;
