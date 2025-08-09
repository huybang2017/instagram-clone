"use client";

import { SessionProvider } from "next-auth/react";
import { useState, useEffect, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // Use a mounting state to avoid hydration mismatches that can trigger DevTools errors
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set mounted to true once the component has mounted on the client
    setMounted(true);

    return () => {
      // Cleanup function that can help with DevTools reconnection issues
    };
  }, []);

  // This pattern helps prevent hydration mismatches by rendering content only after client mount
  // but preserves the structure for SEO and initial render
  return (
    <SessionProvider>
      {mounted ? (
        // Render children normally once mounted
        children
      ) : (
        // During SSR or before hydration, render a hidden version to maintain structure
        <div style={{ visibility: "hidden" }} suppressHydrationWarning>
          {children}
        </div>
      )}
    </SessionProvider>
  );
}
