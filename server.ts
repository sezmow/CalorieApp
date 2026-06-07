import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API routes FIRST
  app.post("/api/analyze-food", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing image data" });
      }

      const matches = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 image encoding" });
      }

      const mimeType = matches[1];
      const data = matches[2];

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const imagePart = {
        inlineData: {
          mimeType,
          data,
        },
      };

      const promptString = `Analyze this image of food or a meal. Identify the individual food items present. For each item, estimate a reasonable quantity (in grams, ml, or standard units), and calculate the estimated macros: calories, protein (in grams), carbohydrates (in grams), and fats (in grams). Return a list of the identified items.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, { text: promptString }] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of identified food items with estimated macros",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the food item" },
                quantity: { type: Type.NUMBER, description: "Estimated quantity (numeric value only)" },
                unit: { type: Type.STRING, description: "Unit of the quantity (e.g., 'g', 'ml', 'oz', 'piece')" },
                calories: { type: Type.NUMBER, description: "Estimated total calories for this item's quantity" },
                protein: { type: Type.NUMBER, description: "Estimated protein in grams for this item" },
                carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams for this item" },
                fats: { type: Type.NUMBER, description: "Estimated fats in grams for this item" },
              },
              required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fats"],
            },
          },
        },
      });

      const jsonStr = response.text?.trim() || "[]";
      const items = JSON.parse(jsonStr);
      res.json(items);
    } catch (error: any) {
      console.error("Error analyzing food:", error);
      
      let errorMessage = error.message || "Failed to analyze image";
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Not JSON, keep original
      }

      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
        errorMessage = "The AI service is currently experiencing high demand. Please try again in a few moments or enter the details manually.";
      } else if (errorMessage.includes("401") || errorMessage.includes("authentication") || errorMessage.includes("API key")) {
        errorMessage = "Invalid Gemini API Key. Please provide a valid API key in the application settings.";
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  app.post("/api/analyze-food-text", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text description" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
         return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const promptString = `Analyze this description of food or a meal: "${text}". Identify the individual food items present. For each item, estimate a reasonable quantity (in grams, ml, or standard units), and calculate the estimated macros: calories, protein (in grams), carbohydrates (in grams), and fats (in grams). Return a list of the identified items.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { text: promptString },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "List of identified food items with estimated macros",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the food item" },
                quantity: { type: Type.NUMBER, description: "Estimated quantity (numeric value only)" },
                unit: { type: Type.STRING, description: "Unit of the quantity (e.g., 'g', 'ml', 'oz', 'piece')" },
                calories: { type: Type.NUMBER, description: "Estimated total calories for this item's quantity" },
                protein: { type: Type.NUMBER, description: "Estimated protein in grams for this item" },
                carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams for this item" },
                fats: { type: Type.NUMBER, description: "Estimated fats in grams for this item" },
              },
              required: ["name", "quantity", "unit", "calories", "protein", "carbs", "fats"],
            },
          },
        },
      });

      const jsonStr = response.text?.trim() || "[]";
      const items = JSON.parse(jsonStr);
      res.json(items);
    } catch (error: any) {
      console.error("Error analyzing text:", error);
      
      let errorMessage = error.message || "Failed to analyze text description";
      
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Not JSON, keep original
      }

      if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
        errorMessage = "The AI service is currently experiencing high demand. Please try again in a few moments or enter the details manually.";
      } else if (errorMessage.includes("401") || errorMessage.includes("authentication") || errorMessage.includes("API key")) {
        errorMessage = "Invalid Gemini API Key. Please provide a valid API key in the application settings.";
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
