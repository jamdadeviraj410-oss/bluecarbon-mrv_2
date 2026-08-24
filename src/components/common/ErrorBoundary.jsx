import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#001e40] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-xl w-full bg-[#002b5b] border border-blue-400/30 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <span className="material-symbols-outlined text-4xl">warning</span>
              <h1 className="text-2xl font-bold m-0 text-white">Application Encountered an Issue</h1>
            </div>
            
            <p className="text-blue-100/80 text-sm mb-6">
              A runtime rendering error occurred. You can reload the page or return to the dashboard.
            </p>

            <div className="bg-[#001938] rounded-xl p-4 mb-6 border border-blue-900/60 overflow-auto max-h-48 text-xs font-mono text-rose-300">
              {this.state.error?.toString()}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#001e40] font-bold text-sm transition-all shadow-md cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/20 cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
