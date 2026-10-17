import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  LogOut,
  LayoutDashboard,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  BookOpen,
  Calendar,
  ArrowRight,
  Flame,
  Trophy,
  Mail,
  MapPin,
  Phone,
  Github,
  Twitter,
  Linkedin,
  Send,
  Server,
  Heart,
  Target,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI Magic Breakdown",
    description:
      "Paste any assignment and AI instantly breaks it into manageable subtasks with time estimates.",
  },
  {
    icon: BarChart3,
    title: "Smart Priority Engine",
    description:
      "Urgency scores based on due date, weight, and effort so you always know what to tackle first.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduler",
    description:
      "Auto-schedule study sessions around your calendar and get reminders at the right moment.",
  },
  {
    icon: Users,
    title: "Study Groups",
    description:
      "Collaborate with classmates, assign tasks, and track group progress in real time.",
  },
  {
    icon: Server,
    title: "AI Flashcards (OCR)",
    description:
      "Automatically extract text from lecture PDFs and generate interactive flashcards for studying.",
  },
  {
    icon: Target,
    title: "Skill Analysis",
    description:
      "Track your proficiency across different subjects and identify areas that require more focus.",
  },
];

export default function Home() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      {/* Detailed Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/home" className="flex items-center gap-3 group">
            <img
              src="/unitask.png"
              alt="UniTask Logo"
              className="h-10 w-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-2xl font-black text-foreground tracking-tight">
              Uni<span className="text-primary">Task</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex font-medium">
            <a
              href="#about"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              About Project
            </a>
            <a
              href="#features"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              How it Works
            </a>
            <a
              href="#contact"
              className="text-sm text-foreground/80 transition-colors hover:text-primary"
            >
              Contact
            </a>
          </nav>
          <div className="relative flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="hidden sm:inline-flex">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="shadow-lg shadow-primary/20">
                    Get Started Free
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsProfileOpen((p) => !p)}
                  className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground
                   flex items-center justify-center font-bold shadow-md shadow-primary/20 transition-transform hover:scale-105"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>

                {isProfileOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-14 w-56 bg-card border border-border
                     rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                      <p className="text-sm font-semibold truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate("/dashboard");
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted font-medium transition-colors"
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </button>

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate("/dashboard");
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-muted font-medium transition-colors"
                      >
                        <User size={16} /> Profile
                      </button>

                      <div className="h-px bg-border my-1 mx-2" />

                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                          navigate("/login");
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                         text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl lg:w-[600px] lg:h-[600px]" />
          <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl lg:w-[600px] lg:h-[600px]" />
          <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-6 duration-700">
          <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 rounded-full">
            <Flame className="mr-2 h-4 w-4" /> Revolutionizing Student
            Productivity
          </Badge>
          <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight md:text-7xl">
            Stop drowning in{" "}
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              assignments.
            </span>
            <br />
            Start acing them.
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground font-medium">
            UniTask is the AI-powered academic planner that breaks down your
            assignments, prioritises your workload, and converts your PDFs into
            interactive flashcards.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            {!user ? (
              <>
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="rounded-xl gap-2 px-8 text-base h-14 shadow-lg shadow-primary/20"
                  >
                    Start for Free <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl px-8 text-base h-14 border-border/60 hover:bg-muted"
                  >
                    I have an account
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <Button
                  size="lg"
                  className="rounded-xl gap-2 px-8 text-base h-14 shadow-lg shadow-primary/20"
                >
                  Go to Dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
          <p className="mt-6 text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Supercharging your academic journey with AI
          </p>
        </div>
      </section>

      {/* About Project / The Vision */}
      <section
        id="about"
        className="px-4 py-24 bg-card/40 border-y border-border/50"
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* LEFT SIDE - CARDS */}
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-blue-500/20 rounded-3xl blur-3xl -z-10"></div>

              <div className="relative bg-card border border-border/60 rounded-3xl p-8 lg:p-10 shadow-2xl">
                <div className="space-y-8">
                  {/* CARD 1 */}
                  <div className="flex gap-5 items-start">
                    <div className="p-4 rounded-2xl bg-primary/15 text-primary flex-shrink-0">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1">
                        Built for Students
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        UniTask is designed specifically for university students
                        who struggle with multiple deadlines, complex
                        assignments, and managing their time effectively.
                      </p>
                    </div>
                  </div>

                  {/* CARD 2 */}
                  <div className="flex gap-5 items-start">
                    <div className="p-4 rounded-2xl bg-blue-500/15 text-blue-500 flex-shrink-0">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1">Powered by AI</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Our system uses advanced AI to break down assignments,
                        estimate effort, and turn long lecture materials into
                        simple, easy-to-study content.
                      </p>
                    </div>
                  </div>

                  {/* CARD 3 */}
                  <div className="flex gap-5 items-start">
                    <div className="p-4 rounded-2xl bg-amber-500/15 text-amber-500 flex-shrink-0">
                      <Target className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xl mb-1">
                        Designed for Productivity
                      </h4>
                      <p className="text-muted-foreground leading-relaxed">
                        From smart prioritization to automated scheduling,
                        UniTask helps you focus on what matters most —
                        completing your work efficiently and on time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE - TEXT */}
            <div className="order-1 md:order-2">
              <Badge className="mb-5 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1 font-semibold text-sm">
                About UniTask
              </Badge>

              <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                Your Academic Work, <br />
                Simplified with AI
              </h2>

              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                UniTask was created to solve a problem every student faces —
                feeling overwhelmed by assignments, deadlines, and endless study
                materials. Instead of relying on multiple tools, UniTask brings
                everything into one intelligent system.
              </p>

              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Simply enter your assignment, and UniTask will break it down
                into manageable tasks, prioritize what’s important, and help you
                stay on track. It transforms the way you study by turning
                complexity into clarity.
              </p>

              <ul className="space-y-4">
                {[
                  "AI-powered assignment breakdown",
                  "Smart task prioritization & scheduling",
                  "Interactive learning with flashcards",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-base font-semibold text-foreground/90"
                  >
                    <CheckCircle2 className="w-6 h-6 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="mb-6 text-4xl lg:text-5xl font-bold tracking-tight">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-muted-foreground">
              Built specifically with custom components and advanced algorithms
              to ensure you spend less time organizing and more time learning.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/30"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-card/40 border-y border-border/50 px-4 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl lg:text-5xl font-bold tracking-tight">
              Get started in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              A seamless workflow integrated directly into your day-to-day
              routine.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "AI Breakdown",
                desc: "Input your assignment details and let the AI instantly break it into bite-sized actionable subtasks.",
              },
              {
                step: "2",
                title: "Smart Priority",
                desc: "Our engine calculates urgency scores so you always know exactly what to tackle first.",
              },
              {
                step: "3",
                title: "Study Calendar",
                desc: "Seamlessly schedule your required study sessions around your calendar to stay on track.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-5 bg-background p-6 rounded-2xl border border-border/50 shadow-sm"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground shadow-md">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="px-4 py-24 relative overflow-hidden">
        {/* Decorative background components */}
        <div className="absolute right-0 top-0 h-[500px] w-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] bg-blue-500/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-5 bg-background border-border text-foreground px-4 py-1.5 rounded-full text-sm shadow-sm">
              Get In Touch
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              We'd love to hear from you
            </h2>
            <p className="text-lg text-muted-foreground">
              Have questions about the project architecture, want to see our
              code repository, or just want to say hi? Send us a message.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 bg-card border border-border/60 rounded-[2rem] p-3 sm:p-4 shadow-xl">
            {/* Contact Details Card */}
            <div className="lg:col-span-2 bg-foreground text-background p-8 sm:p-10 rounded-[1.5rem] relative overflow-hidden flex flex-col justify-between">
              {/* Abstract shapes inside the dark card */}
              <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/30 rounded-full blur-3xl"></div>
              <div className="absolute top-10 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                  Contact Information
                </h3>
                <p className="text-background/70 mb-10 w-4/5">
                  Fill up the form and our Project Team will get back to you
                  within 24 hours.
                </p>

                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="p-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-background/70 text-sm mb-1">
                        Email Us
                      </p>
                      <p className="font-semibold text-lg">
                        project@my.sliit.lk
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="p-0">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-background/70 text-sm mb-1">Call Us</p>
                      <p className="font-semibold text-lg">+94 70 234 5678</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="p-0">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-background/70 text-sm mb-1">
                        Location
                      </p>
                      <p className="font-semibold text-lg">Malabe, SLIIT</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex gap-4 mt-16 pb-2">
                <a
                  href="#"
                  className="p-2.5 bg-background/10 rounded-full hover:bg-primary transition-colors hover:text-primary-foreground"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 bg-background/10 rounded-full hover:bg-primary transition-colors hover:text-primary-foreground"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 bg-background/10 rounded-full hover:bg-primary transition-colors hover:text-primary-foreground"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3 p-6 sm:p-10 flex flex-col justify-center">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground/80">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border/60 shadow-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground/80">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full bg-background border border-border/60 shadow-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground/80">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full bg-background border border-border/60 shadow-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="john@student.edu"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground/80">
                    Your Message
                  </label>
                  <textarea
                    className="w-full bg-background border border-border/60 shadow-sm rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all h-36 resize-none"
                    placeholder="Write your message here..."
                  ></textarea>
                </div>

                <Button
                  className="w-full py-6 text-base font-bold gap-2 rounded-xl h-14"
                  size="lg"
                >
                  Send Message <Send className="w-5 h-5 ml-1" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Footer */}
      <footer className="bg-card/50 border-t border-border pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <Link to="/home" className="flex items-center gap-3 mb-6">
                <img
                  src="/unitask.png"
                  alt="UniTask Logo"
                  className="h-10 w-10 object-contain drop-shadow-sm"
                />
                <span className="text-2xl font-black text-foreground tracking-tight">
                  Uni<span className="text-primary">Task</span>
                </span>
              </Link>
              <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
                The ultimate academic planner built by students, for students.
                Master your assignments, dynamically generate flashcards, and
                ace your semester with integrated AI.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="p-2.5 bg-background border border-border shadow-sm rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-105"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 bg-background border border-border shadow-sm rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-105"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="p-2.5 bg-background border border-border shadow-sm rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all hover:scale-105"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-foreground mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features Overview
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    AI Flashcards
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Task Prioritization
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Version Log
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="font-bold text-foreground mb-6">Project</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-medium">
                <li>
                  <a
                    href="#about"
                    className="hover:text-primary transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    System Architecture
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    GitHub Repo
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-primary transition-colors"
                  >
                    Contact Team
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 lg:col-span-2 bg-background p-6 rounded-2xl border border-border shadow-sm">
              <h4 className="font-bold text-foreground mb-3">
                Newsletter & Updates
              </h4>
              <p className="text-sm text-muted-foreground mb-5">
                Subscribe to get the latest updates on new features and project
                deployments.
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                />
                <Button>Subscribe</Button>
              </form>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              © {new Date().getFullYear()} UniTask. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span>Made by</span>
              <span className="text-primary">UniTask Team</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
