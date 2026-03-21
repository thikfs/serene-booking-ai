import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { fetchBookingsWithServices } from "@/lib/supabaseApi";
import { format } from "date-fns";

export default function AppointmentCalendar() {
  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ["bookings"],
    queryFn: fetchBookingsWithServices,
    enabled: isSupabaseConfigured,
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Appointment Calendar</h1>

      {!isSupabaseConfigured && (
        <Alert>
          <AlertTitle>Supabase Not Configured</AlertTitle>
          <AlertDescription>Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to load bookings.</AlertDescription>
        </Alert>
      )}

      {isSupabaseConfigured && error && (
        <Alert variant="destructive">
          <AlertTitle>Unable to load bookings</AlertTitle>
          <AlertDescription>{(error as Error).message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSupabaseConfigured && isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Loading appointments...
                </TableCell>
              </TableRow>
            )}
            {isSupabaseConfigured && !isLoading && (bookings?.length ?? 0) === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No appointments yet.
                </TableCell>
              </TableRow>
            )}
            {bookings?.map((a) => {
              const date = new Date(a.appointment_time);
              const status = date >= new Date() ? "upcoming" : "past";
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.customer_name ?? "Unknown"}</TableCell>
                  <TableCell>{a.service?.name ?? `Service #${a.service_id}`}</TableCell>
                  <TableCell>{format(date, "yyyy-MM-dd HH:mm")}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{a.customer_email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{a.customer_phone ?? "—"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={status === "upcoming" ? "default" : "secondary"}>{status}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
