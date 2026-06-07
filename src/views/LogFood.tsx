import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, Type, Sparkles, Check, Plus, Minus, Trash2, ScanLine, Edit3, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { analyzeFoodImage, analyzeFoodText } from "../lib/api";
import { useAppStore } from "../lib/store";
import { FoodItem } from "../types";

type Step = "input" | "processing" | "verify";

export function LogFood({ onLogComplete }: { onLogComplete: () => void }) {
  const [step, setStep] = useState<Step>("input");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<FoodItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addMeal } = useAppStore();

  const [manualText, setManualText] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);
  const manualFormRef = useRef<HTMLDivElement>(null);
  const [manualItem, setManualItem] = useState({
    name: "",
    calories: "" as number | "",
    protein: "" as number | "",
    carbs: "" as number | "",
    fats: "" as number | "",
  });

  const handleManualToggle = () => {
    const nextState = !showManualForm;
    setShowManualForm(nextState);
    if (nextState) {
      setTimeout(() => {
        manualFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      startProcessing(base64String);
    };
    reader.readAsDataURL(file);
  };

  const simulateCameraClick = () => {
    fileInputRef.current?.click();
  };

  const startProcessing = async (base64Image: string) => {
    setStep("processing");
    setErrorMsg(null);
    try {
      const items = await analyzeFoodImage(base64Image);
      setDetectedItems(items);
      setStep("verify");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to analyze image");
      setStep("input");
    }
  };

  const startProcessingText = async () => {
    if (!manualText.trim()) return;
    setIsAnalyzingText(true);
    setErrorMsg(null);
    try {
      const items = await analyzeFoodText(manualText);
      if (items && items.length > 0) {
        const totalCalories = items.reduce((sum, item) => sum + item.calories, 0);
        const totalProtein = items.reduce((sum, item) => sum + item.protein, 0);
        const totalCarbs = items.reduce((sum, item) => sum + item.carbs, 0);
        const totalFats = items.reduce((sum, item) => sum + item.fats, 0);
        
        const name = items.length === 1 ? items[0].name : "Mixed Meal";
        
        setManualItem({
          name,
          calories: Math.round(totalCalories),
          protein: Math.round(totalProtein),
          carbs: Math.round(totalCarbs),
          fats: Math.round(totalFats)
        });
        
        setShowManualForm(true);
        setTimeout(() => {
          manualFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
      setManualText("");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to analyze text");
    } finally {
      setIsAnalyzingText(false);
    }
  };

  const handleManualFormSave = () => {
    if (!manualItem.name || manualItem.calories === "") return;
    
    const newItem: FoodItem = {
      id: crypto.randomUUID(),
      name: manualItem.name,
      calories: Number(manualItem.calories) || 0,
      protein: Number(manualItem.protein) || 0,
      carbs: Number(manualItem.carbs) || 0,
      fats: Number(manualItem.fats) || 0,
      quantity: 1,
      unit: "serving"
    };

    addMeal({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: "meal",
      items: [newItem],
      totalCalories: newItem.calories,
      totalProtein: newItem.protein,
      totalCarbs: newItem.carbs,
      totalFats: newItem.fats
    });
    
    setStep("input");
    setShowManualForm(false);
    setManualItem({ name: "", calories: "", protein: "", carbs: "", fats: "" });
    onLogComplete();
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    setDetectedItems(items => 
      items.map(item => {
        if (item.id === id) {
          const ratio = item.quantity === 0 ? 0 : newQuantity / item.quantity;
          return {
            ...item,
            quantity: newQuantity,
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio),
            carbs: Math.round(item.carbs * ratio),
            fats: Math.round(item.fats * ratio),
          };
        }
        return item;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    setDetectedItems(items => items.filter(i => i.id !== id));
  };

  const calculateTotals = () => {
    return detectedItems.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fats: acc.fats + item.fats,
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  };

  const handleSaveMeal = () => {
    const totals = calculateTotals();
    addMeal({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: "meal", 
      imageUrl: imagePreview || undefined,
      items: detectedItems,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFats: totals.fats
    });
    setStep("input");
    setImagePreview(null);
    setDetectedItems([]);
    onLogComplete();
  };

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto min-h-full flex flex-col relative pb-32 md:pb-10">
       <input 
         type="file" 
         accept="image/*" 
         className="hidden" 
         ref={fileInputRef} 
         onChange={handleImageSelect}
       />

       <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center gap-8 py-10"
            >
              <div className="text-center mb-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-emerald-500 to-emerald-400 text-white flex items-center justify-center rounded-[2rem] mb-6 shadow-xl shadow-emerald-500/20">
                  <ScanLine size={36} className="stroke-[2]" />
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">Log Your Food</h2>
                <p className="text-slate-500 mt-2 text-lg">Scan to instantly identify nutrients.</p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm text-center">
                  {errorMsg}
                </div>
              )}

              <div className="grid gap-4">
                <button 
                  onClick={simulateCameraClick}
                  className="bg-emerald-500 text-white rounded-3xl p-6 flex flex-col items-center gap-4 hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-xl shadow-emerald-500/20"
                >
                  <Camera size={32} className="stroke-[2.5]" />
                  <span className="font-display font-bold text-xl tracking-tight">Camera / Upload</span>
                </button>

                <button
                  onClick={handleManualToggle}
                  className="bg-white border border-slate-200 text-slate-700 rounded-3xl p-4 md:p-6 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
                >
                  <Edit3 size={24} className="text-slate-400" />
                  <span className="font-display font-bold text-lg tracking-tight">Enter Manually</span>
                </button>

                <AnimatePresence>
                  {showManualForm && (
                    <motion.div
                      ref={manualFormRef}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm mt-2">
                        <h3 className="font-display font-bold text-lg text-slate-800">Manual Entry</h3>
                        <input
                          type="text"
                          placeholder="Food Name"
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                          value={manualItem.name}
                          onChange={(e) => setManualItem({ ...manualItem, name: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-[10px] font-bold text-orange-500 uppercase tracking-wider pointer-events-none">
                              CAL
                            </div>
                            <input
                              type="number"
                              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium text-slate-800"
                              value={manualItem.calories}
                              onChange={(e) => setManualItem({ ...manualItem, calories: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-[11px] font-bold text-blue-500 pointer-events-none">
                              P
                            </div>
                            <input
                              type="number"
                              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium text-slate-800"
                              value={manualItem.protein}
                              onChange={(e) => setManualItem({ ...manualItem, protein: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-[11px] font-bold text-purple-500 pointer-events-none">
                              C
                            </div>
                            <input
                              type="number"
                              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium text-slate-800"
                              value={manualItem.carbs}
                              onChange={(e) => setManualItem({ ...manualItem, carbs: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-4 text-[11px] font-bold text-amber-500 pointer-events-none">
                              F
                            </div>
                            <input
                              type="number"
                              className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition font-medium text-slate-800"
                              value={manualItem.fats}
                              onChange={(e) => setManualItem({ ...manualItem, fats: e.target.value === "" ? "" : Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <button
                          onClick={handleManualFormSave}
                          disabled={!manualItem.name || manualItem.calories === ""}
                          className="w-full bg-emerald-500 text-white font-bold py-3.5 rounded-xl mt-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition"
                        >
                          Log Food
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative mt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-50 text-slate-500 font-semibold tracking-wide uppercase">OR</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-3 pl-4 pr-3 shadow-sm flex items-start gap-2 group focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                  <Type size={20} className="text-slate-400 shrink-0 mt-1" />
                  <textarea
                    placeholder="Describe what you ate... (e.g. 2 eggs on toast)"
                    className="w-full bg-transparent resize-none h-24 outline-none text-slate-700 placeholder:text-slate-400 text-sm"
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        startProcessingText();
                      }
                    }}
                  />
                  <button 
                    onClick={startProcessingText}
                    disabled={!manualText.trim() || isAnalyzingText}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white p-2.5 rounded-2xl shrink-0 transition-colors self-end"
                    title="Input details for me"
                  >
                    {isAnalyzingText ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin m-[1px]" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-20"
            >
              <div className="relative w-56 h-56 md:w-72 md:h-72 rounded-[2.5rem] overflow-hidden mb-10 border-4 border-white shadow-2xl">
                 <img src={imagePreview!} alt="Original" className="w-full h-full object-cover" />
                 <motion.div 
                   className="absolute top-0 left-0 w-full h-1 bg-emerald-400 shadow-[0_0_30px_theme(colors.emerald.400)]"
                   animate={{ y: ["0%", "280px", "0%"] }}
                   transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                 />
                 <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
              </div>
              <Sparkles className="animate-pulse text-emerald-500 mb-4" size={36} />
              <h3 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Analyzing Nutrients</h3>
              <p className="text-slate-500 mt-2 text-lg">AI is detecting portions & macros...</p>
            </motion.div>
          )}

          {step === "verify" && (
            <motion.div 
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col flex-1 space-y-6"
            >
              <div className="shrink-0 relative h-48 md:h-64 w-full rounded-[2rem] overflow-hidden shadow-sm">
                 <img src={imagePreview!} alt="Detected Meal" className="w-full h-full object-cover" />
                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent p-6 pt-16 text-white text-shadow">
                   <h3 className="font-display font-bold text-2xl flex items-center gap-2">
                     <Sparkles size={20} className="text-emerald-400" />
                     Analysis Ready
                   </h3>
                 </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="font-display font-bold text-slate-900 text-xl tracking-tight">Detected Items</h4>
                  <button className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full">
                    <Plus size={16} /> Add 
                  </button>
                </div>

                {detectedItems.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No items detected. Try adding manually.</div>
                )}

                {detectedItems.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check size={20} className="stroke-[2.5]" />
                        </div>
                        <span className="font-semibold text-slate-800 text-lg">{item.name}</span>
                      </div>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-slate-400 hover:text-red-500 transition p-2 bg-slate-50 rounded-xl">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pl-14">
                      <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 10))}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm text-slate-600 active:scale-95 transition-transform"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-16 text-center font-bold text-slate-700 text-sm">{item.quantity}{item.unit}</span>
                        <button 
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 10)}
                          className="w-8 h-8 flex items-center justify-center bg-emerald-500 rounded-lg shadow-sm text-white active:scale-95 transition-transform"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-display font-bold text-slate-800 text-xl tracking-tight">{item.calories} <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">kcal</span></span>
                        <div className="flex gap-2 text-xs font-semibold mt-1">
                          <span className="text-pink-600">{item.protein}P</span>
                          <span className="text-amber-500">{item.carbs}C</span>
                          <span className="text-indigo-600">{item.fats}F</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-white border border-slate-100 p-6 rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20 mb-4">
                 <div className="flex justify-between items-end mb-4 px-2">
                   <span className="text-slate-500 font-semibold tracking-wide uppercase text-sm">Totals</span>
                   <div className="text-right">
                     <span className="font-display font-bold text-4xl text-slate-900 tracking-tighter leading-none">{calculateTotals().calories}</span>
                     <span className="text-xs text-slate-400 font-bold uppercase tracking-widest ml-1">kcal</span>
                   </div>
                 </div>
                 <button 
                   onClick={handleSaveMeal}
                   className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/30 hover:bg-emerald-600 transition active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                 >
                   <Check size={24} className="stroke-[2.5]" />
                   Save to Diary
                 </button>
              </div>
            </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
}
