import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FDF8F4',
                    padding: '24px'
                }}>
                    <div style={{
                        background: '#FFF8F0',
                        borderRadius: '24px',
                        padding: '40px 32px',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(45,24,16,0.08)',
                        border: '2px solid #E8E3DB'
                    }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: '#FEE2E2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            fontSize: '32px'
                        }}>
                            🚨
                        </div>
                        <h2 style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: '#2D1810',
                            margin: '0 0 8px'
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            color: '#8B7355',
                            margin: '0 0 24px',
                            lineHeight: 1.5
                        }}>
                            Please refresh the page or try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '14px',
                                padding: '14px 32px',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 16px rgba(201,123,75,0.3)',
                                width: '100%'
                            }}
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
