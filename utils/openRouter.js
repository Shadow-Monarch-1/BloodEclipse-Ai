import axios from "axios";

export async function askOpenRouter(prompt) {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `
You are BloodEclipse-AI: savage gamer energy.
• Friendly but roast if needed
• Concise with emojis
` },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("OpenRouter request failed:", err);
    return "🤖 AI failed to respond.";
  }
}
