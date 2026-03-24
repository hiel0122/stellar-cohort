import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { getDefaultRoute } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BarChart3, ClipboardList, Link2, Eye, EyeOff } from "lucide-react";
import { SignupModal } from "@/components/SignupModal";
import { toast } from "sonner";
import authBg from "@/assets/auth-bg.jpg";
import { BrandWordmark } from "@/components/brand/BrandWordmark";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Auth() {
  const { isAuthenticated, loading, role } = useAuth();
  const navigate = useNavigate();
  const [btnLoading, setBtnLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);

  if (loading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDefaultRoute(role, profile)} replace />;
  }

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setBtnLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBtnLoading(false);
    if (error) {
      toast.error(error.message);
    }
    // Auth state change listener handles navigation
  };

  const handleGoogleSignIn = async () => {
    setBtnLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setBtnLoading(false);
      toast.error(error.message);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img src={authBg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white/25 dark:bg-black/45" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 dark:from-black/20 dark:to-black/30" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 lg:px-16">
        <div className="flex w-full max-w-5xl flex-col-reverse items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          {/* Left — headline */}
          <div className="flex-1 space-y-6 text-center lg:text-left min-w-0">
            <BrandWordmark className="text-[70px] sm:text-[90px] leading-none mb-2" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm sm:text-4xl lg:text-[2.75rem] lg:leading-[1.2]">
              파편화된 업무 데이터,
              <br />
              하나의 Studio로
            </h1>
            <p className="text-sm leading-relaxed text-foreground/70 drop-shadow-sm sm:text-base max-w-md mx-auto lg:mx-0">
              여기저기 흩어진 업무 데이터를
              <br />
              "Con-tudio"에서 관리, 트레킹하세요.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { icon: BarChart3, label: "Dashboard", desc: "KPI, 정산, 퍼널 분석" },
                { icon: ClipboardList, label: "Survey", desc: "CSV 기반 만족도 리포트" },
                { icon: Link2, label: "Link Tracking", desc: "단축 링크 & 클릭 추적" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3 justify-center lg:justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/10">
                    <f.icon className="h-4 w-4 text-foreground/80" />
                  </div>
                  <div className="text-sm text-foreground/80 drop-shadow-sm">
                    <span className="font-semibold">{f.label}</span>
                    <span className="text-foreground/55"> — {f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — glass login card */}
          <div className="w-full max-w-sm shrink-0">
            <div className="rounded-2xl border border-white/30 dark:border-white/10 bg-white/55 dark:bg-black/35 backdrop-blur-xl shadow-sm px-8 py-10 space-y-5">
              <div className="space-y-1.5 text-center">
                <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
                <p className="text-sm text-foreground/60">계정으로 로그인하세요.</p>
              </div>

              {/* Email / Password */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs text-foreground/70">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-white/70 dark:bg-white/10 border-white/50 dark:border-white/15 placeholder:text-foreground/30 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs text-foreground/70">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10 bg-white/70 dark:bg-white/10 border-white/50 dark:border-white/15 placeholder:text-foreground/30 backdrop-blur-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                disabled={btnLoading}
                className="w-full h-11 text-sm font-semibold tracking-wide"
              >
                {btnLoading ? "로그인 중…" : "Sign In"}
              </Button>

              <div className="flex items-center gap-3">
                <Separator className="flex-1 bg-foreground/10" />
                <span className="text-[11px] text-foreground/40 whitespace-nowrap">or continue with</span>
                <Separator className="flex-1 bg-foreground/10" />
              </div>

              <Button
                onClick={handleGoogleSignIn}
                disabled={btnLoading}
                variant="outline"
                className="w-full h-11 text-sm font-medium gap-3 bg-white/70 dark:bg-white/10 border-white/50 dark:border-white/15 hover:bg-white/90 dark:hover:bg-white/20 text-foreground transition-colors backdrop-blur-sm"
              >
                <GoogleIcon className="h-5 w-5" />
                Continue with Google
              </Button>

              <p className="text-[11px] text-foreground/40 text-center leading-relaxed">
                회사 Google 계정(Workspace)으로 로그인할 수 있어요.
                <br />
                <span className="text-foreground/30">@bobusanggroup.com 도메인만 허용</span>
              </p>

              {/* Sign up link + modal */}
              <p className="text-center text-xs text-foreground/50">
                New here?{" "}
                <button
                  onClick={() => setSignupOpen(true)}
                  className="font-medium text-primary hover:underline underline-offset-2"
                >
                  Create Account
                </button>
              </p>

              <SignupModal open={signupOpen} onOpenChange={setSignupOpen} />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 flex justify-center pb-6 pt-2">
        <BrandWordmark className="text-lg opacity-50" showBadge={false} />
      </footer>
    </div>
  );
}
