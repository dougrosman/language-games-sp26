const form = document.getElementById("prompt-form");
const output = document.getElementById("output");
const meta = document.getElementById("meta");
const resetBtn = document.getElementById("reset-btn");
const submitBtn = document.getElementById("submit-btn");

const bindRangeValue = (id) => {
  const input = document.getElementById(id);
  const label = document.getElementById(`${id}-value`);
  if (!input || !label) return;
  const update = () => {
    label.textContent = Number(input.value).toFixed(id === "temperature" ? 1 : 2);
  };
  input.addEventListener("input", update);
  update();
};

bindRangeValue("temperature");
bindRangeValue("top_p");
bindRangeValue("frequency_penalty");
bindRangeValue("presence_penalty");

const setMeta = (text, isError = false) => {
  meta.textContent = text;
  meta.style.color = isError ? "#ffb3b3" : "";
};

const getValue = (id) => document.getElementById(id).value;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  output.textContent = "";
  setMeta("Generating...");
  submitBtn.disabled = true;

  const payload = {
    prompt: getValue("prompt"),
    temperature: Number(getValue("temperature")),
    top_p: Number(getValue("top_p")),
    max_output_tokens: Number(getValue("max_output_tokens")),
    frequency_penalty: Number(getValue("frequency_penalty")),
    presence_penalty: Number(getValue("presence_penalty"))
  };

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    output.textContent = data.text || "(no content)";
    const usage = data.usage
      ? `prompt ${data.usage.input_tokens ?? "?"} • output ${data.usage.output_tokens ?? "?"}`
      : "usage unavailable";
    setMeta(`Model ${data.model} • ${usage}`);
  } catch (error) {
    output.textContent = "";
    setMeta(error.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

resetBtn.addEventListener("click", () => {
  form.reset();
  bindRangeValue("temperature");
  bindRangeValue("top_p");
  bindRangeValue("frequency_penalty");
  bindRangeValue("presence_penalty");
  output.textContent = "Your response will appear here.";
  setMeta("Ready");
});
