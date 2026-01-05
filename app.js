const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const fs = require('fs-extra');
const path = require('path');
const { Client, GatewayIntentBits, AttachmentBuilder, ActivityType, EmbedBuilder } = require('discord.js');
const Canvas = require('canvas'); 

const app = express();
const dbPath = './database.json';

// --- AYARLAR ---
const CLIENT_ID = '1456647907288682566';
const CLIENT_SECRET = 'XMMEGl8CJopAbztPEFVhxorbV-zGg2Ct';
const CALLBACK_URL = 'http://localhost:3000/auth/discord/callback';
const BOT_TOKEN = 'MTQ1NjY0NzkwNzI4ODY4MjU2Ng.GjlzXV.Z5-Dl3CwNqk7cH2y4WwHfXXJytu8gz27L1ZR2o';

const ADMIN_ID = '1392139504092971038';
const NEW_BOT_CHANNEL = '1457798598657052742';
const LOGIN_LOG_CHANNEL = '1457798676599673098';

const botClient = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers
    ] 
});

// --- MODERN CANVAS LOG FONKSIYONU (Geliştirildi) ---
async function createEliteCard(title, name, subtext, avatarUrl, themeColor) {
    const canvas = Canvas.createCanvas(1000, 280);
    const ctx = canvas.getContext('2d');
    
    // Arka Plan
    ctx.fillStyle = '#111214';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, 1000, 280, 30); else ctx.rect(0, 0, 1000, 280);
    ctx.fill();

    // Dinamik Işık Efekti
    const bgGrad = ctx.createRadialGradient(135, 140, 0, 135, 140, 400);
    bgGrad.addColorStop(0, themeColor + '33');
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 280);

    // Kenarlık
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 980, 260);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(20, 20, 960, 240, 25); else ctx.rect(20, 20, 960, 240);
    ctx.fill();

    const ax = 135, ay = 140, r = 85;
    
    // Avatar Neon Halka
    ctx.save();
    ctx.shadowColor = themeColor; 
    ctx.shadowBlur = 20; 
    ctx.strokeStyle = themeColor; 
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(ax, ay, r + 8, 0, Math.PI * 2); ctx.stroke(); 
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    try {
        const avatar = await Canvas.loadImage(avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');
        ctx.drawImage(avatar, ax - r, ay - r, r * 2, r * 2);
    } catch (e) { ctx.fillStyle = '#333'; ctx.fill(); }
    ctx.restore();

    // Yazılar
    ctx.textAlign = 'left'; 
    ctx.fillStyle = '#ffffff'; 
    ctx.font = 'bold 45px sans-serif';
    ctx.shadowColor = 'black'; ctx.shadowBlur = 5;
    ctx.fillText(title, 285, 110);
    
    ctx.fillStyle = themeColor; 
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(name.toUpperCase(), 285, 160);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
    ctx.font = '20px sans-serif';
    ctx.fillText(subtext, 285, 210);

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'log-card.png' });
}

// --- DM BİLDİRİM FONKSİYONU ---
async function sendNotificationDM(userId, botName) {
    try {
        const user = await botClient.users.fetch(userId);
        const embed = new EmbedBuilder()
            .setTitle('🚀 Botun Onaylandı!')
            .setDescription(`Merhaba! **${botName}** adlı botun sisteme başarıyla eklendi.`)
            .setColor('#0CA7FF')
            .setTimestamp()
            .setFooter({ text: 'Elecus Botlist Sistemi' });
        
        await user.send({ embeds: [embed] });
    } catch (e) {
        console.log(`DM Gönderilemedi: ${userId} ID'li kullanıcının DM'i kapalı.`);
    }
}

async function sendNewBotLog(botData) {
    try {
        const channel = await botClient.channels.fetch(NEW_BOT_CHANNEL);
        if (!channel) return;
        const attachment = await createEliteCard('YENİ BOT EKLENDİ!', botData.name, `Prefix: ${botData.prefix} • Bot ID: ${botData.id}`, botData.avatar, '#0CA7FF');
        channel.send({ content: `🚀 **${botData.name}** sisteme eklendi!`, files: [attachment] });
    } catch (e) { console.error(e); }
}

