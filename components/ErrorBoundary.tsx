import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Erro na Aplicação</h1>
            <p className="text-gray-700 mb-4">
              Desculpe, ocorreu um erro inesperado. Por favor, tire uma captura de tela desta mensagem e envie para o suporte.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <h2 className="font-bold text-red-800 mb-2">Mensagem de Erro:</h2>
              <pre className="text-sm text-red-700 whitespace-pre-wrap break-words">
                {this.state.error?.toString()}
              </pre>
            </div>

            {this.state.errorInfo && (
              <details className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
                <summary className="font-bold text-gray-800 cursor-pointer">
                  Stack Trace (clique para expandir)
                </summary>
                <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap break-words overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#D4AF37] hover:bg-[#b8952b] text-[#0F2820] py-3 rounded font-bold uppercase"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
