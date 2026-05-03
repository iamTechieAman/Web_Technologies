import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

export const metadata: Metadata = {
  title: 'CodeVisualizer — Master DSA with Visual Debugging & AI',
  description: 'The ultimate interactive algorithm visualizer. 3000+ LeetCode problems, real-time execution, and AI-powered step tracing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const app = (
    <ThemeProvider>
      <GlobalErrorBoundary>{children}</GlobalErrorBoundary>
    </ThemeProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
          <ClerkProvider>{app}</ClerkProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
