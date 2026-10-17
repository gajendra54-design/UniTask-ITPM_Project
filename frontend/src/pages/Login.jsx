import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";

/* ================= FORGOT PASSWORD MODAL ================= */
function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post("/api/auth/forgot-password", {
        email,
      });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md animate-slide-up rounded-2xl border border-border bg-card p-8 shadow-2xl sm:animate-none">
        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Check your inbox</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              We sent a reset link to{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
            <Button className="w-full" onClick={onClose}>
              Got it
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-bold">Reset your password</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send you a link.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="you@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= LOGIN PAGE ================= */
export default function LoginPage() {
  const { login } = useAuth();
  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      login({
        user: res.data.user,
        token: res.data.token,
        expiresAt: Date.now() + (res.data.expiresIn ? res.data.expiresIn * 1000 : 86400000),
      });

      // Handle redirection after login
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/dashboard";
      window.location.href = redirectTo;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showForgot && (
        <ForgotPasswordModal onClose={() => setShowForgot(false)} />
      )}

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-secondary/15 blur-[100px]" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
        </div>

        {/* Grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <Link
          to="/home"
          className="relative mb-10 flex items-center gap-3 group"
        >
          <img
            src="/unitask.png"
            alt="UniTask Logo"
            className="h-11 w-11 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
          />
          <span className="text-3xl font-black text-foreground tracking-tight">Uni<span className="text-primary">Task</span></span>
        </Link>

        {/* Card */}
        <div className="relative w-full max-w-[420px]">
          <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

          <div className="relative rounded-3xl border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back
              </h1>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs font-medium text-primary hover:underline underline-offset-2"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pl-10 pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
                  </>
                ) : (
                  <>
                    Log In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <div className="mb-8 text-center">
                <p className="mt-2 text-sm text-muted-foreground">
                  New to UniTask?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-primary hover:underline underline-offset-2"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
