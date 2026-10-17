import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  BookOpen,
  LogOut,
  User,
  BrainCircuit,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Target,
  BarChart2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import NotificationBell from "../components/NotificationBell";
import { AIAssignmentChatbot } from "@/components/AIAssignmentChatbot";

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: "Overview",
      path: "/dashboard",
    },
    {
      icon: <BookOpen size={20} />,
      label: "My Assignments",
      path: "/assignments",
    },
    {
      icon: <Target size={20} />,
      label: "Smart Priority",
      path: "/smart-priority",
    },
    { icon: <Calendar size={20} />, label: "Calendar", path: "/calendar" },
    { icon: <Users size={20} />, label: "Study Groups", path: "/groups" },
    {
      icon: <BarChart2 size={20} />,
      label: "Analytics",
      path: "/analytics",
    },
    {
      icon: <BrainCircuit size={20} />,
      label: "Flashcards",
      path: "/study-materials",
    },
  ];

  const currentNav = navItems.find((i) => i.path === location.pathname);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* ── MOBILE OVERLAY ─────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 bg-white border-r border-slate-200/60
          transform transition-all duration-300 ease-in-out flex flex-col z-50
          ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          ${isSidebarCollapsed ? "md:w-[72px]" : "w-[280px]"}
        `}
        style={{ minWidth: 0 }}
      >
        {/* LOGO ROW */}
        <div className="h-20 flex items-center justify-between px-4 shrink-0 border-b border-slate-100/80">
          {/* Logo — hidden when collapsed on desktop */}
          <Link
            to="/"
            className={`text-2xl font-black text-slate-800 flex items-center gap-3 tracking-tight group overflow-hidden
              ${isSidebarCollapsed ? "md:hidden" : ""}`}
          >
            <img
              src="/unitask.png"
              alt="UniTask Logo"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <span className="whitespace-nowrap mt-0.5">
              Uni<span className="text-blue-600">Task</span>
            </span>
          </Link>

          {/* Collapsed: just the logo image */}
          {isSidebarCollapsed && (
            <Link
              to="/"
              className="hidden md:flex items-center justify-center mx-auto hover:scale-105 transition-transform duration-300"
            >
              <img
                src="/unitask.png"
                alt="UniTask Logo"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            </Link>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAV */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div
            className={`flex items-center mb-4 transition-all duration-300 ${isSidebarCollapsed ? "justify-center" : "justify-between px-2"}`}
          >
            <p
              className={`text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-200 ${isSidebarCollapsed ? "md:w-0 md:opacity-0 hidden md:block" : "opacity-100"}`}
            >
              Main Menu
            </p>
            <button
              onClick={() => setIsSidebarCollapsed((c) => !c)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200/50 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md transition-all duration-300 group"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />
              ) : (
                <PanelLeftClose
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />
              )}
            </button>
          </div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="relative group/tip">
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200
                    font-medium text-[15px] overflow-hidden
                    ${
                      isActive
                        ? "bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100/50"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }
                    ${isSidebarCollapsed ? "md:justify-center md:px-0" : ""}
                  `}
                >
                  {/* Active left-bar indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/50" />
                  )}

                  {/* Icon */}
                  <div
                    className={`
                    flex items-center justify-center shrink-0 transition-all duration-200
                    ${isActive ? "text-blue-600 scale-110" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110"}
                    ${isSidebarCollapsed ? "md:mx-auto" : ""}
                  `}
                  >
                    {item.icon}
                  </div>

                  {/* Label — hidden in collapsed mode on desktop */}
                  <span
                    className={`whitespace-nowrap transition-all duration-200
                    ${isSidebarCollapsed ? "md:hidden" : ""}
                  `}
                  >
                    {item.label}
                  </span>

                  {/* Chevron */}
                  {isActive && !isSidebarCollapsed && (
                    <ChevronRight
                      size={16}
                      className="ml-auto text-blue-600/50"
                    />
                  )}
                </Link>

                {/* Tooltip — only in collapsed desktop mode */}
                {isSidebarCollapsed && (
                  <span
                    className="hidden md:group-hover/tip:flex absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2
                                   items-center whitespace-nowrap bg-slate-800 text-white text-xs font-medium
                                   px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-[60]
                                   before:content-[''] before:absolute before:-left-1 before:top-1/2 before:-translate-y-1/2
                                   before:border-4 before:border-transparent before:border-r-slate-800"
                  >
                    {item.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* BOTTOM USER CARD */}
        <div
          className={`p-3 border-t border-slate-100/80 mt-auto bg-slate-50/30 shrink-0
                         transition-all duration-300`}
        >
          <div
            className={`bg-white rounded-2xl p-3 flex items-center gap-3 border border-slate-200/60
                           shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden
                           ${isSidebarCollapsed ? "md:justify-center md:px-1" : ""}`}
          >
            <div
              className="h-9 w-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center
                            justify-center text-blue-700 font-bold border border-blue-200 shadow-inner shrink-0"
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* HEADER */}
        <header
          className={`
          h-20 bg-white/70 backdrop-blur-xl border-slate-200/60
          flex justify-between items-center px-4 md:px-6 z-30 transition-all duration-300
          border-b ${scrolled ? "shadow-sm border-slate-200 bg-white/90" : "border-transparent"}
        `}
        >
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 text-slate-500 bg-white border border-slate-200/60
                         hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <Menu
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
            </button>

            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                {currentNav?.label || "Dashboard"}
              </h1>
            </div>
          </div>

          {/* RIGHT SIDE ACTIONS */}
          <div className="relative flex items-center gap-3 sm:gap-4">
            {/* NOTIFICATION BELL */}
            <NotificationBell />

            {/* PROFILE DROPDOWN */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen((p) => !p)}
                className="flex items-center gap-2 hover:bg-slate-50 p-1 rounded-2xl transition-all
                           border border-transparent hover:border-slate-200"
              >
                <div
                  className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex
                                items-center justify-center text-white font-bold shadow-md shadow-blue-500/20
                                hover:shadow-lg transition-shadow"
                >
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
              </button>

              {isProfileOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] w-60 bg-white border border-slate-200/80
                                rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden z-50"
                >
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <div
                      className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center
                                    text-blue-700 font-bold border border-blue-200"
                    >
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/profile");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-600 font-medium
                                 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <User size={16} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate("/dashboard");
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-600 font-medium
                                 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Settings size={16} /> Account Settings
                    </button>
                    <div className="h-px bg-slate-100 my-1 mx-2" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl
                                 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          id="main-scroll-area"
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"
          onScroll={(e) => setScrolled(e.target.scrollTop > 10)}
        >
          <div className="mx-auto h-full w-full">
            <Outlet />
          </div>
        </main>

        {/* Global Chatbot - Only show on Calendar page */}
        <AIAssignmentChatbot />
      </div>
    </div>
  );
};

export default DashboardLayout;
