import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const appointments = [
  { id: 1, customer: "Emily Carter", service: "Individual Therapy", time: "2026-03-13 10:00", status: "confirmed" },
  { id: 2, customer: "James & Olivia Park", service: "Couples Counseling", time: "2026-03-13 14:00", status: "confirmed" },
  { id: 3, customer: "Sarah Johnson", service: "Group Meditation", time: "2026-03-14 09:00", status: "pending" },
  { id: 4, customer: "Michael Chen", service: "Individual Therapy", time: "2026-03-14 11:00", status: "confirmed" },
  { id: 5, customer: "Anna Koppel", service: "Group Meditation", time: "2026-03-15 09:00", status: "pending" },
];

export default function AppointmentCalendar() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Appointment Calendar</h1>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.customer}</TableCell>
                <TableCell>{a.service}</TableCell>
                <TableCell>{a.time}</TableCell>
                <TableCell>
                  <Badge variant={a.status === "confirmed" ? "default" : "secondary"}>
                    {a.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
