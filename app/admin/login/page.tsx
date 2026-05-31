"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [callbackUrl, setCallbackUrl] = useState("/admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Read callback URL from window to avoid useSearchParams
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb) setCallbackUrl(cb);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setError("");
        // Brief delay to show success state before redirect
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 500);
      } else {
        setError(data.error || "登录失败，请检查密码后重试");
        setSuccess(false);
        // Clear password field on error for security
        setPassword("");
      }
    } catch {
      setError("网络错误，请检查网络连接后重试");
      setSuccess(false);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-[var(--card-border)]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h1 className="text-2xl font-bold">管理后台登录</h1>
            <p className="text-[var(--muted)] mt-2">请输入管理密码</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <span className="mt-0.5 text-xs">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>密码正确，正在跳转...</span>
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="请输入密码"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                autoFocus
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                title={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || success || !password.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> 登录成功
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 登录中...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> 登录
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
