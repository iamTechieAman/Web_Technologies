'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isChunkLoadError = this.state.error?.name === 'ChunkLoadError' || 
                              this.state.error?.message?.includes('Loading chunk');

      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0B0D17] text-white p-6 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <div className="relative bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
              <AlertTriangle size={48} className="text-red-500 mx-auto" />
            </div>
          </div>
          
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">
            {isChunkLoadError ? 'Module Load Failed' : 'Something went wrong'}
          </h1>
          
          <p className="text-gray-400 max-w-md mb-8 text-sm leading-relaxed">
            {isChunkLoadError 
              ? "We couldn't load a part of the application. This usually happens after an update. A quick reload should fix it!"
              : "An unexpected error occurred. Our team has been notified. Try reloading the page."}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-cyan-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
            >
              <Home size={14} />
              Return Home
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-12 p-4 bg-black/40 border border-white/5 rounded-xl text-left text-[10px] text-red-400 max-w-2xl overflow-auto custom-scrollbar">
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
