import { Sidebar } from "@/components/app/Sidebar";
import { Header } from "@/components/app/Header";
import { AuthGuard } from "@/components/app/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background-near-black overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
