const path = require("path");
const express = require("express");
const OpenAI = require("openai");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.warn("Missing OPENAI_API_KEY in .env");
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "web")));

const toNumber = (value, fallback) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toInt = (value, fallback) => {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : fallback;
};

app.post("/api/generate", async (req, res) => {
  try {
    const {
      system,
      prompt,
      temperature,
      max_output_tokens,
      top_p,
      frequency_penalty,
      presence_penalty
    } = req.body || {};

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const input = [];
    if (system && typeof system === "string" && system.trim().length > 0) {
      input.push({ role: "system", content: system.trim() });
    }
    input.push({ role: "user", content: prompt });

    const request = {
      model: "gpt-4.1",
      input,
      temperature: toNumber(temperature, 0.7),
      max_output_tokens: toInt(max_output_tokens, 1024),
      top_p: toNumber(top_p, 1),
      frequency_penalty: toNumber(frequency_penalty, 0),
      presence_penalty: toNumber(presence_penalty, 0),
      text: { format: { type: "text" } }
    };

    const response = await client.responses.create(request);

    let outputText = "";
    if (response.output_text) {
      outputText = response.output_text;
    } else if (Array.isArray(response.output)) {
      outputText = response.output
        .map((item) =>
          Array.isArray(item.content)
            ? item.content.map((part) => part.text || "").join("")
            : ""
        )
        .join("\n")
        .trim();
    }

    return res.json({
      id: response.id,
      model: response.model,
      text: outputText,
      usage: response.usage || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error?.message || "Failed to generate response."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "web", "index.html"));
});

app.listen(port, () => {
  console.log(`LLM playground running at http://localhost:${port}`);
});
