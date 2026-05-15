import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative">
        {children}
      </main>
    </div>
  );
}
