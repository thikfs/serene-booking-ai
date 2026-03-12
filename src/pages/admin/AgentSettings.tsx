import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AgentSettings() {
  const [prompt, setPrompt] = useState(
    "You are a warm, empathetic therapy assistant for Serenity Minds. Greet every visitor with compassion and guide them to the right service. Always use a calming, professional tone."
  );
  const [fullBooking, setFullBooking] = useState(false);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Agent Persona</h1>
      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              placeholder="Define the agent's personality and instructions..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Label htmlFor="mode" className="text-sm text-muted-foreground">
                Information Only
              </Label>
              <Switch id="mode" checked={fullBooking} onCheckedChange={setFullBooking} />
              <Label htmlFor="mode" className="text-sm font-medium">
                Full Booking
              </Label>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {fullBooking
                ? "The agent can schedule appointments on behalf of clients."
                : "The agent provides information only; clients must book manually."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
