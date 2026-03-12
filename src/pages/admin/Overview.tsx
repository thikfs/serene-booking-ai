import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ListChecks, Clock } from "lucide-react";

const stats = [
  { label: "Total Appointments", value: "24", icon: CalendarDays },
  { label: "Active Services", value: "3", icon: ListChecks },
  { label: "Upcoming Sessions", value: "5", icon: Clock },
];

export default function AdminOverview() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Dashboard Overview</h1>
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
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
