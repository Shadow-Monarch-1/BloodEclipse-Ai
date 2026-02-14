import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType } from "discord.js";

import { googleSearchAndFormat } from "./utils/googleSearch.js";
import { askOpenRouter } from "./utils/openRouter.js";
import { generateImage } from "./utils/imageGen.js";

const {
  DISCORD_TOKEN,
  OPENROUTER_API_KEY,
  GOOGLE_API_KEY,
  GOOGLE_CSE_ID,
  MODELSLAB_API_KEY,
  GUILD_ID
} = process.env;

if (!DISCORD_TOKEN || !OPENROUTER_API_KEY || !GOOGLE_API_KEY || !GOOGLE_CSE_ID || !MODELSLAB_API_KEY || !GUILD_ID) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask BloodEclipse‑AI anything")
    .addStringOption(o => o.setName("question").setDescription("Your question").setRequired(true)),

  new SlashCommandBuilder()
    .setName("search")
    .setDescription("Web search + AI summary")
    .addStringOption(o => o.setName("query").setDescription("Search term").setRequired(true)),

  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate AI image")
    .addStringOption(o => o.setName("prompt").setDescription("Describe what to draw").setRequired(true)),

  new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Get a savage roast")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  const app = await rest.get(Routes.oauth2CurrentApplication());
  await rest.put(
    Routes.applicationGuildCommands(app.id, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash commands registered");
}

client.once("ready", async () => {
  console.log(`🔥 Online as ${client.user.tag}`);
  client.user.setActivity("Serving BloodEclipse | /help", { type: ActivityType.Playing });
  await registerCommands();
});

// Interaction handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();

  try {
    switch (interaction.commandName) {

      case "ask": {
        const question = interaction.options.getString("question");
        const aiReply = await askOpenRouter(question);
        return interaction.editReply(aiReply);
      }

      case "search": {
        const q = interaction.options.getString("query");
        const resultsText = await googleSearchAndFormat(q);
        const answer = await askOpenRouter(`
User query: ${q}

Search results:
${resultsText}

Answer naturally:
`);
        return interaction.editReply(answer);
      }

      case "imagine": {
        const prompt = interaction.options.getString("prompt");
        const imageURL = await generateImage(prompt);
        return interaction.editReply({ content: prompt, files: [imageURL] });
      }

      case "roast": {
        const roast = await askOpenRouter("Give me a savage roast.");
        return interaction.editReply(roast);
      }

      default:
        return interaction.editReply("Command not found.");
    }

  } catch (err) {
    console.error("Interaction error:", err);
    return interaction.editReply("❌ Something went wrong — try again.");
  }
});

client.login(DISCORD_TOKEN);
