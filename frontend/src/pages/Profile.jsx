import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

import {
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Bell,
  CreditCard,
  ChevronRight,
  Loader2,
  Camera,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Tabs: "profile", "security", "notifications"
  const [activeTab, setActiveTab] = useState("profile");

  // Profile settings state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const res = await api.put("/auth/profile", { name, email });
      updateUser(res.data);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 5000);
    } catch (err) {
      setProfileError(
        err.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put("/auth/profile/password", { currentPassword, newPassword });
      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 5000);
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to update password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const menuItems = [
    {
      id: "profile",
      label: "General",
      icon: User,
      description: "Personal info & avatar",
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
      description: "Password & protection",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Alerts & updates",
      disabled: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
      {/* Header Area */}
      <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Account <span className="text-primary">Settings</span>
          </h1>
          <p className="mt-1 text-lg font-medium text-muted-foreground">
            Manage your digital workspace identity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="px-3 py-1 text-xs font-semibold"
          >
            {user?.role?.toUpperCase() || "USER"}
          </Badge>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="sticky top-24 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  disabled={item.disabled}
                  className={`group relative flex w-full items-start gap-4 rounded-2xl p-4 text-left transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-card shadow-xl shadow-primary/5 ring-1 ring-border/50"
                      : item.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-primary/5"
                  }`}
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      activeTab === item.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold ${activeTab === item.id ? "text-foreground" : "text-muted-foreground group-hover:text-primary"}`}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* General Profile Section */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="overflow-hidden border-border/60 bg-card/50 backdrop-blur-xl transition-all hover:bg-card/80">
                <CardHeader className="pb-8">
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="relative group mx-auto md:mx-0">
                      <div className="h-24 w-24 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 shadow-2xl transition-transform group-hover:scale-105">
                        <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </div>
                      <button className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-background shadow-lg border border-border text-foreground hover:bg-primary hover:text-white transition-colors">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-center md:text-left">
                      <CardTitle className="text-2xl font-bold">
                        {user?.name || "Member"}
                      </CardTitle>
                      <CardDescription className="text-base">
                        Your personal account profile details.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {profileSuccess && (
                      <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        {profileSuccess}
                      </div>
                    )}
                    {profileError && (
                      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        {profileError}
                      </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80"
                        >
                          Full Name
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="name"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="h-12 rounded-2xl pl-10 border-border/60 bg-muted/30 focus:bg-background transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80"
                        >
                          Email Address
                        </Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="h-12 rounded-2xl pl-10 border-border/60 bg-muted/30 focus:bg-background transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-border/40">
                      <Button
                        type="submit"
                        disabled={
                          profileLoading ||
                          (name === user?.name && email === user?.email)
                        }
                        className="h-12 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {profileLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Stats/Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/30 border-border/40 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold opacity-60">Status</div>
                  <div className="text-xl font-bold">Verified User</div>
                </Card>
                <Card className="bg-card/30 border-border/40 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold opacity-60">Session</div>
                  <div className="text-xl font-bold text-green-500">Active</div>
                </Card>
                <Card className="bg-card/30 border-border/40 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-bold opacity-60">
                    Member since
                  </div>
                  <div className="text-xl font-bold">2026</div>
                </Card>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="border-border/60 bg-card/50 backdrop-blur-xl transition-all hover:bg-card/80">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">
                    Update security
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground/80">
                    Change your password to keep your account safe.
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                    {passwordSuccess && (
                      <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        {passwordSuccess}
                      </div>
                    )}
                    {passwordError && (
                      <div className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm font-semibold text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                          Current Password
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 rounded-2xl pl-10 border-border/60 bg-muted/30 focus:bg-background transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                            New Password
                          </Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              type="password"
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Create a strong one"
                              className="h-12 rounded-2xl pl-10 border-border/60 bg-muted/30 focus:bg-background transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                            Confirm Password
                          </Label>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              placeholder="Repeat new password"
                              className="h-12 rounded-2xl pl-10 border-border/60 bg-muted/30 focus:bg-background transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-border/40">
                      <Button
                        type="submit"
                        disabled={
                          passwordLoading || !currentPassword || !newPassword
                        }
                        className="h-12 rounded-2xl px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Security Tips */}
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 backdrop-blur-sm">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-inner">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Secure your account</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Always use a password that is at least 8 characters long
                      and includes a mix of numbers, letters, and symbols. Never
                      share your credentials with others.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
