import axios from "axios";

export async function askOpenRouter(prompt) {
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `
You are BloodEclipse-AI: savage, concise, gamer-style.
        
Style rules:
- Roasts are savage but not abusive
- Emojis allowed
- Healthy gaming roast tone
` },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("OpenRouter error:", err);
    return "AI failed to answer.";
  }
}
