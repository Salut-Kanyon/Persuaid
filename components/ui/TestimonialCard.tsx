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
        "bg-background-surface border border-border rounded-card p-6 lg:p-8",
        className
      )}
    >
      <div className="mb-4">
        <svg
          className="w-8 h-8 text-green-primary opacity-50"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.432.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
        </svg>
      </div>
      <p className="text-text-secondary mb-6 leading-relaxed text-lg">
        {quote}
      </p>
      <div>
        <div className="font-semibold text-text-primary">{author}</div>
        <div className="text-text-dim text-sm">
          {role}
          {company && ` at ${company}`}
        </div>
      </div>
    </div>
  );
}
