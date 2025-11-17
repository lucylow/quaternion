import { useEffect, useRef, useState } from 'react';

interface EmbeddedLandingPageProps {
  url?: string;
  className?: string;
}

/**
 * Component that fetches and embeds external HTML content.
 * Fetches HTML from the specified URL and injects it into a container.
 * 
 * Note: This requires CORS to be enabled on the target server. If CORS is not enabled,
 * the fetch will fail. In that case, you may need to:
 * 1. Use a proxy server to fetch the content
 * 2. Request CORS headers from the target server
 * 3. Use a server-side solution to fetch and serve the HTML
 * 
 * Security: This component directly injects HTML using innerHTML. If you're embedding
 * untrusted content, consider using DOMPurify to sanitize the HTML first.
 * 
 * @param url - The URL to fetch HTML from (defaults to blank-canvas-state.lovable.app)
 * @param className - Optional CSS classes for the container
 */
const EmbeddedLandingPage = ({ 
  url = 'https://blank-canvas-state.lovable.app/',
  className = ''
}: EmbeddedLandingPageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndEmbed = async () => {
      if (!containerRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(url);
        
        if (!resp.ok) {
          throw new Error(`Network response not OK: ${resp.status}`);
        }

        const html = await resp.text();

        // Extract the body content (or use the full HTML if it's a complete document)
        let content = html;
        
        // If the HTML contains a body tag, extract its content
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) {
          content = bodyMatch[1];
        }

        // Fix relative URLs in the content to be absolute
        // This handles img src, link href, script src, etc.
        const baseUrl = new URL(url);
        content = content.replace(
          /(href|src|action)=["']([^"']+)["']/gi,
          (match, attr, value) => {
            // Skip if already absolute URL
            if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('//')) {
              return match;
            }
            // Skip data: and javascript: URLs
            if (value.startsWith('data:') || value.startsWith('javascript:')) {
              return match;
            }
            // Convert relative URL to absolute
            try {
              const absoluteUrl = new URL(value, baseUrl).href;
              return `${attr}="${absoluteUrl}"`;
            } catch {
              return match;
            }
          }
        );

        // Inject the content into our container
        if (containerRef.current) {
          containerRef.current.innerHTML = content;
          
          // Also try to copy over any styles from the head
          const headMatch = html.match(/<head[^>]*>([\s\S]*)<\/head>/i);
          if (headMatch) {
            const headContent = headMatch[1];
            const styleMatch = headContent.match(/<style[^>]*>([\s\S]*)<\/style>/gi);
            if (styleMatch) {
              styleMatch.forEach(styleTag => {
                const styleContent = styleTag.replace(/<\/?style[^>]*>/gi, '');
                const styleElement = document.createElement('style');
                styleElement.textContent = styleContent;
                document.head.appendChild(styleElement);
              });
            }
            
            // Also handle link tags for external stylesheets
            const linkMatch = headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi);
            if (linkMatch) {
              linkMatch.forEach(linkTag => {
                const linkElement = document.createElement('link');
                linkElement.rel = 'stylesheet';
                const hrefMatch = linkTag.match(/href=["']([^"']+)["']/i);
                if (hrefMatch) {
                  let href = hrefMatch[1];
                  // Convert relative URLs to absolute
                  if (!href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('//')) {
                    try {
                      href = new URL(href, baseUrl).href;
                    } catch {
                      // If URL parsing fails, use as-is
                    }
                  }
                  linkElement.href = href;
                  // Check if this stylesheet is already loaded
                  const existing = document.querySelector(`link[href="${href}"]`);
                  if (!existing) {
                    document.head.appendChild(linkElement);
                  }
                }
              });
            }
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch landing HTML:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; font-family: sans-serif; text-align: center;">
              <h2 style="color: #ef4444; margin-bottom: 1rem;">Failed to Load Landing Page</h2>
              <p style="color: #6b7280; margin-bottom: 1.5rem;">${err instanceof Error ? err.message : 'Unknown error'}</p>
              <a 
                href="${url}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="color: #3b82f6; text-decoration: underline;"
              >
                Go to landing site
              </a>
            </div>
          `;
        }
      }
    };

    fetchAndEmbed();
  }, [url]);

  return (
    <div className={className} style={{ width: '100%', minHeight: '100vh' }}>
      {loading && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            fontSize: '1.125rem',
            color: '#6b7280'
          }}
        >
          Loading landing page…
        </div>
      )}
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          minHeight: loading ? '0' : '100vh',
          display: loading ? 'none' : 'block'
        }}
      />
    </div>
  );
};

export default EmbeddedLandingPage;

