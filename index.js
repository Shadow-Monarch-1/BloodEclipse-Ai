import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType } from "discord.js";
import { askOpenRouter } from "./utils/openRouter.js";
import { googleSearchAndFormat } from "./utils/googleSearch.js";
import { generateImage } from "./utils/imageGen.js";
import { CONFIG } from "./config.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the AI anything")
    .addStringOption(o => o.setName("question").setDescription("Your question").setRequired(true)),

  new SlashCommandBuilder()
    .setName("search")
    .setDescription("Web search + AI summary")
    .addStringOption(o => o.setName("query").setDescription("Search term").setRequired(true)),

  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate an AI image")
    .addStringOption(o => o.setName("prompt").setDescription("Describe what to draw").setRequired(true)),

  new SlashCommandBuilder()
    .setName("roast")
    .setDescription("Get a savage roast")
].map(cmd => cmd.toJSON());

// Register commands to guild
const rest = new REST({ version: "10" }).setToken(CONFIG.DISCORD_TOKEN);

async function registerCommands() {
  const appInfo = await rest.get(Routes.oauth2CurrentApplication());
  await rest.put(
    Routes.applicationGuildCommands(appInfo.id, CONFIG.GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash commands registered."); 
}

client.once("ready", async () => {
  console.log(`🔥 Bot online as ${client.user.tag}`);
  await registerCommands();
  client.user.setActivity("BloodEclipse | /help", { type: ActivityType.Playing });
});

// Interaction handler
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();

  try {
    if (interaction.commandName === "ask") {
      const q = interaction.options.getString("question");
      const reply = await askOpenRouter(q);
      return interaction.editReply(reply);

    } else if (interaction.commandName === "search") {
      const q = interaction.options.getString("query");
      const searchText = await googleSearchAndFormat(q);
      const aiResponse = await askOpenRouter(`
User search: ${q}

Search results:
${searchText}

Answer in concise format:
      `);
      return interaction.editReply(aiResponse);

    } else if (interaction.commandName === "imagine") {
      const prompt = interaction.options.getString("prompt");
      const url = await generateImage(prompt);
      return interaction.editReply({ content: prompt, files: [url] });

    } else if (interaction.commandName === "roast") {
      const roastText = await askOpenRouter("Give me a savage gamer roast.");
      return interaction.editReply(roastText);

    } else {
      interaction.editReply("Unknown command.");
    }

  } catch (err) {
    console.error("Command handler error:", err);
    interaction.editReply("❌ Something went wrong.");
  }
});

client.login(CONFIG.DISCORD_TOKEN);
