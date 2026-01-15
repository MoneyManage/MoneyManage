import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { RefreshCw, AlertTriangle } from 'lucide-react';

// --- Error Boundary Component ---
interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  // Explicitly declaring props to satisfy stricter TS settings if needed
  public readonly props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
      // Clear critical local storage if needed, or just reload
      // localStorage.clear(); // Too aggressive?
      window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
             <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h1>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">
            Ứng dụng gặp sự cố không mong muốn. Đừng lo, dữ liệu của bạn vẫn an toàn.
          </p>
          
          <div className="space-y-3 w-full max-w-xs">
              <button 
                onClick={this.handleReset}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Tải lại ứng dụng</span>
              </button>
              
              <details className="text-xs text-left text-gray-400 border border-gray-200 rounded-lg p-2 bg-white">
                  <summary className="cursor-pointer font-bold mb-1">Chi tiết lỗi (Dành cho kỹ thuật)</summary>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-32">
                      {this.state.error?.toString()}
                  </pre>
              </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
        <LanguageProvider>
          <App />
        </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);