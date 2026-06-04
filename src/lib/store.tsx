import React, { createContext, useContext, useState, useEffect } from "react";
import { AppState, Meal, UserProfile, WeightEntry, FoodItem } from "../types";
import { format, isSameDay } from "date-fns";
import { db } from "./firebase";
import { collection, doc, query, onSnapshot, getDoc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "./firebaseUtils";

const defaultState: AppState = {
  profile: null as any,
  meals: [],
  weightHistory: [],
};

interface AppContextType extends AppState {
  setProfile: (profile: UserProfile) => void;
  addMeal: (meal: Meal) => void;
  deleteMeal: (id: string) => void;
  addWeightEntry: (entry: WeightEntry) => void;
  getTodayMeals: () => Meal[];
  initializeUser: (uid: string | null) => void;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubUser: () => void;
    let unsubMeals: () => void;
    let unsubWeight: () => void;

    try {
      const userRef = doc(db, "users", uid);
      unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().profile) {
          setState(s => ({ ...s, profile: docSnap.data().profile }));
        } else {
          setState(s => ({ ...s, profile: null as any }));
        }
        setLoading(false);
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`));

      const mealsRef = collection(db, `users/${uid}/meals`);
      unsubMeals = onSnapshot(mealsRef, (snap) => {
        const meals: Meal[] = [];
        snap.forEach(d => meals.push(d.data() as Meal));
        // simple sort by date missing here but assume standard
        setState(s => ({ ...s, meals: meals.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }));
      }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/meals`));
      
      const weightsRef = collection(db, `users/${uid}/weightHistory`);
      unsubWeight = onSnapshot(weightsRef, (snap) => {
        const hist: WeightEntry[] = [];
        snap.forEach(d => hist.push(d.data() as WeightEntry));
        setState(s => ({ ...s, weightHistory: hist.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) }));
      }, (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/weightHistory`));

    } catch (e) {
      console.error(e);
      setLoading(false);
    }

    return () => {
      if (unsubUser) unsubUser();
      if (unsubMeals) unsubMeals();
      if (unsubWeight) unsubWeight();
    };
  }, [uid]);

  const initializeUser = (userId: string | null) => {
    setUid(userId);
  };

  const setProfile = async (profile: UserProfile) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, "users", uid), { profile, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const addMeal = async (meal: Meal) => {
    if (!uid) return;
    try {
      const mealRef = doc(db, `users/${uid}/meals`, meal.id || crypto.randomUUID());
      const m = { ...meal, id: mealRef.id };
      await setDoc(mealRef, m);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/meals`);
    }
  };

  const deleteMeal = async (id: string) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, `users/${uid}/meals`, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${uid}/meals/${id}`);
    }
  };

  const addWeightEntry = async (entry: WeightEntry) => {
    if (!uid) return;
    try {
      const wRef = doc(collection(db, `users/${uid}/weightHistory`));
      const e = { ...entry, id: wRef.id };
      await setDoc(wRef, e);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/weightHistory`);
    }
  };

  const getTodayMeals = () => {
    const today = new Date();
    return state.meals.filter((m) => isSameDay(new Date(m.date), today));
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        setProfile,
        addMeal,
        deleteMeal,
        addWeightEntry,
        getTodayMeals,
        initializeUser,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}
