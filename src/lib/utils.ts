import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BMR and TDEE Calculators (Mifflin-St Jeor)
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female",
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active",
  goal: "lose" | "maintain" | "gain"
) {
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * age;
  bmr += gender === "male" ? 5 : -161;

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * multipliers[activityLevel];

  // Adjust for goals
  if (goal === "lose") tdee -= 500; // standard ~1 lb/week
  if (goal === "gain") tdee += 300;

  let proteinGrams = 0;
  
  if (goal === "maintain") {
    switch (activityLevel) {
      case "sedentary": proteinGrams = weightKg * 0.8; break;
      case "light": proteinGrams = weightKg * 1.2; break;
      case "moderate": proteinGrams = weightKg * 1.4; break;
      case "active":
      case "very_active": proteinGrams = weightKg * 1.6; break;
    }
  } else if (goal === "lose") {
    switch (activityLevel) {
      case "sedentary": 
      case "light": proteinGrams = weightKg * 1.6; break;
      case "moderate": 
      case "active":
      case "very_active": proteinGrams = weightKg * 2.0; break;
    }
  } else if (goal === "gain") {
    switch (activityLevel) {
      case "sedentary": 
      case "light": proteinGrams = weightKg * 1.4; break;
      case "moderate": 
      case "active":
      case "very_active": proteinGrams = weightKg * 2.2; break;
    }
  }

  let fatsGrams = 0;
  if (goal === "maintain") {
    fatsGrams = weightKg * 1.0;
  } else if (goal === "lose") {
    fatsGrams = weightKg * 0.8;
  } else if (goal === "gain") {
    fatsGrams = weightKg * 1.2;
  }

  // Carbs take the remaining calories
  const proteinCals = proteinGrams * 4;
  const fatsCals = fatsGrams * 9;
  const remainingCals = tdee - proteinCals - fatsCals;
  const carbsGrams = Math.max(0, remainingCals / 4);

  return {
    calories: Math.round(tdee),
    protein: Math.round(proteinGrams),
    carbs: Math.round(carbsGrams),
    fats: Math.round(fatsGrams),
  };
}
