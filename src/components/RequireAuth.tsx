import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (!isConfigured) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Supabase Not Configured</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
