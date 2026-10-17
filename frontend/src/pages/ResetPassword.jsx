import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/utils/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  BookOpen,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
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

    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset password. Token may be invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
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
      <Link to="/home" className="relative mb-10 flex items-center gap-3 group">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight">UniTask</span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-[420px]">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

        <div className="relative rounded-3xl border border-border/60 bg-card/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Password Reset!</h3>
              <p className="mb-6 text-sm text-muted-foreground">
                Your password has been successfully updated.
              </p>
              <Button className="w-full" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-xl pl-10 pr-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl gap-2 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
                    </>
                  ) : (
                    <>
                      Reset Password <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <div className="mb-8 text-center pt-2">
                  <p className="mt-2 text-sm text-muted-foreground">
                    Remember your password?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-primary hover:underline underline-offset-2"
                    >
                      Log in
                    </Link>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
