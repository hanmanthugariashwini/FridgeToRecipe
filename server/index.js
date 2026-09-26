import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Get current file and folder paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// React production build folder
const frontendPath = path.join(__dirname, "..", "dist");

app.use(cors());
app.use(express.json());

// ========================================
// RECIPE API
// ========================================

app.post("/api/recipe", async (req, res) => {
  try {
    const ingredients = String(
      req.body?.ingredients || ""
    ).trim();

    if (!ingredients) {
      return res.status(400).json({
        error: "Please enter at least one ingredient."
      });
    }

    if (ingredients.length > 2000) {
      return res.status(400).json({
        error:
          "Please keep the ingredient list under 2000 characters."
      });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GROQ_API_KEY is missing from environment variables."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "openai/gpt-oss-20b",

          messages: [
            {
              role: "system",
              content:
                "You are a helpful cooking assistant. Return only valid JSON."
            },

            {
              role: "user",
              content: `
Create ONE practical recipe using these ingredients:

${ingredients}

Return exactly this JSON structure:

{
  "title": "Recipe name",
  "description": "Short description",
  "servings": 2,
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "amount"
    }
  ],
  "steps": [
    "Step 1",
    "Step 2"
  ],
  "swaps": [
    "Possible substitution"
  ],
  "kitchenTip": "Useful cooking tip"
}

Make the recipe simple and realistic.
`
            }
          ],

          temperature: 0.3,

          response_format: {
            type: "json_object"
          }
        })
      }
    );

    const data = await response.json();

    console.log("Groq status:", response.status);

    if (!response.ok) {
      console.error(
        "Groq API error:",
        JSON.stringify(data, null, 2)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `Groq API error (${response.status})`
      });
    }

    const text =
      data?.choices?.[0]?.message?.content;

    console.log("Groq content:", text);

    if (!text) {
      console.error(
        "FULL GROQ RESPONSE:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        error: "Groq returned an empty response."
      });
    }

    let recipe;

    try {
      recipe = JSON.parse(text);
    } catch (error) {
      console.error(
        "JSON parsing error:",
        error
      );

      console.error(
        "Raw response:",
        text
      );

      return res.status(502).json({
        error: "Groq returned invalid JSON."
      });
    }

    if (
      !recipe.title ||
      !recipe.description ||
      !Number.isFinite(Number(recipe.servings)) ||
      !Array.isArray(recipe.ingredients) ||
      !Array.isArray(recipe.steps) ||
      !Array.isArray(recipe.swaps) ||
      !recipe.kitchenTip
    ) {
      console.error(
        "Invalid recipe returned:",
        JSON.stringify(recipe, null, 2)
      );

      return res.status(502).json({
        error: "Groq returned an incomplete recipe."
      });
    }

    console.log(
      "FINAL RECIPE:",
      JSON.stringify(recipe, null, 2)
    );

    return res.json(recipe);

  } catch (error) {
    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Something went wrong while creating the recipe."
    });
  }
});

// ========================================
// HEALTH CHECK
// ========================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true
  });
});

// ========================================
// SERVE REACT FRONTEND
// ========================================

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(
    path.join(frontendPath, "index.html")
  );
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `API server running on http://localhost:${PORT}`
  );
});