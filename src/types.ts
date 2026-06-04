export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  date: string; // ISO string
  type: "breakfast" | "lunch" | "dinner" | "snack";
  imageUrl?: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
}

export interface UserProfile {
  age: number;
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose" | "maintain" | "gain";
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface WeightEntry {
  date: string;
  weightKg: number;
}

export interface AppState {
  profile: UserProfile | null;
  meals: Meal[];
  weightHistory: WeightEntry[];
}
