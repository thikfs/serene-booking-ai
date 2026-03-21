import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchAgentSettings, upsertAgentSettings } from "@/lib/supabaseApi";

export default function AgentSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: fetchAgentSettings,
    enabled: isSupabaseConfigured,
  });

  const [prompt, setPrompt] = useState(
    "You are a receptionist. Check availability before promising time slots. Be concise and professional.",
  );
  const [fullBooking, setFullBooking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setPrompt(
      data.system_prompt ??
        "You are a receptionist. Check availability before promising time slots. Be concise and professional.",
    );
    setFullBooking(Boolean(data.full_booking));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: upsertAgentSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agent-settings"] }),
  });

  const handleSave = async () => {
    setFormError(null);
    if (!prompt.trim()) {
      setFormError("System prompt cannot be empty.");
      return;
    }
    try {
      await saveMutation.mutateAsync({
        id: data?.id,
        system_prompt: prompt.trim(),
        full_booking: fullBooking,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save settings.");
    }
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Agent Persona</h1>
      <div className="space-y-6 max-w-2xl">
        {!isSupabaseConfigured && (
          <Alert>
            <AlertTitle>Supabase Not Configured</AlertTitle>
            <AlertDescription>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to update the prompt.</AlertDescription>
          </Alert>
        )}

        {isSupabaseConfigured && error && (
          <Alert variant="destructive">
            <AlertTitle>Unable to load settings</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent System Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              placeholder="Define the agent's personality and instructions..."
              disabled={!isSupabaseConfigured || isLoading}
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
              <Switch
                id="mode"
                checked={fullBooking}
                onCheckedChange={setFullBooking}
                disabled={!isSupabaseConfigured || isLoading}
              />
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

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div>
          <Button onClick={handleSave} disabled={!isSupabaseConfigured || saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
