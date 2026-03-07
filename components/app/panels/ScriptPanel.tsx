"use client";

interface ScriptSection {
  id: string;
  title: string;
  items: string[];
  completed: boolean;
}

const scriptSections: ScriptSection[] = [
  {
    id: "1",
    title: "Opening",
    items: [
      "Thank them for their time",
      "Introduce yourself and company",
      "Set agenda for the call",
    ],
    completed: true,
  },
  {
    id: "2",
    title: "Discovery",
    items: [
      "What challenges are you facing?",
      "What solutions have you tried?",
      "What would success look like?",
    ],
    completed: false,
  },
  {
    id: "3",
    title: "Value Proposition",
    items: [
      "Real-time AI guidance",
      "Better objection handling",
      "Increased close rates",
    ],
    completed: false,
  },
  {
    id: "4",
    title: "Closing",
    items: [
      "Address any remaining concerns",
      "Propose next steps",
      "Schedule follow-up",
    ],
    completed: false,
  },
];

export function ScriptPanel() {
  return (
    <div className="h-full flex flex-col bg-background-surface border-r border-border/50">
      {/* Panel Header */}
      <div className="h-14 px-5 border-b border-border/50 flex items-center justify-between bg-background-elevated">
        <h2 className="text-sm font-bold text-text-primary tracking-tight">Script</h2>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-green-primary hover:bg-green-primary/10 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button className="p-1.5 hover:bg-background-surface rounded-lg transition-colors text-text-dim hover:text-text-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Script Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {scriptSections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                section.completed
                  ? "bg-green-primary/20 border-green-primary/40"
                  : "bg-background-elevated border-border/50"
              }`}>
                {section.completed && (
                  <svg className="w-3 h-3 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <div className="ml-7 space-y-2">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2.5 group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-text-dim/40 mt-1.5 group-hover:bg-green-primary transition-colors"></div>
                  <p className="text-sm text-text-secondary leading-relaxed flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
