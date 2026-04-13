import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 p-6 pt-16 lg:pt-8 lg:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
