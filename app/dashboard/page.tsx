import { LiveSession } from "@/components/app/LiveSession";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Home</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Your live session and AI copilot
        </p>
      </header>
      <div className="flex-1 min-h-0">
        <LiveSession />
      </div>
    </div>
  );
}
