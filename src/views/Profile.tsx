import React, { useState } from "react";
import { useAppStore } from "../lib/store";
import { UserProfile } from "../types";
import { calculateTDEE, cn } from "../lib/utils";
import { Save, AlertCircle, LogOut } from "lucide-react";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

export function Profile() {
  const { profile, setProfile } = useAppStore();
  const [formData, setFormData] = useState<UserProfile>(profile!);
  const [saved, setSaved] = useState(false);

  if (!profile) return null;

  const handleChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    const targets = calculateTDEE(
      formData.weightKg,
      formData.heightCm,
      formData.age,
      formData.gender,
      formData.activityLevel,
      formData.goal
    );
    
    const newProfile = { ...formData, targets };
    setProfile(newProfile);
    setFormData(newProfile);
    setSaved(true);
    
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };


  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col gap-1">
        <h2 className="text-slate-500 font-semibold tracking-wide uppercase text-sm mb-1">Your Settings</h2>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">Profile</h1>
      </header>

      <div className="bg-white rounded-3xl p-6 border border-slate-100/50 shadow-sm space-y-6">
        <h3 className="font-display font-bold text-xl text-slate-900 border-b border-slate-100 pb-4">Physical Stats</h3>
        
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
             <label className="text-sm font-bold text-slate-500">Age</label>
             <input 
               type="number" 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-display"
               value={formData.age || ""}
               onChange={(e) => handleChange("age", e.target.value === "" ? "" : Number(e.target.value))}
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-bold text-slate-500">Gender</label>
             <select 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none font-display"
               value={formData.gender}
               onChange={(e) => handleChange("gender", e.target.value)}
             >
                <option value="male">Male</option>
                <option value="female">Female</option>
             </select>
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-bold text-slate-500">Weight (kg)</label>
             <input 
               type="number" 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-display"
               value={formData.weightKg || ""}
               onChange={(e) => handleChange("weightKg", e.target.value === "" ? "" : Number(e.target.value))}
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-bold text-slate-500">Height (cm)</label>
             <input 
               type="number" 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-display"
               value={formData.heightCm || ""}
               onChange={(e) => handleChange("heightCm", e.target.value === "" ? "" : Number(e.target.value))}
             />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100/50 shadow-sm space-y-6">
        <h3 className="font-display font-bold text-xl text-slate-900 border-b border-slate-100 pb-4">Lifestyle & Goals</h3>

        <div className="space-y-6">
          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-500">Activity Level</label>
             <select 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 font-semibold focus:outline-none focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none capitalize font-display"
               value={formData.activityLevel}
               onChange={(e) => handleChange("activityLevel", e.target.value)}
             >
                <option value="sedentary">Sedentary (Little to no exercise)</option>
                <option value="light">Light (Exercise 1-3 days/wk)</option>
                <option value="moderate">Moderate (Exercise 3-5 days/wk)</option>
                <option value="active">Active (Exercise 6-7 days/wk)</option>
                <option value="very_active">Very Active (Intense exercise daily)</option>
             </select>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-500">Primary Goal</label>
             <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "lose", label: "Lose Weight" },
                  { id: "maintain", label: "Maintain" },
                  { id: "gain", label: "Build Muscle" }
                ].map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleChange("goal", g.id)}
                    className={cn(
                      "py-3.5 px-2 rounded-2xl text-sm font-bold border-2 transition-all text-center flex items-center justify-center",
                      formData.goal === g.id 
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm shadow-emerald-500/10"
                        : "bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:text-slate-800"
                    )}
                  >
                    {g.label}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50/50 rounded-3xl p-6 border border-emerald-100/50 relative overflow-hidden">
         <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl" />
         <div className="flex flex-col gap-6 relative z-10">
            <div>
               <h4 className="font-display font-bold text-2xl text-emerald-950 tracking-tight">Calculated Targets</h4>
               <p className="text-sm text-emerald-700/80 font-medium mt-1">
                 Auto-calculated via Mifflin-St Jeor equation. Updates on save.
               </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-white/80 backdrop-blur p-4 rounded-3xl shadow-sm shadow-emerald-900/5 border border-emerald-100/50">
                 <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Calories</span>
                 <span className="text-2xl font-display font-bold text-emerald-600 tracking-tight">{formData.targets.calories}</span>
               </div>
               <div className="bg-white/80 backdrop-blur p-4 rounded-3xl shadow-sm shadow-pink-900/5 border border-pink-100/50">
                 <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Protein</span>
                 <span className="text-2xl font-display font-bold text-pink-500 tracking-tight">{formData.targets.protein}g</span>
               </div>
               <div className="bg-white/80 backdrop-blur p-4 rounded-3xl shadow-sm shadow-amber-900/5 border border-amber-100/50">
                 <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Carbs</span>
                 <span className="text-2xl font-display font-bold text-amber-500 tracking-tight">{formData.targets.carbs}g</span>
               </div>
               <div className="bg-white/80 backdrop-blur p-4 rounded-3xl shadow-sm shadow-indigo-900/5 border border-indigo-100/50">
                 <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Fats</span>
                 <span className="text-2xl font-display font-bold text-indigo-500 tracking-tight">{formData.targets.fats}g</span>
               </div>
            </div>
         </div>
      </div>

      <button
        onClick={handleSave}
        className={cn(
          "w-full py-4 rounded-[1.5rem] font-bold font-display text-lg text-white transition-all flex justify-center items-center gap-2 shadow-xl active:scale-[0.98]",
          saved 
            ? "bg-slate-900 shadow-slate-900/20"
            : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
        )}
      >
        <Save size={20} className="stroke-[2.5]" />
        {saved ? "Profile Saved!" : "Save & Recalculate"}
      </button>

      <div className="pt-8 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-[1.5rem] font-bold font-display text-lg text-red-600 bg-red-50 hover:bg-red-100 transition-all flex justify-center items-center gap-2"
        >
          <LogOut size={20} className="stroke-[2.5]" />
          Log Out
        </button>
      </div>

    </div>
  );
}
