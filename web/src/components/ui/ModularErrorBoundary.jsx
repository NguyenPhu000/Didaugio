import React from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

class InnerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ModularErrorBoundary] Caught exception:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const fallbackTitle = this.props.title || "Module xảy ra lỗi không mong muốn";
      const fallbackDescription =
        this.props.description ||
        "Giao diện này gặp sự cố tạm thời. Vui lòng nhấn thử lại để khôi phục.";

      return (
        <div className="min-h-[250px] w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl my-4">
          <div className="max-w-md w-full text-center space-y-3">
            <div className="w-12 h-12 mx-auto bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              {fallbackTitle}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {fallbackDescription}
            </p>
            {this.state.error?.message && (
              <div className="p-2 bg-white dark:bg-zinc-950 rounded text-left text-[11px] font-mono overflow-x-auto max-h-24 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-1">
              <Button
                onClick={this.handleReset}
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Thử lại module
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ModularErrorBoundary({ children, title, description }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <InnerErrorBoundary
          onReset={reset}
          title={title}
          description={description}
        >
          {children}
        </InnerErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

export default ModularErrorBoundary;