async function sendUserLoginLog(userData) {
    try {
        const channel = await botClient.channels.fetch(LOGIN_LOG_CHANNEL);
        if (!channel) return;
        const attachment = await createEliteCard('HOŞ GELDİN!', userData.username, 'Siteye yeni bir giriş yapıldı.', userData.avatarURL, '#57F287');
        channel.send({ content: `👋 **${userData.username}** siteye giriş yaptı!`, files: [attachment] });
    } catch (e) { console.error(e); }
}

botClient.on('ready', () => {
    console.log(`Bot Aktif: ${botClient.user.tag}`);
    setInterval(async () => {
        try {
            const data = await fs.readJson(dbPath);
            botClient.user.setActivity(`${data.bots.length} Bot Listeleniyor`, { type: ActivityType.Watching });
        } catch (e) {}
    }, 60000);
});

botClient.login(BOT_TOKEN);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));
passport.use(new DiscordStrategy({
    clientID: CLIENT_ID, clientSecret: CLIENT_SECRET, callbackURL: CALLBACK_URL, scope: ['identify']
}, (at, rt, profile, done) => process.nextTick(() => done(null, profile))));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'elecus_neon_2024', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

if (!fs.existsSync(dbPath)) fs.writeJsonSync(dbPath, { bots: [] });

const isAdmin = (req, res, next) => {
    if (req.user && req.user.id === ADMIN_ID) return next();
    res.redirect('/?status=error&message=Bu sayfaya sadece admin erişebilir!');
};

// --- ROTALAR ---

app.get('/', async (req, res) => {
    const data = await fs.readJson(dbPath);
    let { search, category, sort } = req.query;
    let bots = [...data.bots];
    if (search) bots = bots.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    if (category) bots = bots.filter(b => Array.isArray(b.tags) ? b.tags.includes(category) : b.tags === category);
    if (sort === 'top') { bots = bots.sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 100); } else { bots = bots.reverse(); }
    const featured = data.bots.sort((a, b) => b.votes - a.votes)[0] || null;
    res.render('index', { user: req.user, bots, search: search || '', currentCategory: category || '', sort: sort || 'new', firstBot: featured });
});

app.get('/dashboard', isAdmin, async (req, res) => {
    try {
        const data = await fs.readJson(dbPath);
        const now = new Date();
        const stats = {
            totalBots: data.bots.length,
            totalVotes: data.bots.reduce((s, b) => s + (b.votes || 0), 0),
            totalUsers: new Set(data.bots.map(b => b.ownerID)).size,
            newBotsThisMonth: data.bots.filter(b => new Date(b.addedAt).getMonth() === now.getMonth()).length,
            topBots: [...data.bots].sort((a, b) => b.votes - a.votes).slice(0, 5)
        };
        res.render('dashboard', { user: req.user, stats, allBots: data.bots });
    } catch (err) { res.redirect('/?status=error'); }
});

app.get('/bot/:id', async (req, res) => {
    try {
        const data = await fs.readJson(dbPath);
        const bot = data.bots.find(b => b.id === req.params.id);
        if (!bot) return res.redirect('/?status=error&message=Bot bulunamadı!');
        res.render('bot-detail', { user: req.user, bot: { ...bot, tags: Array.isArray(bot.tags) ? bot.tags : [bot.tags || "Genel"] } });
    } catch (err) { res.redirect('/?status=error'); }
});

app.get('/bot/:id/edit', async (req, res) => {
    if (!req.user) return res.redirect('/auth/discord');
    try {
        const data = await fs.readJson(dbPath);
        const bot = data.bots.find(b => b.id === req.params.id);
        if (!bot) return res.redirect('/profile?status=error&message=Bot bulunamadı.');
        if (bot.ownerID !== req.user.id && req.user.id !== ADMIN_ID) {
            return res.redirect('/profile?status=error&message=Yetkiniz yok.');
        }
        res.render('edit', { user: req.user, bot });
    } catch (err) { res.redirect('/profile?status=error'); }
});

app.post('/bot/:id/edit', async (req, res) => {
    if (!req.user) return res.redirect('/auth/discord');
    const { prefix, shortDesc, tags, invite, servers, commands } = req.body;
    try {
        const data = await fs.readJson(dbPath);
        const botIndex = data.bots.findIndex(b => b.id === req.params.id);
        if (botIndex === -1) return res.redirect('/profile?status=error');
        if (data.bots[botIndex].ownerID !== req.user.id && req.user.id !== ADMIN_ID) return res.redirect('/profile?status=error');

        data.bots[botIndex] = {
            ...data.bots[botIndex],
            prefix,
            description: shortDesc,
            invite,
            servers: parseInt(servers) || 0,
            commands: parseInt(commands) || 0,
            tags: Array.isArray(tags) ? tags : [tags]
        };

        await fs.writeJson(dbPath, data, { spaces: 2 });
        res.redirect('/profile?status=success&message=Güncellendi!');
    } catch (e) { res.redirect('/profile?status=error'); }
});

