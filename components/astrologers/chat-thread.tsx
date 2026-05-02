"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

export function ChatThread({
  sessionId,
  astrologerName,
}: {
  sessionId: string;
  astrologerName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      if (!error && data) setMessages(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat_messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const supabase = createClient();
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender: "user",
      body: text,
    });
    if (!error) setBody("");
    setSending(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chat with
        </p>
        <p className="font-heading text-lg font-semibold">{astrologerName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.sender === "user"
                ? "ml-8 rounded-2xl rounded-br-md bg-brand px-3 py-2 text-sm text-white"
                : m.sender === "system"
                  ? "mx-auto max-w-md rounded-xl bg-muted px-3 py-2 text-center text-xs text-muted-foreground"
                  : "mr-8 rounded-2xl rounded-bl-md bg-surface-warm px-3 py-2 text-sm ring-1 ring-border"
            }
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <textarea
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
            placeholder="Type your message…"
            rows={2}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            type="button"
            className="h-auto shrink-0 rounded-xl bg-brand px-4"
            disabled={sending || !body.trim()}
            onClick={() => void send()}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
