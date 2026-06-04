import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { UserProfile } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';

export function Setup() {
  const { user } = useAuth();
  const { setProfile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    age: 30,
    gender: 'male',
    weightKg: 70,
    heightCm: 175,
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setErrorMsg('');

    const profile: UserProfile = {
      ...formData,
      gender: formData.gender as 'male' | 'female',
      activityLevel: formData.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      goal: formData.goal as 'lose' | 'maintain' | 'gain',
      targets: { calories: 2400, protein: 150, carbs: 250, fats: 80 } // Simplified for now, real app would calc this
    };

    try {
      const path = `users/${user.uid}`;
      await setDoc(doc(db, path), {
        profile,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      setProfile(profile);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
      setErrorMsg(error?.message || 'Failed to save profile. Make sure Firestore is enabled in your Firebase console and your security rules allow writes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white rounded-[2rem] p-8 mt-10 shadow-sm border border-slate-100"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-slate-800 tracking-tight">
            Complete Profile
          </h1>
          <p className="text-slate-500 mt-2">
            Set up your body profile so we can track and calculate your needs accurately.
          </p>
          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {errorMsg}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                required
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
              <input
                type="number"
                required
                value={formData.heightCm}
                onChange={(e) => setFormData({ ...formData, heightCm: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold tracking-wide hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
