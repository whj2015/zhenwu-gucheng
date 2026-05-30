import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: string;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: '' };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error: error.message };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[IronEcho] 未捕获异常:', error, info.componentStack);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-[#0a0c10] flex items-center justify-center">
                    <div className="max-w-md w-full mx-4 bg-[#121418] border border-red-500/30 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-slate-200 mb-2">程序出现异常</h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            部分功能暂时不可用，请刷新页面重试。
                        </p>
                        <pre className="text-left text-xs text-red-400/70 bg-black/40 rounded-lg p-4 mb-6 overflow-auto max-h-32 font-mono">
                            {this.state.error}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg tracking-wider transition-all"
                        >
                            刷新页面
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
