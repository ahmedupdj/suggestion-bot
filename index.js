const Discord = require("discord.js");
const { Client, Collection, MessageEmbed } = require("discord.js");

const client = (global.Client = new Client())
const config = require("./config.js");
global.config = config;

const fs = require("fs");
const fetch = require("node-fetch");
client.htmll = require('cheerio');

require('events').EventEmitter.prototype._maxListeners = 100;
client.komutlar = new Discord.Collection();
client.aliases = new Discord.Collection();

// Load commands from folders
const commandFolders = fs.readdirSync('./src/commands');
for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const props = require(`./src/commands/${folder}/${file}`);
        if (!props.help) continue;

        client.komutlar.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
            global.commands = file;
        });
    }
}

client.on('ready', async () => {
    console.log("(!) Bot " + client.user.tag + "a7a");
    client.user.setPresence({ activity: { type: 'WATCHING', name: '$help' }, status: "dnd" });
})



let GuildSettings = require("./src/database/models/GuildSettings.js");



client.on("message", async (message) => {
  // Check if the message is from a bot
  if (message.author.bot) return;

  // التحقق من أن الرسالة في القناة المخصصة للاقتراحات
  const guildSettings = await GuildSettings.findOne({ guildId: message.guild.id });

  if (!guildSettings || !guildSettings.suggestion.suggestionChannelID) {
    return console.error("");
  }

  const suggestionTargetChannel = message.guild.channels.cache.get(guildSettings.suggestion.suggestionChannelID);

  if (!suggestionTargetChannel) {
    return console.error("Target channel not found.");
  }

  // التحقق إذا كانت الرسالة تم إرسالها في القناة المحددة للاقتراح
  if (message.channel.id !== guildSettings.suggestion.suggestionChannelID) {
    // لا تقم بتنفيذ السلوك إذا لم تكن في القناة المحددة
    return;
  }

  // بناء Embed للاقتراح
  const suggestionEmbed = new Discord.MessageEmbed()
    .setTitle("New Suggestion")
    .setDescription(`**${message.content}**`)
    .setColor(guildSettings.suggestion.suggestioncolor)
    .setFooter(guildSettings.suggestion.footer.replace(/\{user_tag\}/g, message.author.tag));


  // حذف رسالة العضو
  message.delete()
    .then(() => {
      console.log("User's message deleted successfully.");
    })
    .catch((error) => {
      console.error("Error deleting user's message:", error);
    });

  // إرسال الاقتراح إلى القناة المحددة
  suggestionTargetChannel.send(suggestionEmbed)
    .then((suggestionMessage) => {
      console.log("Suggestion sent to the target channel.");

      // الردود المحددة من قبل العضو
      const userSelectedReactions = [];

      if (guildSettings.suggestion.reaction === "2") {
        userSelectedReactions.push("👍", "👎");
      } else if (guildSettings.suggestion.reaction === "3") {
        userSelectedReactions.push("✅", "❌");
      }

      // إضافة الردود المحددة إلى رسالة الاقتراح
      userSelectedReactions.forEach((reaction) => {
        suggestionMessage.react(reaction)
          .then(() => {
            console.log(`Reaction ${reaction} added to the suggestion message.`);
          })
          .catch((error) => {
            console.error(`Error adding ${reaction} reaction to the suggestion message:`, error);
          });
      });
    })
    .catch((error) => {
      console.error("Error sending suggestion to the target channel:", error);
    });
});

const server = require('./src/server');
server(client);

require("./src/database/connect.js")(client);
client.login(config.bot.token);
