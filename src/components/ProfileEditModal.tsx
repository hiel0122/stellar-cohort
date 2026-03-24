import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({ open, onOpenChange }: ProfileEditModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setName(profile.full_name ?? "");
      setDepartment(profile.department ?? "");
      setTitle(profile.title ?? "");
    }
  }, [open, profile]);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        department: department.trim() || null,
        title: title.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error("프로필 저장에 실패했습니다: " + error.message);
    } else {
      toast.success("프로필이 저장되었습니다.");
      onOpenChange(false);
      // Trigger a page reload to refresh profile in AuthProvider
      window.location.reload();
    }
  };

  const inputCls =
    "h-11 text-sm bg-white/70 dark:bg-white/10 border-white/50 dark:border-white/15 placeholder:text-foreground/30 backdrop-blur-sm";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md rounded-lg border border-white/30 dark:border-white/10 bg-white/55 dark:bg-black/35 backdrop-blur-xl shadow-sm p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-3">
          <DialogTitle className="text-lg font-semibold text-foreground">
            프로필 설정
          </DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">메일</label>
            <Input value={user?.email ?? ""} readOnly disabled className={`${inputCls} opacity-60`} />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">부서</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">직급</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={!canSave || saving} className="w-full h-11 text-sm font-semibold mt-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            프로필 저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
