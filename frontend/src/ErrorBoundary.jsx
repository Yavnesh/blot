import React from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Global UI Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center shadow-2xl">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-white mb-4">Pipeline Crash Detected</h2>
                        <p className="text-slate-400 mb-8">
                            A critical anomaly occurred in the UI or an async task crashed unexpectedly.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Reload Subsystem
                            </button>
                            <Link
                                to="/"
                                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Return Home
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
