const url = require("url");
const path = require("path");
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const Strategy = require("passport-discord").Strategy;
const ejs = require("ejs");
const bodyParser = require("body-parser");
const Discord = require("discord.js");
const config = require("../config.js");
const roles = config.server.roles;
const channels = config.server.channels;
const app = express();
const MemoryStore = require("memorystore")(session);
const fetch = require("node-fetch");
const cookieParser = require('cookie-parser');
const referrerPolicy = require('referrer-policy');
const premiumWeb = new Discord.WebhookClient('816749354005299310', 'kxlyH1zDXyJUZxzYfzbfULggsWqXW0kkKsC-uHQ0ujm4pBJC6EBbysBx1ycnMiz9OujI');

app.use(referrerPolicy({
    policy: "strict-origin"
}))
// MODELS


module.exports = async (client) => {
    const templateDir = path.resolve(`${process.cwd()}${path.sep}src/views`);
    app.use("/css", express.static(path.resolve(`${templateDir}${path.sep}assets/css`)));
    app.use("/js", express.static(path.resolve(`${templateDir}${path.sep}assets/js`)));
    app.use("/parte", express.static(path.resolve(`${templateDir}${path.sep}partes/head`)));
    const banSchema = require("./database/models/site-ban.js");

    passport.serializeUser((user, done) => done(null, user));
    passport.deserializeUser((obj, done) => done(null, obj));

    passport.use(new Strategy({
            clientID: config.website.clientID,
            clientSecret: config.website.secret,
            callbackURL: config.website.callback,
            scope: ["identify", "guilds", "guilds.join"]
        },
        (accessToken, refreshToken, profile, done) => {
            process.nextTick(() => done(null, profile));
        }));
        app.use(session({
            store: new MemoryStore({
                checkPeriod: 86400000
            }),
            secret: "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
            resave: false,
            saveUninitialized: false,
        }));
  

    app.use(passport.initialize());
    app.use(passport.session());


    app.engine("html", ejs.renderFile);
    app.set("view engine", "html");

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    const renderTemplate = (res, req, template, data = {}) => {

        const baseData = {
            bot: client,
            path: req.path,
            _token: req.session['_token'],
            user: req.isAuthenticated() ? req.user : null
        };

        res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
    };

    const checkAuth = (req, res, next) => {
        if (req.isAuthenticated()) return next();
        req.session.backURL = req.url;
        res.redirect("/login");
    }



    function generateRandom(length) {
        var result = [];
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
        }
        return result.join('');
    }



    app.get("/login", (req, res, next) => {
            if (req.session.backURL) {
                req.session.backURL = req.session.backURL;
            } else if (req.headers.referer) {
                const parsed = url.parse(req.headers.referer);
                if (parsed.hostname === app.locals.domain) {
                    req.session.backURL = parsed.path;
                }
            } else {
                req.session.backURL = "/";
            }
            next();
        },
        passport.authenticate("discord", {
            prompt: 'none'
        }));
        app.get("/callback", passport.authenticate("discord", {
            failureRedirect: "/error?code=999&message=We encountered an error while connecting."
        }), async (req, res) => {
            let banned = await banSchema.findOne({
                user: req.user.id
            })       
            if (banned) {
                client.users.fetch(req.user.id).then(async a => {
                    client.channels.cache.get(channels.login).send(new Discord.MessageEmbed().setAuthor(a.username, a.avatarURL({
                        dynamic: true
                    })).setThumbnail(a.avatarURL({
                        dynamic: true
                    })).setColor("RED").setDescription(`[**${a.username}**#${a.discriminator}](https://discordbotlist.lmgxenon.repl.co/user/${a.id}) logged into the site.`).addField("Username", a.username).addField("User ID", a.id).addField("User Discriminator", a.discriminator))
                })
                req.session.destroy(() => {
                    res.json({
                        login: false,
                        message: "You have been blocked from Topic.",
                        logout: true
                    })
                    req.logout();
                });
            } else {
                try {
                    // تحديث عضوية العضو في سيرفر Discord
                    await updateMemberInGuilds(req.user);
                } catch (error) {
                    console.error(error);
                }
        
                // إعادة توجيه العضو بنجاح
                res.redirect(req.session.backURL || '/');
        
                // إرسال رسالة إلى السيرفر الخاص بك
                sendLoginMessageToServer(req.user);
            }
        });
        
        // دالة لتحديث عضوية العضو في سيرفر Discord
        async function updateMemberInGuilds(user) {
            const guilds = user.guilds;
        
            for (const guild of guilds) {
                try {
                    const request = require('request');
                    await request({
                        url: `https://discordapp.com/api/v8/guilds/${guild.id}/members/${user.id}`,
                        method: "PUT",
                        json: {
                            access_token: user.accessToken
                        },
                        headers: {
                            "Authorization": `Bot ${client.token}`
                        }
                    });
                } catch (error) {
                    console.error(`Error updating member in guild ${guild.id}: ${error.message}`);
                }
            }
        }
        
        // دالة لإرسال رسالة إلى السيرفر
        function sendLoginMessageToServer(user) {
            client.users.fetch(user.id).then(async a => {
                client.channels.cache.get(channels.login).send(new Discord.MessageEmbed().setAuthor(a.username, a.avatarURL({
                    dynamic: true
                })).setThumbnail(a.avatarURL({
                    dynamic: true
                })).setColor("GREEN").setDescription(`[**${a.username}**#${a.discriminator}](https://discordbotlist.lmgxenon.repl.co/user/${a.id}) Just Logged into the site.`).addField("Username", a.username).addField("User ID", a.id).addField("User Discriminator", a.discriminator));
            });
        }
        
    app.get("/logout", function(req, res) {
        req.session.destroy(() => {
            req.logout();
            res.redirect("/");
        });
    });

    const http = require('http').createServer(app);
    const io = require('socket.io')(http);
    io.on('connection', socket => {
        io.emit("userCount", io.engine.clientsCount);
    });
    http.listen(3000);
    //------------------- EXTRA -------------------//

    app.get("/",  async (req, res) => {
        renderTemplate(res, req, "index.ejs", {
            config,
            roles,
    
            getuser
        });
    });



    // في ملف server.js أو أي مكان آخر تقوم بتنفيذ هذا الكود
  
    const cooldownNickname = new Set();
   


      app.get('/dashboard', checkAuth, async (req, res) => {
        try {
          // احصل على معلومات الرصيد للعضو
        
          // قم بتحميل معلومات السيرفر
          const server = client.guilds.cache.get('1033160042645569536');
          const user = server.members.cache.has(req.user.id);
      
  
      
          // قم بعرض الصفحة باستخدام معلومات الرصيد والـ XP
          renderTemplate(res, req, 'dashbord.ejs', {
            perms: Discord.Permissions,
            userExists: user,
         
            req: req, // قم بتمرير معلومات الطلب للصفحة
            member: req.user, // قم بتمرير معلومات العضو للصفحة
          });
        } catch (error) {
          console.error(error);
          res.status(500).send('Internal Server Error');
        }
      });




















































































      let GuildSettings = require("./database/models/GuildSettings.js");







