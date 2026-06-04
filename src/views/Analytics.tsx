import React, { useState, useMemo, useEffect } from "react";
import { useAppStore } from "../lib/store";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "../lib/utils";
import { format, subDays, isSameDay } from "date-fns";
import { motion } from "motion/react";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";

type Timeframe = "week" | "month";

export function Analytics() {
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const { profile, meals, weightHistory } = useAppStore();

  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );

  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    const firstDay = new Date(currentYear, selectedMonth, 1);
    let startOfWeek = new Date(firstDay);
    startOfWeek.setDate(firstDay.getDate() - firstDay.getDay()); // Sunday

    while (startOfWeek.getMonth() === selectedMonth || startOfWeek < firstDay) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        week.push(d);
      }
      weeks.push(week);
      startOfWeek.setDate(startOfWeek.getDate() + 7);
    }
    return weeks;
  }, [selectedMonth, currentYear]);

  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

  useEffect(() => {
    if (selectedMonth === new Date().getMonth()) {
      const today = new Date();
      const index = calendarWeeks.findIndex((week) =>
        week.some((d) => isSameDay(d, today)),
      );
      setSelectedWeekIndex(index >= 0 ? index : calendarWeeks.length - 1);
    } else {
      setSelectedWeekIndex(0);
    }
  }, [selectedMonth, calendarWeeks]);

  if (!profile) return null;

  const safeWeekIndex = Math.min(selectedWeekIndex, calendarWeeks.length - 1);
  const handlePrevWeek = () =>
    setSelectedWeekIndex(Math.max(0, safeWeekIndex - 1));
  const handleNextWeek = () =>
    setSelectedWeekIndex(Math.min(calendarWeeks.length - 1, safeWeekIndex + 1));

  const formatWeekRange = (week: Date[]) => {
    if (!week || week.length === 0) return "";
    return `${week[0].getMonth() + 1}/${week[0].getDate()} - ${week[6].getMonth() + 1}/${week[6].getDate()}`;
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDayAbbrev = (d: Date) =>
    ["S", "M", "T", "W", "Th", "F", "Sa"][d.getDay()];

  const getChartData = () => {
    if (timeframe === "week") {
      return Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayMeals = meals.filter((m) => isSameDay(new Date(m.date), d));
        const cals = dayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
        return {
          name: getDayAbbrev(d),
          calories: cals,
        };
      });
    } else {
      const week = calendarWeeks[safeWeekIndex] || [];
      return week.map((d) => {
        const dayMeals = meals.filter((m) => isSameDay(new Date(m.date), d));
        const cals = dayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
        return {
          name: getDayAbbrev(d),
          calories: cals,
        };
      });
    }
  };

  const chartData = getChartData();

  // Calculate Macro Distribution for the period
  const totalMacros = meals.reduce(
    (acc, m) => {
      acc.protein += m.totalProtein;
      acc.carbs += m.totalCarbs;
      acc.fats += m.totalFats;
      return acc;
    },
    { protein: 0, carbs: 0, fats: 0 },
  );

  const hasMacros =
    totalMacros.protein > 0 || totalMacros.carbs > 0 || totalMacros.fats > 0;

  const macroData = [
    { name: "Protein", value: totalMacros.protein, color: "#ec4899" },
    { name: "Carbs", value: totalMacros.carbs, color: "#fbbf24" },
    { name: "Fats", value: totalMacros.fats, color: "#6366f1" },
  ];

  // Format weight data
  const weightData = weightHistory.map((w) => ({
    name: format(new Date(w.date), "MMM d"),
    weight: w.weightKg,
  }));

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-slate-500 font-semibold tracking-wide uppercase text-sm mb-1">
          Your Trends
        </h2>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight">
          Analytics
        </h1>
      </header>

      {/* Timeframe Toggles */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex max-w-sm">
        {(["week", "month"] as Timeframe[]).map((t) => (
          <button
            key={t}
            onClick={() => setTimeframe(t)}
            className={cn(
              "flex-1 py-2.5 text-sm font-bold capitalize rounded-xl transition-all",
              timeframe === t
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Calories Bar Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100/50 shadow-sm md:col-span-2"
        >
          <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight flex items-center gap-3">
                Calorie Intake
                {timeframe === "month" && (
                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg tracking-normal font-sans">
                    {formatWeekRange(calendarWeeks[safeWeekIndex])}
                  </span>
                )}
              </h3>
              <p className="text-slate-500 font-medium">
                Daily target:{" "}
                <span className="text-slate-800 font-bold">
                  {profile.targets.calories}
                </span>{" "}
                <span className="uppercase text-[10px] tracking-widest font-bold">
                  kcal
                </span>
              </p>
            </div>

            {timeframe === "month" && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent pl-3 pr-2 py-1.5 text-sm font-bold text-slate-700 outline-none cursor-pointer appearance-none"
                >
                  {months.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="w-px h-5 bg-slate-200" />
                <div className="flex gap-1">
                  <button
                    onClick={handlePrevWeek}
                    disabled={safeWeekIndex === 0}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                  >
                    <ChevronLeft size={20} className="stroke-[2.5]" />
                  </button>
                  <button
                    onClick={handleNextWeek}
                    disabled={safeWeekIndex === calendarWeeks.length - 1}
                    className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 text-slate-600 transition-colors"
                  >
                    <ChevronRight size={20} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                  dy={10}
                  interval={0}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "16px",
                    border: "none",
                    boxShadow:
                      "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                  formatter={(value: number) => [`${value}`, "Calories"]}
                  labelFormatter={(label: string) => {
                    const dayMap: Record<string, string> = { "M": "Monday", "T": "Tuesday", "W": "Wednesday", "Th": "Thursday", "F": "Friday", "Sa": "Saturday", "S": "Sunday" };
                    return dayMap[label] || label;
                  }}
                />
                <ReferenceLine
                  y={profile.targets.calories}
                  stroke="#cbd5e1"
                  strokeDasharray="6 6"
                />
                <Bar
                  dataKey="calories"
                  fill="#10b981"
                  radius={[8, 8, 8, 8]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Macro Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-3xl border border-slate-100/50 shadow-sm flex flex-col items-center"
        >
          <div className="w-full mb-6 text-center">
            <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Macros
            </h3>
            <p className="text-slate-500 font-medium tracking-tight">
              Average breakdown
            </p>
          </div>

          {hasMacros ? (
            <div className="h-56 w-full flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {macroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                      fontWeight: 600,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                  100%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Activity size={32} className="text-slate-200 mb-2" />
              <span className="font-medium">No logs yet</span>
            </div>
          )}

          <div className="flex justify-center gap-6 w-full mt-6 text-sm font-bold">
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-3 h-3 rounded-full bg-pink-500" /> Protein
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-3 h-3 rounded-full bg-amber-400" /> Carbs
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <div className="w-3 h-3 rounded-full bg-indigo-500" /> Fats
            </div>
          </div>
        </motion.div>

        {/* Weight Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-3xl border border-slate-100/50 shadow-sm"
        >
          <div className="mb-8">
            <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight">
              Weight
            </h3>
            <p className="text-slate-500 font-medium tracking-tight">
              Current:{" "}
              <span className="font-bold text-slate-800">
                {profile.weightKg} kg
              </span>
            </p>
          </div>
          {weightData.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weightData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 600 }}
                    domain={["dataMin - 2", "dataMax + 2"]}
                  />
                  <Tooltip
                    cursor={{
                      stroke: "#cbd5e1",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  />
                  <Line
                    type="step"
                    dataKey="weight"
                    stroke="#0f172a"
                    strokeWidth={4}
                    dot={{
                      r: 6,
                      fill: "#0f172a",
                      strokeWidth: 3,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 h-56 flex flex-col items-center justify-center text-slate-400">
              <Activity size={32} className="text-slate-200 mb-2" />
              <span className="font-medium">No history yet</span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
