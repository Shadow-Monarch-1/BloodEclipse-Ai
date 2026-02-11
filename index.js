// BloodEclipse-AI with TEXT TO IMAGE

import 'dotenv/config';
import { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";
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
    .setDescription("Generate AI Image")
    .addStringOption(option =>
      option.setName("prompt")
        .setDescription("Describe your image")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// =====================
// REGISTER COMMAND
// =====================

async function registerCommands() {
  const appId = (await rest.get(Routes.oauth2CurrentApplication())).id;
  await rest.put(
    Routes.applicationCommands(appId),
    { body: commands }
  );
  console.log("✅ Slash command registered");
}

// =====================
// IMAGE GENERATION
// =====================

async function generateImage(prompt) {
  const response = await axios.post(
    "https://modelslab.com/api/v6/images/text2img",
    {
      key: MODELSLAB_API_KEY,
      prompt: prompt,
      width: 512,
      height: 512,
      samples: 1,
      num_inference_steps: 25
    }
  );

  return response.data.output[0];
}

// =====================
// INTERACTIONS
// =====================

client.on("interactionCreate", async (interaction) => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "imagine") {

    const prompt = interaction.options.getString("prompt");

    await interaction.reply("🎨 Cooking your image...");

    try {
      const imageUrl = await generateImage(prompt);

      await interaction.editReply({
        content: `🔥 **Prompt:** ${prompt}`,
        files: [imageUrl]
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply("❌ Image generation failed.");
    }
  }

});

// =====================
// READY
// =====================

client.once("ready", async () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);
  client.user.setActivity("Creating Art 🎨", { type: ActivityType.Playing });
  await registerCommands();
});

client.login(DISCORD_TOKEN);
