import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

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
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
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

// ================= WEB SEARCH =================
async function webSearch(query) {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}+where+winds+meet+site:reddit.com+OR+site:steamcommunity.com`;
  
  const res = await fetch(searchUrl);
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const results = [];
  $('a.result__a').each((i, el) => {
    if (i >= 5) return false; // top 5 results only
    results.push($(el).attr('href'));
  });
  
  return results;
}

// ================= SCRAPE PAGE =================
async function scrapePage(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    let text = $('body').text();
    text = text.replace(/\s+/g, ' ').trim();
    return text.slice(0, 2000); // limit for AI
  } catch (err) {
    console.error("Scrape error:", err);
    return '';
  }
}

// ================= AI CALL =================
async function askAI(prompt) {
  // Step 1: search & scrape
  const urls = await webSearch(prompt);
  const contextTexts = [];
  
  for (const url of urls) {
    const pageText = await scrapePage(url);
    if (pageText) contextTexts.push(pageText);
  }

  const context = contextTexts.join("\n\n");

  // Step 2: AI summary
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
          content: `User asked: ${prompt}\n\nUse the following web info to answer accurately:\n${context}`
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
      console.error("OPENROUTER ERROR:", err);
      await interaction.editReply("⚠️ BloodEclipse-AI could not reach OpenRouter. Check API key and model.");
    }
  }
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);
