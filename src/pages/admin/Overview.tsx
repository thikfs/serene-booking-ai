import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ListChecks, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchDashboardStats } from "@/lib/supabaseApi";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    enabled: isSupabaseConfigured,
  });

  const stats = [
    { label: "Total Appointments", value: data?.totalAppointments ?? 0, icon: CalendarDays },
    { label: "Active Services", value: data?.activeServices ?? 0, icon: ListChecks },
    { label: "Upcoming Sessions", value: data?.upcomingSessions ?? 0, icon: Clock },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Dashboard Overview</h1>
      {!isSupabaseConfigured && (
        <Alert className="mb-4">
          <AlertTitle>Supabase Not Configured</AlertTitle>
          <AlertDescription>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load stats.</AlertDescription>
        </Alert>
      )}
      {isSupabaseConfigured && error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Unable to load dashboard stats</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{isLoading ? "—" : s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
