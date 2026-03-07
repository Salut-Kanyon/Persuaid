"use client";

import { cn } from "@/lib/utils";

interface ProductPreviewProps {
  className?: string;
}

export function ProductPreview({ className }: ProductPreviewProps) {
  return (
    <div
      className={cn(
        "bg-background-surface border border-border/50 rounded-card overflow-hidden shadow-2xl backdrop-blur-sm",
        className
      )}
    >
      {/* Window Chrome */}
      <div className="bg-background-elevated border-b border-border/50 px-5 py-3.5 flex items-center gap-3">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/60 hover:bg-red-500/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/60 hover:bg-yellow-500/80 transition-colors"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/60 hover:bg-green-500/80 transition-colors"></div>
        </div>
        <div className="flex-1 text-center">
          <span className="text-text-dim text-xs font-mono">persuaid.app/call/abc123</span>
        </div>
        <div className="w-16"></div>
      </div>

      {/* Main UI Grid */}
      <div className="p-5 grid grid-cols-12 gap-5 h-[500px] lg:h-[650px]">
        {/* Transcript Panel - Left */}
        <div className="col-span-12 lg:col-span-7 bg-background rounded-lg border border-border/50 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/30">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2.5 tracking-tight">
              <span className="relative">
                <span className="w-2.5 h-2.5 bg-green-primary rounded-full animate-pulse"></span>
                <span className="absolute inset-0 w-2.5 h-2.5 bg-green-primary rounded-full animate-ping opacity-75"></span>
              </span>
              Live Transcript
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-dim font-mono">02:34</span>
              <div className="w-1 h-1 bg-green-primary rounded-full"></div>
            </div>
          </div>

          <div className="space-y-5">
            {/* Message 1 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-primary/30 to-green-primary/10 border border-green-primary/20 flex items-center justify-center flex-shrink-0 group-hover:border-green-primary/40 transition-colors">
                <span className="text-green-primary text-xs font-bold">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-xs font-semibold text-text-primary">John Doe</span>
                  <span className="text-[10px] text-text-dim font-mono">10:23:14</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Hi Sarah, thanks for taking the time today. I wanted to discuss how we can help streamline your sales process.
                </p>
              </div>
            </div>

            {/* Message 2 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-background-elevated border border-border/50 flex items-center justify-center flex-shrink-0 group-hover:border-border transition-colors">
                <span className="text-text-muted text-xs font-bold">SC</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-xs font-semibold text-text-primary">Sarah Chen</span>
                  <span className="text-[10px] text-text-dim font-mono">10:24:32</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Sure, I'm interested. We've been looking at solutions but haven't found the right fit yet. What makes your approach different?
                </p>
              </div>
            </div>

            {/* Message 3 */}
            <div className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-primary/30 to-green-primary/10 border border-green-primary/20 flex items-center justify-center flex-shrink-0 group-hover:border-green-primary/40 transition-colors">
                <span className="text-green-primary text-xs font-bold">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="text-xs font-semibold text-text-primary">John Doe</span>
                  <span className="text-[10px] text-text-dim font-mono">10:25:08</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Great question. Our platform provides real-time AI guidance during calls, so you always know what to say next. It's like having a sales coach in your ear.
                </p>
              </div>
            </div>

            {/* Typing indicator */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-background-elevated border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-text-muted text-xs font-semibold">SC</span>
              </div>
              <div className="flex-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel - Right */}
        <div className="col-span-12 lg:col-span-5 bg-background rounded-lg border border-green-primary/30 shadow-glow-sm p-5 overflow-y-auto relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-primary/50 to-transparent"></div>
          <h3 className="text-sm font-bold text-text-primary mb-5 flex items-center gap-2.5 tracking-tight">
            <div className="w-5 h-5 rounded bg-green-primary/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            AI Suggestions
          </h3>

          <div className="space-y-3">
            <div className="bg-green-primary/10 border border-green-primary/30 rounded-lg p-4 relative overflow-hidden group hover:bg-green-primary/15 transition-colors">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-primary"></div>
              <div className="flex items-start gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-green-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-green-accent mb-1.5">Objection Handling</div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Address her concern about finding the right fit. Ask: "What specific challenges have you faced with previous solutions?"
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-background-elevated border border-border/50 rounded-lg p-4 hover:border-border transition-colors">
              <div className="text-xs font-semibold text-text-primary mb-1.5">Next Step</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Share a relevant case study that matches her industry. Mention ROI metrics.
              </p>
            </div>

            <div className="bg-background-elevated border border-border/50 rounded-lg p-4 hover:border-border transition-colors">
              <div className="text-xs font-semibold text-text-primary mb-1.5">Talking Point</div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Emphasize the real-time guidance feature. This addresses her need for immediate support.
              </p>
            </div>
          </div>
        </div>

        {/* Script Panel - Bottom Left */}
        <div className="col-span-12 lg:col-span-6 bg-background rounded-lg border border-border/50 p-5 overflow-y-auto">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/30">
            <h3 className="text-sm font-bold text-text-primary tracking-tight">Script</h3>
            <button className="text-xs font-medium text-green-primary hover:text-green-accent transition-colors flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-text-dim mb-2">Opening</div>
            <div className="bg-background-elevated rounded p-2 text-xs text-text-secondary">
              ✓ Thank them for their time<br />
              ✓ Introduce yourself and company<br />
              ✓ Set agenda for the call
            </div>

            <div className="text-xs text-text-dim mt-4 mb-2">Discovery</div>
            <div className="bg-background-elevated rounded p-2 text-xs text-text-secondary">
              • What challenges are you facing?<br />
              • What solutions have you tried?<br />
              • What would success look like?
            </div>

            <div className="text-xs text-text-dim mt-4 mb-2">Value Prop</div>
            <div className="bg-background-elevated rounded p-2 text-xs text-text-secondary">
              → Real-time AI guidance<br />
              → Better objection handling<br />
              → Increased close rates
            </div>
          </div>
        </div>

        {/* Notes Panel - Bottom Right */}
        <div className="col-span-12 lg:col-span-6 bg-background rounded-lg border border-border/50 p-5 overflow-y-auto">
          <h3 className="text-sm font-bold text-text-primary mb-5 pb-3 border-b border-border/30 tracking-tight">Notes</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 w-4 h-4 text-green-primary border-border rounded" defaultChecked />
              <div className="flex-1">
                <div className="text-xs text-text-secondary">Interested in real-time guidance</div>
                <div className="text-xs text-text-dim mt-1">Tagged: Interest</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 w-4 h-4 text-green-primary border-border rounded" />
              <div className="flex-1">
                <div className="text-xs text-text-secondary">Has tried other solutions before</div>
                <div className="text-xs text-text-dim mt-1">Tagged: Objection</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 w-4 h-4 text-green-primary border-border rounded" />
              <div className="flex-1">
                <div className="text-xs text-text-secondary">Follow up: Send case study</div>
                <div className="text-xs text-text-dim mt-1">Tagged: Action</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-1 bg-green-primary/10 text-green-accent text-xs rounded">Interest</span>
                <span className="px-2 py-1 bg-background-elevated text-text-muted text-xs rounded">Objection</span>
                <span className="px-2 py-1 bg-background-elevated text-text-muted text-xs rounded">Action</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
