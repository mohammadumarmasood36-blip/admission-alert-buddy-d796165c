import { useState } from "react";
import { useAuth, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, User, BookOpen, Settings, Loader2, Shield, Wallet, ClipboardList, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { syntheticStaffEmail, syntheticParentEmail, padPassword } from "@/lib/authHelpers";

const roles: { value: UserRole; label: string; icon: React.ReactNode; description: string; gradient: string }[] = [
  { value: "parent", label: "Parent", icon: <User className="w-6 h-6" />, description: "View your child's progress", gradient: "from-emerald-500 to-teal-500" },
  { value: "teacher", label: "Teacher", icon: <BookOpen className="w-6 h-6" />, description: "Classes & attendance", gradient: "from-blue-500 to-indigo-500" },
  { value: "manager", label: "Manager", icon: <Settings className="w-6 h-6" />, description: "School management", gradient: "from-amber-500 to-orange-500" },
  { value: "principal", label: "Principal", icon: <Shield className="w-6 h-6" />, description: "Administration & oversight", gradient: "from-violet-500 to-purple-500" },
  { value: "cashier", label: "Cashier", icon: <Wallet className="w-6 h-6" />, description: "Fee collection", gradient: "from-rose-500 to-pink-500" },
  { value: "exam_incharge", label: "Exam Incharge", icon: <ClipboardList className="w-6 h-6" />, description: "Manage examinations", gradient: "from-cyan-500 to-sky-500" },
];

export default function PortalLoginPage() {
  const { session, setSession, sessionOptions } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole) { toast.error("Please select a role"); return; }
    if (!identifier.trim() || !password.trim()) { toast.error("Please fill in all fields"); return; }

    setLoggingIn(true);
    try {
      const email = selectedRole === "parent"
        ? syntheticParentEmail(identifier.trim())
        : syntheticStaffEmail(identifier.trim());
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: padPassword(password),
      });
      if (error || !data.user) {
        toast.error("Invalid credentials");
        return;
      }
      // Verify the signed-in account actually has the role they picked.
      const { data: rolesRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const hasRole = (rolesRows ?? []).some((r) => r.role === selectedRole);
      if (!hasRole) {
        await supabase.auth.signOut();
        toast.error(`This account is not registered as ${selectedRole}.`);
        return;
      }
      toast.success("Signed in!");
      // AuthContext's onAuthStateChange handler will populate `user`.
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Login failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };


  const getPlaceholder = () => selectedRole === "parent" ? "Admission Number (e.g. 0001)" : "Mobile Number";
  const getLabel = () => selectedRole === "parent" ? "Admission Number" : "Mobile Number";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-3 animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/30 animate-scale-in">
            <School className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold font-display text-white tracking-tight">U.P.S. Portal</h1>
          <p className="text-white/60 text-sm">Universal Public School — Management System</p>
        </div>

        <div className="flex items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <Label className="text-sm font-medium text-white/70 whitespace-nowrap">Session:</Label>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="w-[140px] bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sessionOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedRole ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/50 text-center">Select your role to continue</p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r, i) => (
                <button
                  key={r.value}
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${r.gradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300 animate-fade-in group`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    {r.icon}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm">{r.label}</p>
                    <p className="text-[10px] text-white/70">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Card className="border-white/10 bg-white/10 backdrop-blur-xl text-white animate-scale-in">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-lg text-white">Login as {roles.find((r) => r.value === selectedRole)?.label}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setSelectedRole(null); setIdentifier(""); setPassword(""); }} className="text-white/70 hover:text-white hover:bg-white/10">Change</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white/80">{getLabel()}</Label>
                <Input placeholder={getPlaceholder()} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/40" />
              </div>
              <div>
                <Label className="text-white/80">Password</Label>
                <Input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 bg-white/10 border-white/20 text-white placeholder:text-white/40" onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
              </div>
              <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg" disabled={loggingIn}>
                {loggingIn ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</> : "Sign In"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
