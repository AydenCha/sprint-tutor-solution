import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 *
 * Features:
 * - Catches all React component errors
 * - Displays user-friendly error UI
 * - Provides options to reload or retry
 * - Logs errors to console for debugging
 *
 * @component
 * @example
 * // Wrap your app or specific sections
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @see {@link https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary}
 */

/**
 * ErrorBoundary component props
 */
interface ErrorBoundaryProps {
  /** Child components to wrap with error boundary */
  children: ReactNode;
}

/**
 * ErrorBoundary component state
 */
interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The caught error object */
  error: Error | null;
}

/**
 * Error Boundary Component Class
 *
 * Implements React's error boundary lifecycle methods to catch and handle errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Initial component state
   */
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  /**
   * Static lifecycle method called when a child component throws an error
   * Updates state to trigger fallback UI rendering
   *
   * @param {Error} error - The error that was thrown
   * @returns {ErrorBoundaryState} New state with error information
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error has been caught
   * Logs error details to console for debugging
   *
   * @param {Error} error - The error that was thrown
   * @param {ErrorInfo} errorInfo - Additional error information including component stack
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console for development debugging
    console.error('Uncaught error:', error, errorInfo);

    // In production, you might want to send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  /**
   * Reloads the entire page
   * Used as a recovery mechanism for critical errors
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Resets the error boundary state
   * Attempts to re-render the component tree
   */
  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  /**
   * Renders the component
   * Shows error UI if an error was caught, otherwise renders children
   *
   * @returns {ReactNode} Error UI or children
   */
  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center"
                role="img"
                aria-label="오류 아이콘"
              >
                <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
              </div>
              <CardTitle>오류가 발생했습니다</CardTitle>
              <CardDescription>
                애플리케이션에서 예기치 않은 오류가 발생했습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-3 bg-muted rounded-lg" role="alert">
                  <p className="text-sm font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  aria-label="페이지 새로고침"
                >
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  페이지 새로고침
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleRetry}
                  className="flex-1"
                  aria-label="다시 시도"
                >
                  다시 시도
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                문제가 계속되면 브라우저 콘솔을 확인하거나 관리자에게 문의하세요.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

