import { useState } from "react";
import { Link } from "react-router-dom";

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
  User,
  ArrowRight,
} from "lucide-react";

/* ---------- UI helper (UNCHANGED) ---------- */
function StrengthBar({ password }) {
  if (!password) return null;

  const commonPasswords = ["123456", "password", "qwerty", "abc123"];

  let score = 0;

  // 🚫 Common password check
  if (commonPasswords.includes(password.toLowerCase())) {
    score = 1;
  } else {
    // ✅ Length (MOST IMPORTANT)
    if (password.length >= 8) score = 2;
    if (password.length >= 12) score = 3;

    // ✅ Extra signals (minor weight)
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
  }

  // Normalize score to 1–4
  score = Math.min(Math.max(score, 1), 4);

  const levels = [
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-400" },
    { label: "Good", color: "bg-yellow-400" },
    { label: "Strong", color: "bg-green-500" },
  ];

  const current = levels[score - 1];

  return (
    <div className="mt-2 space-y-1.5">
      {/* Bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? current.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Label */}
      <span
        className={`text-xs font-medium ${
          score >= 3
            ? "text-green-600"
            : score === 2
              ? "text-yellow-600"
              : "text-red-600"
        }`}
      >
        {current.label} password
      </span>
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function RegisterPage() {
  
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter a valid full name (at least 2 characters).");
      return;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const commonPasswords = ["123456", "password", "qwerty", "abc123"];

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (commonPasswords.includes(password.toLowerCase())) {
      setError("This password is too common. Please choose a stronger one.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      // ✅ AUTO LOGIN (NEW SYSTEM)
      login({
        user: res.data.user,
        token: res.data.token,
        expiresAt: Date.now() + (res.data.expiresIn ? res.data.expiresIn * 1000 : 86400000),
      });

      // Handle redirection after signup
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get("redirect") || "/dashboard";
      window.location.href = redirectTo;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI BELOW IS 100% UNCHANGED ---------- */
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-secondary/15 blur-[100px]" />
        <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
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
      <Link to="/" className="relative mb-10 flex items-center gap-3 group">
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
              Create account
            </h1>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={name}
                  placeholder="John Doe"
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl pl-10"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  placeholder="name@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl pl-10"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="Create a strong password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pl-10 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <StrengthBar password={password} />
            </div>

            <Button type="submit" disabled={loading} className="h-12 w-full">
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" /> Creating account…
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have one?{" "}
              <Link to="/login" className="font-semibold text-primary">
                Log in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
