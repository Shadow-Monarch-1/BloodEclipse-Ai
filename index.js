import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= READY =================
client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('ask')
      .setDescription('Ask BloodEclipse-AI anything')
      .addStringOption(option =>
        option
          .setName('question')
          .setDescription('Your question')
          .setRequired(true)
      )
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.CLIENT_ID,
          process.env.GUILD_ID
        ),
        { body: commands }
      );
      console.log("Slash commands registered to guild.");
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log("Global slash commands registered.");
    }
  } catch (error) {
    console.error(error);
  }
});

// ================= AI CALL =================
async function askAI(prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are BloodEclipse-AI, a funny gen-z guild assistant for the game Where Winds Meet. You help with builds, weapons, tips, and web knowledge. Use emojis sometimes."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ================= INTERACTIONS =================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ask') {
    const question = interaction.options.getString('question');

    await interaction.deferReply();

    try {
      const answer = await askAI(question);
      await interaction.editReply(answer);
    } catch (err) {
      console.error(err);
      await interaction.editReply("⚠️ BloodEclipse-AI had a hiccup. Try again.");
    }
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
