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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Script Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {scriptSections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${
                section.completed
                  ? "bg-green-primary/10 border-green-primary/18"
                  : "bg-background-elevated/30 border-border/18"
              }`}>
                {section.completed && (
                  <svg className="w-3.5 h-3.5 text-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h3 className="text-xs font-medium text-text-dim/60 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>
            <div className="ml-9 space-y-3">
              {section.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-text-dim/15 mt-2 group-hover:bg-green-primary/50 transition-colors duration-300"></div>
                  <p className="text-sm text-text-secondary/85 leading-relaxed flex-1">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
