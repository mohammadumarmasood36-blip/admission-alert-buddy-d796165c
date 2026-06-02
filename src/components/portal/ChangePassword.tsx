import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ChangePasswordProps {
  userId?: string;
  userType?: "staff" | "student";
}

export default function ChangePassword(_props: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword === oldPassword) {
      toast.error("New password must be different from current password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate with the current password to verify it.
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) {
        toast.error("Not signed in");
        return;
      }
      const { error: reauthErr } = await supabase.auth.signInWithPassword({
        email,
        password: `${oldPassword}!Lov1`,
      });
      if (reauthErr) {
        toast.error("Current password is incorrect");
        return;
      }
      // Update to the new password (also padded so the helper keeps working).
      const { error: updErr } = await supabase.auth.updateUser({
        password: `${newPassword}!Lov1`,
      });
      if (updErr) {
        toast.error(updErr.message);
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      console.error("Change password error:", err);
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Current Password</Label>
          <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" className="mt-1.5" />
        </div>
        <div>
          <Label>New Password (min 8 characters)</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="mt-1.5" />
        </div>
        <div>
          <Label>Confirm New Password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="mt-1.5" onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        <Button onClick={handleSubmit} className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : "Update Password"}
        </Button>
      </CardContent>
    </Card>
  );
}
