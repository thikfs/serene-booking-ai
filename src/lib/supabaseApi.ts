import { requireSupabase } from "@/lib/supabaseClient";

export type ServiceRow = {
  id: number;
  name: string;
  price: number | null;
  duration: number;
};

export type BookingRow = {
  id: number;
  service_id: number;
  appointment_time: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  service?: ServiceRow | null;
};

export type AgentSettingsRow = {
  id: number;
  system_prompt: string | null;
  full_booking: boolean | null;
};

export async function fetchServices() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("services")
    .select("id,name,price,duration")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function createService(input: Omit<ServiceRow, "id">) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: input.name,
      price: input.price,
      duration: input.duration,
    })
    .select("id,name,price,duration")
    .limit(1)
    .single();
  if (error) throw error;
  return data as ServiceRow;
}

export async function seedServices(inputs: Array<Omit<ServiceRow, "id">>) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("services")
    .insert(
      inputs.map((s) => ({
        name: s.name,
        price: s.price,
        duration: s.duration,
      })),
    )
    .select("id,name,price,duration");
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function updateService(input: ServiceRow) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("services")
    .update({
      name: input.name,
      price: input.price,
      duration: input.duration,
    })
    .eq("id", input.id)
    .select("id,name,price,duration")
    .limit(1)
    .single();
  if (error) throw error;
  return data as ServiceRow;
}

export async function deleteService(id: number) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchBookingsWithServices(options?: { upcomingOnly?: boolean }) {
  const supabase = requireSupabase();
  const upcomingOnly = options?.upcomingOnly ?? false;
  const now = new Date().toISOString();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id,service_id,appointment_time,customer_name,customer_email,customer_phone,notes")
    .order("appointment_time", { ascending: true })
    .gte("appointment_time", upcomingOnly ? now : "1900-01-01T00:00:00.000Z");
  if (error) throw error;
  const rows = (bookings ?? []) as BookingRow[];
  const ids = Array.from(new Set(rows.map((b) => b.service_id).filter((id) => Number.isFinite(id))));
  if (ids.length === 0) return rows;

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id,name,price,duration")
    .in("id", ids);
  if (servicesError) throw servicesError;
  const serviceMap = new Map((services ?? []).map((s) => [s.id, s as ServiceRow]));

  return rows.map((b) => ({
    ...b,
    service: serviceMap.get(b.service_id) ?? null,
  }));
}

export async function fetchAgentSettings() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("agent_settings")
    .select("id,system_prompt,full_booking")
    .limit(1);
  if (error) throw error;
  return (data?.[0] ?? null) as AgentSettingsRow | null;
}

export async function upsertAgentSettings(input: {
  id?: number;
  system_prompt: string;
  full_booking: boolean;
}) {
  const supabase = requireSupabase();
  if (input.id) {
    const { data, error } = await supabase
      .from("agent_settings")
      .update({
        system_prompt: input.system_prompt,
        full_booking: input.full_booking,
      })
      .eq("id", input.id)
      .select("id,system_prompt,full_booking")
      .limit(1)
      .single();
    if (error) throw error;
    return data as AgentSettingsRow;
  }

  const { data, error } = await supabase
    .from("agent_settings")
    .insert({
      system_prompt: input.system_prompt,
      full_booking: input.full_booking,
    })
    .select("id,system_prompt,full_booking")
    .limit(1)
    .single();
  if (error) throw error;
  return data as AgentSettingsRow;
}

export async function fetchDashboardStats() {
  const supabase = requireSupabase();
  const now = new Date().toISOString();
  const [totalAppointments, activeServices, upcomingSessions] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("services").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("id", { count: "exact", head: true }).gte("appointment_time", now),
  ]);

  if (totalAppointments.error) throw totalAppointments.error;
  if (activeServices.error) throw activeServices.error;
  if (upcomingSessions.error) throw upcomingSessions.error;

  return {
    totalAppointments: totalAppointments.count ?? 0,
    activeServices: activeServices.count ?? 0,
    upcomingSessions: upcomingSessions.count ?? 0,
  };
}
