import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const fallbackTitle = this.props.title || "Đã xảy ra lỗi không mong muốn";
      const fallbackDescription =
        this.props.description ||
        "Hệ thống gặp sự cố trong quá trình xử lý. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.";

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-background border border-destructive/20 rounded-lg shadow-sm my-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {fallbackTitle}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {fallbackDescription}
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-muted rounded text-left text-xs font-mono overflow-x-auto max-h-28 text-muted-foreground border">
                {this.state.error.message}
              </div>
            )}
            <div className="pt-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại giao diện
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
