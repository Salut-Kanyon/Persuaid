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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex gap-4 group"
          >
            <div
              className={message.speaker === "user"
                ? "w-12 h-12 rounded-3xl bg-gradient-to-br from-green-primary/20 to-green-primary/8 border border-green-primary/15 flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                : "w-12 h-12 rounded-3xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0 shadow-sm"
              }
            >
              <span
                className={message.speaker === "user"
                  ? "text-green-primary text-xs font-semibold"
                  : "text-text-muted text-xs font-semibold"
                }
              >
                {message.initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-xs font-medium text-text-primary">{message.name}</span>
                <span className="text-[10px] text-text-dim/60 font-mono tracking-wider">{message.time}</span>
              </div>
              <p className="text-sm text-text-secondary/90 leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-3xl bg-background-elevated/40 border border-border/20 flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-text-muted text-xs font-semibold">SC</span>
            </div>
            <div className="flex-1">
              <div className="flex gap-1.5 mt-7">
                <div className="w-2 h-2 bg-text-dim/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-text-dim/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-text-dim/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