app.post('/bot/:id/delete', async (req, res) => {
    if (!req.user) return res.redirect('/auth/discord');
    try {
        const data = await fs.readJson(dbPath);
        const botIndex = data.bots.findIndex(b => b.id === req.params.id);
        if (botIndex === -1) return res.redirect('/profile?status=error');
        if (data.bots[botIndex].ownerID !== req.user.id && req.user.id !== ADMIN_ID) return res.redirect('/profile?status=error');
        data.bots.splice(botIndex, 1);
        await fs.writeJson(dbPath, data, { spaces: 2 });
        res.redirect('/profile?status=success&message=Silindi.');
    } catch (err) { res.redirect('/profile?status=error'); }
});

app.post('/vote/:id', async (req, res) => {
    if (!req.user) return res.json({ status: "error", message: "Giriş yapmalısın!" });
    try {
        const data = await fs.readJson(dbPath);
        const botIndex = data.bots.findIndex(b => b.id === req.params.id);
        const userId = req.user.id; const now = Date.now();
        const bot = data.bots[botIndex];
        if (!bot.voters) bot.voters = {};
        if (bot.voters[userId] && (now - bot.voters[userId] < 86400000)) return res.json({ status: "error", message: "Günde 1 kez oy verebilirsin!" });
        bot.voters[userId] = now; bot.votes = (bot.votes || 0) + 1;
        await fs.writeJson(dbPath, data, { spaces: 2 });
        res.json({ status: "success", votes: bot.votes });
    } catch (err) { res.json({ status: "error" }); }
});

app.post('/addbot', async (req, res) => {
    if (!req.user) return res.redirect('/auth/discord');
    const { botID, prefix, shortDesc, tags, invite, servers, commands } = req.body;
    try {
        const fb = await botClient.users.fetch(botID, { force: true });
        const data = await fs.readJson(dbPath);
        if (data.bots.some(b => b.id === botID)) return res.redirect('/addbot?status=error&message=Zaten kayıtlı!');
        
        const bannerURL = fb.bannerURL({ size: 1024, extension: 'png' });

        const newBot = {
            id: fb.id, 
            name: fb.username, 
            avatar: fb.displayAvatarURL({ extension: 'png' }),
            banner: bannerURL, 
            prefix, description: shortDesc, invite, 
            servers: parseInt(servers) || 0,
            commands: parseInt(commands) || 0, 
            tags: Array.isArray(tags) ? tags : [tags],
            votes: 0, voters: {}, ownerID: req.user.id, addedAt: new Date()
        };
        
        data.bots.push(newBot);
        await fs.writeJson(dbPath, data, { spaces: 2 });
        
        // Log ve DM Bildirimi
        sendNewBotLog(newBot);
        sendNotificationDM(req.user.id, fb.username);

        res.redirect('/profile?status=success');
    } catch (e) { res.redirect('/addbot?status=error&message=Geçersiz ID!'); }
});

app.get('/addbot', (req, res) => req.user ? res.render('addbot', { user: req.user }) : res.redirect('/auth/discord'));

app.get('/profile', async (req, res) => {
    if (!req.user) return res.redirect('/auth/discord');
    try {
        const data = await fs.readJson(dbPath);
        const userBots = data.bots.filter(b => b.ownerID === req.user.id);
        res.render('profile', { 
            user: req.user, 
            bots: userBots,
            search: "",
            currentCategory: "",
            sort: "new",
            firstBot: userBots[0] || null
        });
    } catch (e) { res.redirect('/?status=error'); }
});

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => {
    if (req.user) {
        sendUserLoginLog({ 
            username: req.user.username, 
            avatarURL: `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` 
        });
    }
    res.redirect('/?status=success');
});

app.get('/logout', (req, res) => { req.logout(() => res.redirect('/')); });

app.listen(3000, () => console.log("Elecus v2 Aktif: http://localhost:3000"));