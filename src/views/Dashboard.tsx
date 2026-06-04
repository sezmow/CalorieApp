import React from "react";
import { useAppStore } from "../lib/store";
import { Flame, Target, Zap, Clock, ChevronRight, Camera, Scan } from "lucide-react";
import { format, subDays, isSameDay } from "date-fns";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export function Dashboard() {
  const { profile, getTodayMeals, meals } = useAppStore();
  const todayMeals = getTodayMeals();

  if (!profile) return null;

  const targets = profile.targets;

  const consumed = todayMeals.reduce(
    (acc, meal) => {
      acc.calories += meal.totalCalories;
      acc.protein += meal.totalProtein;
      acc.carbs += meal.totalCarbs;
      acc.fats += meal.totalFats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const calPercentage = Math.min((consumed.calories / targets.calories) * 100, 100);

  // SVG dimensions
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (calPercentage / 100) * circumference;

  // Compute Streak basically
  const streak = React.useMemo(() => {
     let currentStreak = 0;
     let dateToCheck = new Date();
     while (true) {
        const hasMealThatDay = meals.some(m => isSameDay(new Date(m.date), dateToCheck));
        if (hasMealThatDay) {
           currentStreak++;
           dateToCheck = subDays(dateToCheck, 1);
        } else if (isSameDay(dateToCheck, new Date())) {
           // Allow today to be missed, check yesterday
           dateToCheck = subDays(dateToCheck, 1);
        } else {
           break;
        }
     }
     return currentStreak;
  }, [meals]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-slate-500 font-semibold tracking-wide uppercase text-sm mb-1">Overview</h2>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">Today's Progress</h1>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all",
          streak > 0 ? "bg-orange-100 text-orange-600 shadow-sm" : "bg-slate-100 text-slate-500"
        )}>
          <Flame size={18} className={cn(streak > 0 ? "fill-orange-500" : "fill-slate-400")} />
          <span>{streak} Day Streak</span>
        </div>
      </header>

      {/* Main Stats Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100/50 flex flex-col md:flex-row items-center gap-12"
      >
        {/* Calorie Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg width={size} height={size} className="transform -rotate-90 drop-shadow-md">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-slate-100"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={cn("transition-all duration-1000 ease-out", 
                calPercentage > 100 ? "text-rose-500" : "text-emerald-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-display font-bold text-slate-900 tracking-tighter leading-none">{consumed.calories}</span>
            <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mt-2">/ {targets.calories} kcal</span>
          </div>
        </div>

        {/* Macro Bars */}
        <div className="flex-1 w-full space-y-6">
          <MacroBar 
            label="Protein" 
            consumed={consumed.protein} 
            target={targets.protein} 
            colorClass="bg-pink-500"
            bgClass="bg-pink-50"
            unit="g"
          />
          <MacroBar 
            label="Carbs" 
            consumed={consumed.carbs} 
            target={targets.carbs} 
            colorClass="bg-amber-400"
            bgClass="bg-amber-50"
            unit="g"
          />
          <MacroBar 
            label="Fats" 
            consumed={consumed.fats} 
            target={targets.fats} 
            colorClass="bg-indigo-500"
            bgClass="bg-indigo-50"
            unit="g"
          />
        </div>
      </motion.div>

      {/* Timeline Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-display font-bold text-slate-800 tracking-tight">Meals Logged</h3>
          <span className="text-sm font-semibold text-slate-400">{format(new Date(), 'MMM d, yyyy')}</span>
        </div>

        <div className="space-y-4">
          {todayMeals.length === 0 ? (
            <div className="bg-white border text-center border-slate-200 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4">
                 <Scan size={32} className="stroke-[2]" />
              </div>
              <h4 className="text-slate-800 font-display font-bold text-lg">No meals recorded yet</h4>
              <p className="text-slate-500 mt-1 max-w-[200px]">Scan your food to instantly log nutritional info.</p>
            </div>
          ) : (
            todayMeals.map((meal, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={meal.id} 
                className="bg-white rounded-3xl p-4 flex items-center justify-between shadow-sm shadow-slate-100/50 border border-slate-100/50"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-display font-bold text-slate-900 text-lg capitalize tracking-tight truncate text-ellipsis">
                    {meal.items.length > 0 ? meal.items.map(img => img.name).join(", ") : meal.type}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <span className="block font-display font-bold text-2xl text-emerald-600 tracking-tight leading-none mb-1">{meal.totalCalories}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">kcal</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, target, colorClass, bgClass, unit }: { 
  label: string; consumed: number; target: number; colorClass: string; bgClass: string, unit: string 
}) {
  const percentage = Math.min((consumed / target) * 100, 100);
  
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="font-semibold text-slate-800 tracking-tight">{label}</span>
        <span className="text-slate-500 font-medium text-sm"><span className="text-slate-800 font-bold">{consumed}</span> / {target}{unit}</span>
      </div>
      <div className={cn("h-4 w-full rounded-full overflow-hidden", bgClass)}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorClass)} 
        />
      </div>
    </div>
  );
}
