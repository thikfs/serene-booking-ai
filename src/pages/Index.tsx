import { Heart, Users, Flower2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWidget } from "@/components/ChatWidget";
import { useQuery } from "@tanstack/react-query";
import { fetchServices } from "@/lib/supabaseApi";
import { isSupabaseConfigured } from "@/lib/supabaseClient";

const iconSet = [Heart, Users, Flower2];

const Index = () => {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ["public-services"],
    queryFn: fetchServices,
    enabled: isSupabaseConfigured,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 text-center"
        style={{
          background: "linear-gradient(135deg, hsl(140 25% 90%) 0%, hsl(200 45% 92%) 50%, hsl(152 35% 85%) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, hsl(152 35% 45% / 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, hsl(200 60% 65% / 0.15) 0%, transparent 50%)",
          }}
        />
        <div className="relative z-10 max-w-3xl">
          <h1 className="mb-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your Journey to Mental Wellness Starts Here
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Compassionate, professional therapy tailored to your needs.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="mb-10 text-center font-display text-3xl font-semibold text-foreground">
          Our Therapeutic Services
        </h2>
        {!isSupabaseConfigured && (
          <p className="text-center text-sm text-muted-foreground">
            Connect Supabase to load services dynamically.
          </p>
        )}
        {isSupabaseConfigured && isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading services...</p>
        )}
        {isSupabaseConfigured && error && (
          <p className="text-center text-sm text-destructive">Unable to load services.</p>
        )}
        {isSupabaseConfigured && services && services.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No services are available yet.</p>
        )}
        {isSupabaseConfigured && services && services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, index) => {
              const Icon = iconSet[index % iconSet.length];
              return (
                <Card key={s.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{s.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {s.duration} min · {s.price ? `$${s.price}` : "Contact us"}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Speak with our team to tailor the right session for you.
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/40 py-8 text-center text-sm text-muted-foreground">
        <p>Built in AI Web Session 2026, BookingAgent Pro, Student: [Name], Team: [Slug]</p>
      </footer>

      <ChatWidget />
    </div>
  );
};

export default Index;
