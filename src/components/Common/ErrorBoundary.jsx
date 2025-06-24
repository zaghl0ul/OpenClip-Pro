import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { motion } from 'framer-motion'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: Date.now().toString()
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console and potentially to a logging service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo)
  }

  reportError = (error, errorInfo) => {
    // In production, you would send this to your error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    }

    // For now, just log it
    console.error('Error Report:', errorReport)

    // TODO: Send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // Sentry.captureException(error, { extra: errorReport })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleToggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            <div className="glass-card p-8 text-center">
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 bg-error/10 rounded-full flex items-center justify-center"
              >
                <AlertTriangle className="w-10 h-10 text-error" />
              </motion.div>

              {/* Error Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-2xl font-bold text-white mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-400 mb-6">
                  We encountered an unexpected error. Don't worry, our team has been notified.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
              >
                <button
                  onClick={this.handleReload}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </motion.div>

              {/* Error Details Toggle */}
              {(this.state.error || this.state.errorInfo) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={this.handleToggleDetails}
                    className="text-sm text-gray-500 hover:text-gray-400 transition-colors flex items-center gap-1 mx-auto mb-4"
                  >
                    <Bug className="w-4 h-4" />
                    {this.state.showDetails ? 'Hide' : 'Show'} Technical Details
                  </button>

                  {this.state.showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-gray-900 rounded-lg p-4 text-left text-xs font-mono overflow-auto max-h-60"
                    >
                      <div className="mb-4">
                        <h3 className="text-error font-semibold mb-2">Error:</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {this.state.error && this.state.error.toString()}
                        </p>
                      </div>
                      
                      {this.state.errorInfo && (
                        <div>
                          <h3 className="text-error font-semibold mb-2">Component Stack:</h3>
                          <p className="text-gray-300 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-gray-500">
                          Error ID: {this.state.errorId}
                        </p>
                        <p className="text-gray-500">
                          Time: {new Date().toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Help Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-gray-500 mt-6"
              >
                <p>
                  If this problem persists, please contact support with Error ID: {this.state.errorId}
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary