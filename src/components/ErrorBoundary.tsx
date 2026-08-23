import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: string | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: unknown) {
    return { error: err instanceof Error ? err.message + '\n' + (err as Error).stack : String(err) };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-950 p-6 flex flex-col gap-4">
          <h2 className="text-red-400 font-black text-lg">Error</h2>
          <pre className="text-red-300 text-xs bg-gray-900 p-4 rounded-xl overflow-auto whitespace-pre-wrap">
            {this.state.error}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-amber-500 text-gray-950 font-bold rounded-xl w-fit"
          >
            Cuba Semula
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
