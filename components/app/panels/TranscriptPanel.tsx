"use client";

import { useState, useEffect } from "react";

interface Message {
  id: string;
  speaker: "user" | "prospect";
  name: string;
  initials: string;
  time: string;
  text: string;
  isTyping?: boolean;
}

const initialMessages: Message[] = [
  {
    id: "1",
    speaker: "user",
    name: "John Doe",
    initials: "JD",
    time: "10:23:14",
    text: "Hi Sarah, thanks for taking the time today. I wanted to discuss how we can help streamline your sales process.",
  },
  {
    id: "2",
    speaker: "prospect",
    name: "Sarah Chen",
    initials: "SC",
    time: "10:24:32",
    text: "Sure, I'm interested. We've been looking at solutions but haven't found the right fit yet. What makes your approach different?",
  },
  {
    id: "3",
    speaker: "user",
    name: "John Doe",
    initials: "JD",
    time: "10:25:08",
    text: "Great question. Our platform provides real-time AI guidance during calls, so you always know what to say next. It's like having a sales coach in your ear.",
  },
];

export function TranscriptPanel() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsTyping(true);
        setTimeout(() => {
          const newMessage: Message = {
            id: Date.now().toString(),
            speaker: Math.random() > 0.5 ? "prospect" : "user",
            name: Math.random() > 0.5 ? "Sarah Chen" : "John Doe",
            initials: Math.random() > 0.5 ? "SC" : "JD",
            time: new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            text: Math.random() > 0.5
              ? "That sounds interesting. Can you tell me more about the integration capabilities?"
              : "Absolutely. We integrate with all major CRM platforms and can sync data in real-time.",
          };
          setMessages((prev) => [...prev, newMessage]);
          setIsTyping(false);
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-background-surface border-r border-border/50">
      {/* Panel Header */}
      <div className="h-14 px-5 border-b border-border/50 flex items-center justify-between bg-background-elevated/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-green-primary rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-primary rounded-full animate-ping opacity-75"></div>
          </div>
          <h2 className="text-sm font-bold text-text-primary tracking-tight">Live Transcript</h2>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-background-surface rounded-lg transition-colors text-text-dim hover:text-green-accent group">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="p-1.5 hover:bg-background-surface rounded-lg transition-colors text-text-dim hover:text-green-accent">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.speaker === "user" ? "flex gap-4 group" : "flex gap-4 group"}
          >
            <div
              className={message.speaker === "user"
                ? "w-10 h-10 rounded-lg bg-gradient-to-br from-green-primary/30 to-green-primary/10 border border-green-primary/20 flex items-center justify-center flex-shrink-0"
                : "w-10 h-10 rounded-lg bg-background-elevated border border-border/50 flex items-center justify-center flex-shrink-0"
              }
            >
              <span
                className={message.speaker === "user"
                  ? "text-green-primary text-xs font-bold"
                  : "text-text-muted text-xs font-bold"
                }
              >
                {message.initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xs font-semibold text-text-primary">{message.name}</span>
                <span className="text-[10px] text-text-dim font-mono">{message.time}</span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-background-elevated border border-border/50 flex items-center justify-center flex-shrink-0">
              <span className="text-text-muted text-xs font-bold">SC</span>
            </div>
            <div className="flex-1">
              <div className="flex gap-1.5 mt-6">
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
