import React from "react";

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen text-gray-500 dark:text-gray-400 p-8">
          <span className="text-4xl mb-4">⚠️</span>
          <h2 className="text-lg font-semibold mb-2">应用出现了错误</h2>
          <p className="text-xs mb-4 text-center max-w-md">{this.state.error?.message || "未知错误"}</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
