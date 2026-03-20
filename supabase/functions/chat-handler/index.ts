type ChatRole = "user" | "assistant";

type IncomingMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequest = {
  messages: IncomingMessage[];
};

type AgentSettings = {
  system_prompt: string | null;
  full_booking: boolean | null;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8",
    },
  });
}

function getEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function isIsoDateOnly(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function dateOnlyFromAnyInput(s: string) {
  // We accept "YYYY-MM-DD" directly; otherwise we try to parse and take the UTC date portion.
  if (isIsoDateOnly(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date input: ${s}`);
  return d.toISOString().slice(0, 10);
}

function toUtcStartEnd(dateOnly: string) {
  const start = new Date(`${dateOnly}T00:00:00.000Z`);
  const end = new Date(`${dateOnly}T23:59:59.999Z`);
  return { start, end };
}

function addMinutes(d: Date, mins: number) {
  return new Date(d.getTime() + mins * 60_000);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

async function supabaseSelect<T>(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  table: string,
  queryString: string,
): Promise<T> {
  const url = `${supabaseUrl}/rest/v1/${table}${queryString ? (queryString.startsWith("?") ? queryString : `?${queryString}`) : ""}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "content-type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase select failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

async function supabaseInsert<T>(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  table: string,
  body: unknown,
): Promise<T> {
  const url = `${supabaseUrl}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase insert failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

type ServiceRow = {
  id: number;
  name: string;
  price?: number | null;
  duration: number;
};

type BookingRow = {
  id?: number | string;
  service_id: number;
  appointment_time: string; // ISO string
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
};

async function getAgentSettings(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): Promise<AgentSettings> {
  const rows = await supabaseSelect<AgentSettings[]>(
    supabaseUrl,
    supabaseServiceRoleKey,
    "agent_settings",
    "?select=system_prompt,full_booking&limit=1",
  );
  return rows[0] ?? { system_prompt: null, full_booking: null };
}

async function listServices(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
): Promise<ServiceRow[]> {
  const rows = await supabaseSelect<ServiceRow[]>(
    supabaseUrl,
    supabaseServiceRoleKey,
    "services",
    "?select=id,name,price,duration&order=id.asc",
  );
  return rows;
}

async function resolveServiceByName(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  serviceName: string,
): Promise<ServiceRow> {
  const encoded = encodeURIComponent(serviceName);
  const rows = await supabaseSelect<ServiceRow[]>(
    supabaseUrl,
    supabaseServiceRoleKey,
    "services",
    `?select=id,name,price,duration&name=eq.${encoded}&limit=1`,
  );
  if (!rows[0]) throw new Error(`Unknown service: ${serviceName}`);
  return rows[0];
}

async function getBookingsForDate(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  dateOnly: string,
): Promise<BookingRow[]> {
  // Assumes bookings.appointment_time is timestamptz.
  const { start, end } = toUtcStartEnd(dateOnly);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const rows = await supabaseSelect<BookingRow[]>(
    supabaseUrl,
    supabaseServiceRoleKey,
    "bookings",
    `?select=service_id,appointment_time&appointment_time=gte.${encodeURIComponent(startIso)}&appointment_time=lte.${encodeURIComponent(endIso)}`,
  );
  return rows;
}

async function getServiceDurationsByIds(
  supabaseUrl: string,
  supabaseServiceRoleKey: string,
  ids: number[],
): Promise<Record<number, number>> {
  if (ids.length === 0) return {};
  const unique = Array.from(new Set(ids));
  const inList = unique.join(",");
  const rows = await supabaseSelect<ServiceRow[]>(
    supabaseUrl,
    supabaseServiceRoleKey,
    "services",
    `?select=id,duration&id=in.(${inList})`,
  );
  const map: Record<number, number> = {};
  for (const r of rows) map[r.id] = r.duration;
  return map;
}

function getBusinessHoursFromEnv() {
  const start = Deno.env.get("BUSINESS_HOURS_START") ?? "09:00";
  const end = Deno.env.get("BUSINESS_HOURS_END") ?? "17:00";
  const slotInterval = Number(Deno.env.get("SLOT_INTERVAL_MINUTES") ?? "30");
  return { start, end, slotInterval };
}

function parseTimeHHMM(t: string) {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  if (!m) throw new Error(`Invalid HH:MM time: ${t}`);
  return { hh: Number(m[1]), mm: Number(m[2]) };
}

function formatTimeIsoForDate(dateOnly: string, hh: number, mm: number) {
  // We use UTC for scheduling logic to keep it deterministic.
  const d = new Date(`${dateOnly}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00.000Z`);
  return d.toISOString();
}

async function checkAvailabilityTool(args: {
  date: string;
  service_name?: string;
  timezone?: string; // accepted, but scheduling logic uses UTC unless you extend it.
  duration_minutes?: number;
}, deps: {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}) {
  const dateOnly = dateOnlyFromAnyInput(args.date);

  const { start: bizStart, end: bizEnd, slotInterval } = getBusinessHoursFromEnv();
  const startTime = parseTimeHHMM(bizStart);
  const endTime = parseTimeHHMM(bizEnd);

  let durationMinutes =
    typeof args.duration_minutes === "number" && Number.isFinite(args.duration_minutes)
      ? args.duration_minutes
      : undefined;

  let serviceResolved: ServiceRow | null = null;
  if (!durationMinutes && args.service_name) {
    serviceResolved = await resolveServiceByName(deps.supabaseUrl, deps.supabaseServiceRoleKey, args.service_name);
    durationMinutes = serviceResolved.duration;
  }
  if (!durationMinutes) durationMinutes = 60; // fallback if service missing

  const dayBookings = await getBookingsForDate(deps.supabaseUrl, deps.supabaseServiceRoleKey, dateOnly);
  const durationsMap = await getServiceDurationsByIds(
    deps.supabaseUrl,
    deps.supabaseServiceRoleKey,
    dayBookings.map((b) => b.service_id),
  );

  const dayStart = new Date(`${dateOnly}T${String(startTime.hh).padStart(2, "0")}:${String(startTime.mm).padStart(2, "0")}:00.000Z`);
  const dayEnd = new Date(`${dateOnly}T${String(endTime.hh).padStart(2, "0")}:${String(endTime.mm).padStart(2, "0")}:00.000Z`);

  const slots: string[] = [];

  for (let t = dayStart; addMinutes(t, durationMinutes) <= dayEnd; t = addMinutes(t, slotInterval)) {
    const slotStart = t;
    const slotEnd = addMinutes(t, durationMinutes);

    let conflicts = false;
    for (const b of dayBookings) {
      const bStart = new Date(b.appointment_time);
      const bDuration = durationsMap[b.service_id] ?? 0;
      const bEnd = addMinutes(bStart, bDuration);

      if (overlaps(slotStart, slotEnd, bStart, bEnd)) {
        conflicts = true;
        break;
      }
    }

    if (!conflicts) slots.push(slotStart.toISOString());
  }

  return {
    date: dateOnly,
    duration_minutes: durationMinutes,
    available_slots: slots,
    business_hours: { start: bizStart, end: bizEnd },
    service: serviceResolved ? { id: serviceResolved.id, name: serviceResolved.name } : undefined,
  };
}

async function createBookingTool(
  args: {
    service_name: string;
    appointment_time: string; // ISO datetime
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    notes?: string;
  },
  deps: {
    supabaseUrl: string;
    supabaseServiceRoleKey: string;
    fullBooking: boolean;
  },
) {
  if (!deps.fullBooking) {
    return { ok: false, reason: "Booking is disabled (Information Only mode)." };
  }

  const service = await resolveServiceByName(deps.supabaseUrl, deps.supabaseServiceRoleKey, args.service_name);
  const start = new Date(args.appointment_time);
  if (Number.isNaN(start.getTime())) throw new Error(`Invalid appointment_time: ${args.appointment_time}`);
  const end = addMinutes(start, service.duration);

  // Re-check for conflicts on that day.
  const dateOnly = start.toISOString().slice(0, 10);
  const dayBookings = await getBookingsForDate(deps.supabaseUrl, deps.supabaseServiceRoleKey, dateOnly);
  const durationsMap = await getServiceDurationsByIds(
    deps.supabaseUrl,
    deps.supabaseServiceRoleKey,
    dayBookings.map((b) => b.service_id),
  );

  for (const b of dayBookings) {
    const bStart = new Date(b.appointment_time);
    const bDuration = durationsMap[b.service_id] ?? 0;
    const bEnd = addMinutes(bStart, bDuration);
    if (overlaps(start, end, bStart, bEnd)) {
      const availability = await checkAvailabilityTool(
        { date: dateOnly, service_name: args.service_name },
        { supabaseUrl: deps.supabaseUrl, supabaseServiceRoleKey: deps.supabaseServiceRoleKey },
      );
      return { ok: false, reason: "Slot is no longer available.", available_slots: availability.available_slots };
    }
  }

  const bookingToInsert: Record<string, unknown> = {
    service_id: service.id,
    appointment_time: start.toISOString(),
    customer_name: args.customer_name ?? null,
    customer_email: args.customer_email ?? null,
    customer_phone: args.customer_phone ?? null,
  };

  // Notes column may not exist; we only insert if provided and you know your schema supports it.
  if (typeof args.notes === "string" && args.notes.trim()) {
    bookingToInsert.notes = args.notes.trim();
  }

  const inserted = await supabaseInsert<BookingRow[]>(
    deps.supabaseUrl,
    deps.supabaseServiceRoleKey,
    "bookings",
    bookingToInsert,
  );

  const created = inserted[0];
  return {
    ok: true,
    booking: created,
    confirmation: `Booked ${args.service_name} for ${start.toISOString()}.`,
  };
}

async function runOpenAIChatWithToolCalling(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: IncomingMessage[];
  tools: unknown[];
  toolHandlers: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  >;
}) {
  const { apiKey, model, systemPrompt, messages, tools, toolHandlers } = params;
  const endpoint = "https://api.openai.com/v1/chat/completions";

  let llmMessages: any[] = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: m.content,
    })),
  ];

  for (let i = 0; i < 6; i++) {
    console.log(`[OpenAI] Loop ${i}: POST to ${endpoint}...`);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: llmMessages,
        tools,
        tool_choice: "auto",
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const message = data?.choices?.[0]?.message;
    const content = message?.content ?? "";
    const toolCalls = message?.tool_calls as
      | Array<{
          id: string;
          type: "function";
          function: { name: string; arguments: string };
        }>
      | undefined;

    if (!toolCalls || toolCalls.length === 0) {
      return { reply: String(content) };
    }

    // Add assistant tool call message, then tool result messages.
    llmMessages = [
      ...llmMessages,
      { role: "assistant", content: String(content), tool_calls: toolCalls },
    ];

    for (const call of toolCalls) {
      const argsRaw = call.function.arguments ?? "{}";
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(argsRaw);
      } catch {
        parsedArgs = {};
      }

      const handler = toolHandlers[call.function.name];
      if (!handler) {
        llmMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ ok: false, error: `Unknown tool: ${call.function.name}` }),
        });
        continue;
      }

      const result = await handler(parsedArgs);
      llmMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  throw new Error("Tool loop exceeded without producing output.");
}

async function runClaudeChatWithToolCalling(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: IncomingMessage[];
  tools: Array<{
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }>;
  toolHandlers: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  >;
}) {
  const { apiKey, model, systemPrompt, messages, tools, toolHandlers } = params;
  const endpoint = "https://api.anthropic.com/v1/messages";

  let claudeMessages: any[] = messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  for (let i = 0; i < 6; i++) {
    console.log(`[Claude] Loop ${i}: POST to ${endpoint}...`);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": Deno.env.get("ANTHROPIC_VERSION") ?? "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        max_tokens: 800,
        temperature: 0.4,
        tools,
        messages: claudeMessages,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Claude request failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    const contentBlocks = (data?.content ?? []) as any[];

    const toolUses = contentBlocks.filter((b) => b?.type === "tool_use") as any[];
    if (!toolUses || toolUses.length === 0) {
      const text = contentBlocks
        .filter((b) => b?.type === "text")
        .map((b) => b.text)
        .join("");
      return { reply: String(text) };
    }

    // Append the assistant tool-use message.
    claudeMessages = [
      ...claudeMessages,
      {
        role: "assistant",
        content: contentBlocks,
      },
    ];

    // Execute tools and send results back in a user message.
    const toolResultBlocks: any[] = [];
    for (const use of toolUses) {
      const name = String(use.name);
      const input = (use.input ?? {}) as Record<string, unknown>;
      const handler = toolHandlers[name];

      const result = handler ? await handler(input) : { ok: false, error: `Unknown tool: ${name}` };

      toolResultBlocks.push({
        type: "tool_result",
        tool_use_id: use.id,
        content: JSON.stringify(result),
      });
    }

    claudeMessages = [
      ...claudeMessages,
      {
        role: "user",
        content: toolResultBlocks,
      },
    ];
  }

  throw new Error("Claude tool loop exceeded without producing output.");
}

export default async function handler(req: Request) {
  try {
    console.log(`[REQUEST] Method: ${req.method} url: ${req.url}`);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const body = (await req.json().catch(() => null)) as ChatRequest | null;
    if (!body || !Array.isArray(body.messages)) {
      return jsonResponse({ error: "Invalid request payload. Expected { messages: [...] }." }, 400);
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[DB] Fetching agent settings...");
    const agentSettings = await getAgentSettings(supabaseUrl, supabaseServiceRoleKey);
    console.log("[DB] Loaded agent settings successfully.");
    const systemPromptFromTable =
      agentSettings.system_prompt && agentSettings.system_prompt.trim()
        ? agentSettings.system_prompt.trim()
        : "You are a receptionist. Check availability before promising time slots. Be concise and professional.";
    const fullBooking = Boolean(agentSettings.full_booking);

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const openaiModel = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const anthropicModel = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-3-5-sonnet-20241022";

    const { availableTools, toolDefinitionsSystem } = (() => {
      const tools = [
        {
          type: "function",
          function: {
            name: "list_services",
            description: "List all available services and their durations/prices.",
            parameters: { type: "object", properties: {}, required: [], additionalProperties: false },
          },
        },
        {
          type: "function",
          function: {
            name: "check_availability",
            description:
              "Check which time slots are available on a specific date for a given service duration.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "The requested date (YYYY-MM-DD or ISO datetime).", },
                service_name: { type: "string", description: "Service name (e.g. 'Individual Therapy').", },
                duration_minutes: { type: "number", description: "Optional. Duration in minutes if service is unknown.", },
                timezone: { type: "string", description: "Optional timezone hint for the user (scheduling uses UTC unless extended).", },
              },
              required: ["date"],
              additionalProperties: false,
            },
          },
        },
        {
          type: "function",
          function: {
            name: "create_booking",
            description:
              "Create a booking once the user provides all required details and the slot is confirmed available.",
            parameters: {
              type: "object",
              properties: {
                service_name: { type: "string", description: "Service name (e.g. 'Individual Therapy')." },
                appointment_time: { type: "string", description: "ISO datetime for the appointment start (UTC)." },
                customer_name: { type: "string", description: "Customer full name." },
                customer_email: { type: "string", description: "Customer email address." },
                customer_phone: { type: "string", description: "Customer phone number (optional)." },
                notes: { type: "string", description: "Optional notes from the customer." },
              },
              required: ["service_name", "appointment_time"],
              additionalProperties: false,
            },
          },
        },
      ];

      const sys =
        `${systemPromptFromTable}\n\n` +
        `Operational mode:\n` +
        `- Full booking is ${fullBooking ? "ENABLED" : "DISABLED"}.\n\n` +
        `You must:\n` +
        `- Use tools before promising any appointment time.\n` +
        `- When the user requests booking, call check_availability first.\n` +
        `- If Full booking is disabled, do NOT create a booking; instead collect customer details and suggest manual booking.\n` +
        `- Be concise and professional, and ask only for the missing details.\n`;

      return { availableTools: tools, toolDefinitionsSystem: sys };
    })();

    const llmProvider = (Deno.env.get("LLM_PROVIDER") ?? "").toLowerCase();
    const provider =
      llmProvider === "anthropic" ? "anthropic" : llmProvider === "openai" ? "openai" : anthropicKey ? "anthropic" : "openai";

    if (provider === "openai" && !openaiKey) {
      return jsonResponse({ error: "OPENAI_API_KEY is not configured in this Edge Function." }, 500);
    }
    if (provider === "anthropic" && !anthropicKey) {
      return jsonResponse({ error: "ANTHROPIC_API_KEY is not configured in this Edge Function." }, 500);
    }

    const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
      list_services: async () => {
        return listServices(supabaseUrl, supabaseServiceRoleKey);
      },
      check_availability: async (args) => {
        return checkAvailabilityTool(
          {
            date: String(args.date ?? ""),
            service_name: typeof args.service_name === "string" ? args.service_name : undefined,
            duration_minutes: typeof args.duration_minutes === "number" ? args.duration_minutes : undefined,
            timezone: typeof args.timezone === "string" ? args.timezone : undefined,
          },
          { supabaseUrl, supabaseServiceRoleKey },
        );
      },
      create_booking: async (args) => {
        return createBookingTool(
          {
            service_name: String(args.service_name ?? ""),
            appointment_time: String(args.appointment_time ?? ""),
            customer_name: typeof args.customer_name === "string" ? args.customer_name : undefined,
            customer_email: typeof args.customer_email === "string" ? args.customer_email : undefined,
            customer_phone: typeof args.customer_phone === "string" ? args.customer_phone : undefined,
            notes: typeof args.notes === "string" ? args.notes : undefined,
          },
          { supabaseUrl, supabaseServiceRoleKey, fullBooking },
        );
      },
    };

    console.log(`[LLM] Selected provider: ${provider}`);
    if (provider === "openai") {
      console.log("[LLM] Starting OpenAI chat loop...");
      const out = await runOpenAIChatWithToolCalling({
        apiKey: openaiKey!,
        model: openaiModel,
        systemPrompt: toolDefinitionsSystem,
        messages: body.messages,
        tools: availableTools,
        toolHandlers,
      });
      return jsonResponse({ reply: out.reply });
    }

    // Convert OpenAI tool definitions to Claude tool format.
    // availableTools entries are OpenAI "tools" objects: { type: "function", function: { name, description, parameters } }
    const claudeTools = (availableTools as any[]).map((t) => {
      const fn = t?.function;
      return {
        name: fn?.name,
        description: fn?.description ?? "",
        input_schema: fn?.parameters ?? { type: "object", properties: {} },
      };
    });

    console.log("[LLM] Starting Claude chat loop...");
    const out = await runClaudeChatWithToolCalling({
      apiKey: anthropicKey!,
      model: anthropicModel,
      systemPrompt: toolDefinitionsSystem,
      messages: body.messages,
      tools: claudeTools,
      toolHandlers,
    });

    return jsonResponse({ reply: out.reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
}

