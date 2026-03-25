import { AuthGuard } from "@/components/app/AuthGuard";
import { SessionProviderWrapper } from "@/components/app/SessionProviderWrapper";
import { EntitlementsProvider } from "@/components/app/contexts/EntitlementsContext";
import { DashboardCallShell } from "@/components/app/DashboardCallShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <EntitlementsProvider>
        <SessionProviderWrapper>
          <DashboardCallShell>{children}</DashboardCallShell>
        </SessionProviderWrapper>
      </EntitlementsProvider>
    </AuthGuard>
  );
}
