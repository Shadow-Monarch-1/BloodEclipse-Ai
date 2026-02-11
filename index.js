// BloodEclipse-AI with Text-to-Image and Guild Slash Commands

import 'dotenv/config';
import { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder } from "discord.js";
import axios from "axios";

// =====================
// ENV
// =====================

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODELSLAB_API_KEY = process.env.MODELSLAB_API_KEY;

if (!DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN");
if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
if (!MODELSLAB_API_KEY) throw new Error("Missing MODELSLAB_API_KEY");

// =====================
// CLIENT
// =====================

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// =====================
// SLASH COMMANDS
// =====================

const commands = [
  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate AI-created image")
    .addStringOption(option =>
      option
        .setName("prompt")
        .setDescription("Describe what you want the AI to draw")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// =====================
// REGISTER COMMANDS
// =====================

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
const GUILD_ID = "1464753552915435848"; // your server ID

async function registerCommands() {
  try {
    const appData = await rest.get(Routes.oauth2CurrentApplication());
    const appId = appData.id;

    await rest.put(
      Routes.applicationGuildCommands(appId, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered to your guild!");
  } catch (err) {
    console.error("❌ Error registering slash commands:", err);
  }
}

// =====================
// IMAGE GENERATION
// =====================

async function generateImage(prompt) {
  try {
    const response = await axios.post(
      "https://modelslab.com/api/v6/images/text2img",
      {
        key: MODELSLAB_API_KEY,
        prompt: prompt,
        // Adjust width/height if you want square/other dimensions
        width: 512,
        height: 512,
        samples: 1,
        num_inference_steps: 25
      }
    );

    if (!response.data || !response.data.output || !response.data.output[0]) {
      throw new Error("No image URL in Modelslab response");
    }

    return response.data.output[0];
  } catch (err) {
    console.error("Image generation error:", err);
    throw err;
  }
}

// =====================
// INTERACTION EVENT
// =====================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === "imagine") {
    const prompt = interaction.options.getString("prompt");

    try {
      await interaction.deferReply(); // show “thinking…”

      const imageUrl = await generateImage(prompt);

      await interaction.editReply({
        content: `🎨 **Prompt:** ${prompt}`,
        files: [imageUrl]
      });

    } catch (error) {
      console.error("Reply error:", error);
      await interaction.editReply("❌ Failed to generate image. Try a simpler prompt or try again later.");
    }
  }
});

// =====================
// READY
// =====================

client.once("clientReady", async () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);
  client.user.setActivity("Creating Art 🎨", { type: ActivityType.Playing });
  await registerCommands();
});

// Note: discord.js v14 emits 'clientReady' instead of 'ready' for slash compatibility
client.on("clientReady", () => {}); // to avoid missing handler

client.login(DISCORD_TOKEN);
