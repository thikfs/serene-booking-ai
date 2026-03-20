import { useMemo, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  text: string;
  sender: "bot" | "user";
}

type ChatRequestPayload = {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

const quickReplies = [
  "Check availability",
  "Our specialties",
  "Emergency contacts",
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Welcome to Serenity Minds! 🌿 How can I help you today?",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const chatEndpoint = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (!supabaseUrl) return undefined;
    return `${supabaseUrl}/functions/v1/chat-handler`;
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    if (!chatEndpoint) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "Chat is not configured yet (missing VITE_SUPABASE_URL).", sender: "bot" },
      ]);
      return;
    }

    const userMsg: Message = { id: Date.now(), text, sender: "user" };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    const payload: ChatRequestPayload = {
      messages: nextMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    };

    try {
      const res = await fetch(chatEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as { reply?: string; error?: string } | null;
      const reply =
        data?.reply ??
        (res.ok ? "Sorry, I couldn't process that request." : `Chat error: ${data?.error ?? res.status}`);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: reply, sender: "bot" },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: "Network error. Please try again.", sender: "bot" },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Chat with Therapy Assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat popup */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
          {/* Header */}
          <div className="bg-primary px-4 py-3 text-primary-foreground">
            <p className="font-semibold">Therapy Assistant</p>
            <p className="text-xs opacity-80">We're here to help</p>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender === "bot"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Quick replies */}
          <div className="flex flex-wrap gap-1.5 border-t px-3 pt-2">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                className="rounded-full border bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-accent"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Type a message..."
              className="text-sm"
            />
            <Button size="icon" onClick={() => sendMessage(input)} disabled={sending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
