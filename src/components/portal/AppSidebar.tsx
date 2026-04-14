import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, Banknote, Wallet, School, Menu, X, LogOut, Globe,
  ClipboardList, CalendarDays, UserCheck, BookOpen, Bell, Download,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const managerNavItems = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/staff", label: "Staff", icon: Users },
  { to: "/portal/students", label: "Students", icon: GraduationCap },
  { to: "/portal/fees", label: "Fees", icon: Wallet },
  { to: "/portal/salary", label: "Salary", icon: Banknote },
  { to: "/portal/notices", label: "Notices", icon: Bell },
  { to: "/portal/website", label: "Website", icon: Globe },
  { to: "/portal/examinations", label: "Examinations", icon: ClipboardList },
];

const principalNavItems = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/staff", label: "Staff", icon: Users },
  { to: "/portal/students", label: "Students", icon: GraduationCap },
  { to: "/portal/fees", label: "Fees", icon: Wallet },
  { to: "/portal/salary", label: "Salary", icon: Banknote },
  { to: "/portal/class-teachers", label: "Class Teachers", icon: UserCheck },
  { to: "/portal/subject-assignments", label: "Subject Assign", icon: BookOpen },
  { to: "/portal/notices", label: "Notices", icon: Bell },
  { to: "/portal/website", label: "Website", icon: Globe },
  { to: "/portal/examinations", label: "Examinations", icon: ClipboardList },
];

const cashierNavItems = [
  { to: "/portal/students", label: "Students", icon: GraduationCap },
  { to: "/portal/fees", label: "Fees", icon: Wallet },
  { to: "/portal/notices", label: "Notices", icon: Bell },
];

const examInchargeNavItems = [
  { to: "/portal/examinations", label: "Examinations", icon: ClipboardList },
  { to: "/portal/students", label: "Students", icon: GraduationCap },
];

export default function AppSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, session, setSession, sessionOptions } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user?.role === "cashier"
    ? cashierNavItems
    : user?.role === "exam_incharge"
    ? examInchargeNavItems
    : user?.role === "principal"
    ? principalNavItems
    : managerNavItems;

  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1).replace("_", " ") : "User";

  const handleLogout = () => {
    logout();
    navigate("/portal");
  };

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display tracking-tight">U.P.S. Portal</h1>
            <p className="text-xs text-sidebar-muted">School Management</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          );
        })}
        <Link
          to="/install"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground mt-2 border border-dashed border-sidebar-border"
        >
          <Download className="w-4.5 h-4.5" />
          Install App
        </Link>
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2">
          <CalendarDays className="w-4 h-4 text-sidebar-muted shrink-0" />
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="h-8 text-xs bg-sidebar-accent/30 border-sidebar-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessionOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-xs font-bold text-sidebar-primary-foreground">
              {roleLabel.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name || roleLabel}</p>
              <p className="text-xs text-sidebar-muted capitalize">{roleLabel}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-[55] bg-foreground/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed left-0 top-0 z-[60] h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
