"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { MessageSquare, X, Send, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedExercises?: SuggestedExercise[];
}

interface SuggestedExercise {
  name: string;
  slug: string;
  sets: number;
  reps: number;
}

interface PlanContext {
  weekCount?: number;
  currentWeek?: number;
  exercises?: Array<{
    name: string;
    sets?: number;
    reps?: number;
    days?: number[];
  }>;
  weekFocus?: string;
}

interface PlanChatProps {
  planContext?: PlanContext;
  patientName?: string;
  onAddExercise?: (slug: string) => void;
}

export function PlanChat({ planContext, patientName, onAddExercise }: PlanChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/plans/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-demo-role": "pt" },
        body: JSON.stringify({
          message: trimmed,
          planContext,
          patientInfo: patientName ? { name: patientName } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const { data } = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: "assistant",
        content: data.reply,
        suggestedExercises: data.suggestedExercises,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "Sorry, I could not process your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, planContext, patientName]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
        title="AI Exercise Advisor"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[32rem] flex flex-col rounded-2xl shadow-2xl border border-sage-200/60 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <span className="font-medium text-sm">AI Exercise Advisor</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-sm font-medium text-stone-700 mb-1">
              Exercise Advisor
            </p>
            <p className="text-xs text-stone-500">
              Ask about exercises, get recommendations, or discuss plan modifications.
            </p>
            <div className="mt-4 space-y-2 w-full">
              {[
                "What exercises help with lower back pain?",
                "Suggest a progression for this week",
                "Any contraindications I should know about?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-sage-50 hover:bg-sage-100 text-sage-700 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id}>
            <div
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-br-md"
                    : "bg-stone-100 text-stone-800 rounded-bl-md"
                )}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>

            {/* Suggested exercises */}
            {msg.suggestedExercises && msg.suggestedExercises.length > 0 && (
              <div className="mt-2 ml-1 space-y-1">
                <p className="text-xs text-stone-500 font-medium">
                  Suggested exercises:
                </p>
                {msg.suggestedExercises.map((ex) => (
                  <div
                    key={ex.slug}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-teal-50 border border-teal-100"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-teal-800 truncate">
                        {ex.name}
                      </p>
                      <p className="text-[11px] text-teal-600">
                        {ex.sets} sets x {ex.reps} reps
                      </p>
                    </div>
                    {onAddExercise && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-teal-600 hover:text-teal-800 hover:bg-teal-100 flex-shrink-0"
                        onClick={() => onAddExercise(ex.slug)}
                        title={`Add ${ex.name} to plan`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-stone-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-stone-200/60 bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about exercises..."
            rows={1}
            maxLength={2000}
            disabled={isLoading}
            className={cn(
              "flex-1 resize-none rounded-xl border border-stone-200/60 bg-white px-3 py-2",
              "text-sm text-stone-800 placeholder:text-stone-400",
              "focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500",
              "disabled:bg-stone-50 disabled:cursor-not-allowed",
              "transition-all duration-200"
            )}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
              input.trim() && !isLoading
                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
