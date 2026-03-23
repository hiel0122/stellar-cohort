import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

const REGISTERED_KEY = "auth_registered_emails_v1";

function getRegisteredEmails(): string[] {
  try {
    const raw = localStorage.getItem(REGISTERED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function addRegisteredEmail(email: string) {
  const list = getRegisteredEmails();
  if (!list.includes(email)) {
    list.push(email);
    localStorage.setItem(REGISTERED_KEY, JSON.stringify(list));
  }
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  return !getRegisteredEmails().includes(email.toLowerCase().trim());
}

type EmailStatus = "idle" | "checking" | "available" | "taken";
type PwStrength = "none" | "weak" | "medium" | "strong";

function evaluatePasswordStrength(pw: string): PwStrength {
  if (!pw) return "none";
  const hasLetter = /[a-zA-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pw);
  const kindCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
  const lengthOk = pw.length >= 8 && pw.length <= 20;

  if (!lengthOk || kindCount <= 1) return "weak";
  if (kindCount === 2) return "medium";
  return "strong";
}

const strengthConfig: Record<Exclude<PwStrength, "none">, { label: string; color: string; progress: number }> = {
  weak:   { label: "취약", color: "text-red-500",    progress: 33 },
  medium: { label: "보통", color: "text-yellow-500", progress: 66 },
  strong: { label: "안심", color: "text-emerald-500", progress: 100 },
};

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");

  const resetForm = () => {
    setName(""); setEmail(""); setDepartment(""); setTitle("");
    setPw(""); setPwConfirm(""); setShowPw(false); setEmailStatus("idle");
  };

  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (!o) resetForm();
  };

  const pwStrength = useMemo(() => evaluatePasswordStrength(pw), [pw]);
  const pwMismatch = pwConfirm.length > 0 && pw !== pwConfirm;
  const pwMatch = pwConfirm.length > 0 && pw === pwConfirm;

  const canSubmit =
    name.trim() && email.trim() && department.trim() && title.trim() &&
    (pwStrength === "medium" || pwStrength === "strong") &&
    !pwMismatch && pwConfirm.length > 0 && emailStatus === "available";

  const handleCheckEmail = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { toast.error("이메일을 입력해주세요."); return; }
    if (!trimmed.includes("@bobusanggroup.com")) {
      toast.error("@bobusanggroup.com 도메인 이메일만 사용할 수 있습니다.");
      return;
    }
    setEmailStatus("checking");
    const available = await checkEmailAvailable(trimmed);
    setEmailStatus(available ? "available" : "taken");
  };

  const handleSignup = () => {
    if (!name.trim()) { toast.error("이름을 입력해주세요."); return; }
    if (!email.includes("@bobusanggroup.com")) {
      toast.error("@bobusanggroup.com 도메인 이메일만 사용할 수 있습니다."); return;
    }
    if (!department.trim()) { toast.error("부서를 입력해주세요."); return; }
    if (!title.trim()) { toast.error("직급을 입력해주세요."); return; }
    if (pwStrength === "weak" || pwStrength === "none") {
      toast.error("비밀번호가 너무 취약합니다. 문자, 숫자, 특수문자를 포함해주세요."); return;
    }
    if (pw !== pwConfirm) { toast.error("비밀번호가 일치하지 않습니다."); return; }
    if (emailStatus !== "available") { toast.error("이메일 중복확인을 완료해주세요."); return; }

    addRegisteredEmail(email.trim().toLowerCase());
    toast.success("회원가입이 완료되었습니다.");
    handleOpenChange(false);
  };

  const inputCls = "h-11 text-sm bg-white/70 dark:bg-white/10 border-white/50 dark:border-white/15 placeholder:text-foreground/30 backdrop-blur-sm";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md rounded-lg border border-white/30 dark:border-white/10 bg-white/55 dark:bg-black/35 backdrop-blur-xl shadow-sm p-0 gap-0">
        <DialogHeader className="px-8 pt-8 pb-3">
          <DialogTitle className="text-lg font-semibold text-foreground">Create Account</DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">이름</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>

          {/* Email + duplicate check */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">메일</label>
            <div className="flex gap-2">
              <Input type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailStatus("idle"); }}
                className={`${inputCls} flex-1 min-w-0`} />
              <Button type="button" variant="outline" size="sm"
                onClick={handleCheckEmail}
                disabled={emailStatus === "checking"}
                className="h-11 min-w-[88px] text-xs font-medium shrink-0 bg-white/50 dark:bg-white/10 border-white/40 dark:border-white/15 backdrop-blur-sm">
                {emailStatus === "checking" && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                {emailStatus === "checking" ? "확인중" : "중복확인"}
              </Button>
            </div>
            {emailStatus === "available" && (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> 사용 가능한 이메일입니다.
              </p>
            )}
            {emailStatus === "taken" && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3.5 w-3.5" /> 이미 사용 중인 이메일입니다.
              </p>
            )}
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">부서</label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
          </div>

          {/* Title / Position */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">직급</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">비밀번호 작성</label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="문자, 숫자, 특수문자 포함 8-20자 이내"
                className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors" tabIndex={-1}>
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {pw.length > 0 && pwStrength !== "none" && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${strengthConfig[pwStrength].color}`}>
                    {strengthConfig[pwStrength].label}
                  </span>
                </div>
                <Progress
                  value={strengthConfig[pwStrength].progress}
                  className="h-1.5 bg-foreground/10"
                  style={{
                    // @ts-ignore – CSS custom property for indicator color
                    "--progress-color":
                      pwStrength === "weak" ? "hsl(0 84% 60%)" :
                      pwStrength === "medium" ? "hsl(45 93% 47%)" :
                      "hsl(160 60% 45%)",
                  } as React.CSSProperties}
                />
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground/60">비밀번호 확인</label>
            <Input type="password" value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력하세요"
              className={inputCls} />
            {pwMismatch && (
              <p className="text-xs text-destructive mt-1">
                비밀번호가 동일하지 않아요! 다시 한 번 확인해주세요!
              </p>
            )}
            {pwMatch && (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> 비밀번호가 일치합니다.
              </p>
            )}
          </div>

          {/* Submit */}
          <Button onClick={handleSignup} disabled={!canSubmit}
            className="w-full h-11 text-sm font-semibold mt-2">
            Create Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}