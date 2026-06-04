import { FoodItem } from "../types";

export async function analyzeFoodImage(imageBase64: string): Promise<FoodItem[]> {
  try {
    const response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to analyze image");
    }

    const items = await response.json();

    return items.map((item: any) => ({
      ...item,
      id: crypto.randomUUID(),
    }));
  } catch (error: any) {
    console.error("Error analyzing food:", error);
    throw new Error(error.message || "Failed to analyze image");
  }
}