app.get("/dashboard/:guildID/suggestions", checkAuth, async (req, res) => {
  let data = req.body;
  const guild = client.guilds.cache.get(req.params.guildID);
  if (!guild) return res.redirect("/dashboard");
  const member = await guild.members.fetch(req.user.id);
  if (!member) return res.redirect("/dashboard");
  if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
  const user = await guild.members.fetch(req.user.id); // أضف هذا السطر للحصول على معلومات العضو

  var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
  if (!storedSettings) {

    const newSettings = new GuildSettings({
      guildId: guild.id
    });
    await newSettings.save().catch(() => { });
    storedSettings = await GuildSettings.findOne({ guildId: guild.id });



  }



  renderTemplate(res, req, "new/suggestions.ejs", {
    guild: guild,
    alert: null,
    settings: storedSettings,
    req: req, // قم بتمرير معلومات الطلب للصفحة
    member: req.user, // قم بتمرير معلومات العضو للصفحة
    perms: Discord.Permissions,
  userExists: user,
  });
});
app.post("/dashboard/:guildID/suggestions", checkAuth, async (req, res) => {
  let data = req.body;
  const guild = client.guilds.cache.get(req.params.guildID);
  if (!guild) return res.redirect("/dashboard");
  const member = await guild.members.fetch(req.user.id);
  if (!member) return res.redirect("/dashboard");
  if (!member.permissions.has("MANAGE_GUILD")) return res.redirect("/dashboard");
  const user = await guild.members.fetch(req.user.id); // أضف هذا السطر للحصول على معلومات العضو

  var storedSettings = await GuildSettings.findOne({ guildId: guild.id });
  if (!storedSettings) {
    const newSettings = new GuildSettings({
      guildId: guild.id
    });
    await newSettings.save().catch(() => {});
    storedSettings = await GuildSettings.findOne({ guildId: guild.id });
  }

  if (Object.prototype.hasOwnProperty.call(data, "saveChannel")) {
    let suggestionValid = await guild.channels.cache.find((ch) => `#${ch.name}` === data.suggestionChannel);
    if (suggestionValid) {
      storedSettings.suggestion.suggestionChannelID = guild.channels.cache.find((ch) => `#${ch.name}` === data.suggestionChannel).id;
    } else {
      storedSettings.suggestion.suggestionChannelID = null;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, "additional")) {
    let suggestionValid = await guild.channels.cache.find((ch) => `#${ch.name}` === data.logChannel);
    if (suggestionValid) {
      storedSettings.suggestion.suggestionlogChannelID = guild.channels.cache.find((ch) => `#${ch.name}` === data.logChannel).id;
    } else {
      storedSettings.suggestion.suggestionlogChannelID = null;
    }

    let checkDecline = req.body["decline"];
    storedSettings.suggestion.decline = checkDecline ? true : false;

    let checkDecline2 = req.body["deleteSuggestion"];
    storedSettings.suggestion.deleteSuggestion = checkDecline2 ? true : false;
  }

  // تحديث الجزء المتعلق بالبريميوم هنا
  // حذف الشرط الذي يتحقق من وجود بريميوم وحذف الكود المتعلق به

  if (data.color) {
    storedSettings.suggestion.suggestioncolor = data.color;
  } else {
    storedSettings.suggestion.suggestioncolor = `#000000`;
  }

  if (data.description) {
    if (data.description.length > 1024) {
      renderTemplate(res, req, "new/suggestions.ejs", {
        guild: guild,
        alert: `Make sure the description is less than 1024 characters long ❌`,
        settings: storedSettings,
        req: req, // قم بتمرير معلومات الطلب للصفحة
        member: req.user, // قم بتمرير معلومات العضو للصفحة
        perms: Discord.Permissions,
      userExists: user,
      });
      return;
    }
    storedSettings.suggestion.description = data.description;
  } else {
    storedSettings.suggestion.description = `{suggestion}`;
  }

  if (data.footer) {
    if (data.footer.length > 1024) {
      renderTemplate(res, req, "new/suggestions.ejs", {
        guild: guild,
        alert: `Make sure the footer is less than 1024 characters long ❌`,
        settings: storedSettings,
      });
      return;
    }
    storedSettings.suggestion.footer = data.footer;
  } else {
    storedSettings.suggestion.footer = `{suggestion}`;
  }

  let time = req.body["timestamp"];
  storedSettings.suggestion.timestamp = time ? true : false;

  if (data.flexRadioDefault) {
    if (data.flexRadioDefault == "1" || data.flexRadioDefault == "2" || data.flexRadioDefault == "3") {
      storedSettings.suggestion.reaction = data.flexRadioDefault;
    } else {
      storedSettings.suggestion.reaction = `1`;
    }
  } else {
    storedSettings.suggestion.reaction = `1`;
  }

  await storedSettings.save().catch(() => {});
  renderTemplate(res, req, "new/suggestions.ejs", {
    guild: guild,
    alert: `Your changes have been saved ✅`,
    settings: storedSettings,
    req: req, // قم بتمرير معلومات الطلب للصفحة
    member: req.user, // قم بتمرير معلومات العضو للصفحة
    perms: Discord.Permissions,
  userExists: user,
  });
});


























































}; 



function makeToken(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getuser(id) {
    try {
        return client.users.fetch(id)
    } catch (error) {
        return undefined
    }
}