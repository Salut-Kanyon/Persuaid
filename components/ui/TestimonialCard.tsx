import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  company?: string;
  className?: string;
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  className,
}: TestimonialCardProps) {
  return (
    <div
      className={cn(
        "bg-background-surface border border-border/50 rounded-card p-8 lg:p-10 transition-all duration-500 hover:border-green-primary/30 hover:shadow-card-elevated group relative overflow-hidden",
        className
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10">
        <div className="mb-6">
          <svg
            className="w-10 h-10 text-green-primary/40 group-hover:text-green-primary/60 transition-colors duration-300"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
        </div>
        <p className="text-text-secondary mb-8 leading-relaxed text-lg font-light">
          {quote}
        </p>
        <div className="pt-4 border-t border-border/30">
          <div className="font-bold text-text-primary mb-1">{author}</div>
          <div className="text-text-dim text-sm">
            {role}
            {company && ` at ${company}`}
          </div>
        </div>
      </div>
    </div>
  );
}
