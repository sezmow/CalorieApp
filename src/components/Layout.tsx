import React from "react";
import { Home, Camera, BarChart3, User, Scan } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../lib/AuthContext";

type Tab = "dashboard" | "log" | "analytics" | "profile";

interface LayoutProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  children: React.ReactNode;
}

export function Layout({ activeTab, setActiveTab, children }: LayoutProps) {
  const { user } = useAuth();
  const navItems = [
    { id: "dashboard" as Tab, label: "Home", icon: Home },
    { id: "log" as Tab, label: "Scan", icon: Scan },
    { id: "analytics" as Tab, label: "Stats", icon: BarChart3 },
    { id: "profile" as Tab, label: "Profile", icon: User },
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="p-8 pb-4">
          <h1 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Scan size={20} className="stroke-[2.5]" />
            </div>
            NutriLens
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-semibold",
                activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon size={20} className={cn("stroke-[2.5]", activeTab === item.id ? "text-emerald-600" : "")} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col relative h-[100dvh]">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-50/80 backdrop-blur-3xl z-10 sticky top-0">
          <div className="flex items-center gap-2.5 font-display font-bold text-xl text-slate-900 tracking-tight">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Scan size={16} className="stroke-[2.5]" />
            </div>
            NutriLens
          </div>
          <button onClick={() => setActiveTab("profile")} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm overflow-hidden active:scale-95 transition-transform">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={18} className="text-slate-500 stroke-[2.5]" />
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 relative scroll-smooth will-change-scroll">
           {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 w-full bg-white border-t border-slate-200 flex items-center justify-around pb-safe pt-2 px-2 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center w-16 p-2 rounded-xl transition-colors",
                activeTab === item.id ? "text-emerald-600" : "text-slate-400 hover:text-slate-500"
              )}
            >
              <div className={cn(
                "mb-1 px-4 py-1.5 rounded-full transition-all",
                activeTab === item.id ? "bg-emerald-50" : "bg-transparent"
              )}>
                 <item.icon size={22} className={cn("stroke-[2.5]", activeTab === item.id ? "text-emerald-600 scale-110" : "scale-100")} />
              </div>
              <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
