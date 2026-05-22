import React from 'react';
import { CircleX, RefreshCw, House } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Error Boundary Component
 * Bắt lỗi React và hiển thị fallback UI
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null, 
            errorInfo: null 
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
                    <div className="max-w-md w-full text-center">
                        {/* Icon */}
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CircleX size={48} className="text-red-400" />
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-black text-gray-900 mb-4">
                            Oops! Có lỗi xảy ra
                        </h1>

                        {/* Description */}
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Chúng tôi đã ghi nhận lỗi này. Vui lòng thử tải lại trang hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                        </p>

                        {/* Error Details (dev only) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-8 p-4 bg-red-50 rounded-xl border border-red-100 text-left">
                                <p className="text-xs font-bold text-red-600 mb-2">Error Details:</p>
                                <pre className="text-[10px] text-red-500 overflow-auto max-h-32 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                    {'\n\n'}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                <RefreshCw size={16} />
                                Tải lại trang
                            </button>
                            <Link
                                to="/"
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all"
                            >
                                <House size={16} />
                                Về trang chủ
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

/**
 * Async Error Handler
 * Wrapper cho async functions để bắt lỗi
 */
export const withErrorHandler = (asyncFn, onError) => {
    return async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            console.error('Async function error:', error);
            if (onError) {
                onError(error);
            }
            throw error;
        }
    };
};

/**
 * useErrorHandler Hook
 * Custom hook để xử lý lỗi trong components
 */
export const useErrorHandler = () => {
    const [error, setError] = React.useState(null);

    const handleError = React.useCallback((err) => {
        console.error('Error caught:', err);
        setError(err);
    }, []);

    const clearError = React.useCallback(() => {
        setError(null);
    }, []);

    return { error, handleError, clearError };
};
