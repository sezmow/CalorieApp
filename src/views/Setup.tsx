import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../lib/store';
import { UserProfile } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { calculateTDEE } from '../lib/utils';

export function Setup() {
  const { user } = useAuth();
  const { setProfile } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    age: '' as number | '',
    gender: 'male',
    weightLbs: '' as number | '',
    heightFeet: '' as number | '',
    heightInches: 0,
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setErrorMsg('');

    const targets = calculateTDEE(
      formData.weightLbs as number,
      formData.heightFeet as number,
      formData.heightInches as number,
      formData.age as number,
      formData.gender as 'male' | 'female',
      formData.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      formData.goal as 'lose' | 'maintain' | 'gain'
    );

    const profile: UserProfile = {
      ...formData,
      age: formData.age as number,
      weightLbs: formData.weightLbs as number,
      heightFeet: formData.heightFeet as number,
      heightInches: formData.heightInches as number,
      gender: formData.gender as 'male' | 'female',
      activityLevel: formData.activityLevel as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      goal: formData.goal as 'lose' | 'maintain' | 'gain',
      targets
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
                onChange={(e) => setFormData({ ...formData, age: e.target.value === '' ? '' : Number(e.target.value) })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (lbs)</label>
              <input
                type="number"
                required
                value={formData.weightLbs}
                onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value === '' ? '' : Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height</label>
              <div className="flex flex-col gap-2">
                <input
                  type="number"
                  required
                  placeholder="Feet"
                  value={formData.heightFeet}
                  onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value === '' ? '' : Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                <select
                  value={formData.heightInches}
                  onChange={(e) => setFormData({ ...formData, heightInches: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                >
                  <option value={0}>0 inches</option>
                  {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                    <option key={i} value={i}>{i} inches</option>
                  ))}
                </select>
              </div>
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
