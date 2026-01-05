const Canvas = require('@napi-rs/canvas');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

// Fontları Kaydet
try {
    Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '../fonts/Poppins-Bold.ttf'), 'PoppinsBold');
    Canvas.GlobalFonts.registerFromPath(path.join(__dirname, '../fonts/Poppins-Regular.ttf'), 'PoppinsRegular');
} catch (e) { 
    console.error("Fontlar yüklenemedi."); 
}

// Ortak Arka Plan Çizici (Kod tekrarını önlemek için)
function drawBaseBackground(ctx, title, subTitle, glowColor) {
    // Ana Gövde
    ctx.fillStyle = '#0a0a0b';
    ctx.beginPath();
    ctx.roundRect(0, 0, 1000, 280, 30);
    ctx.fill();

    // Neon Glow (Sol taraf - Avatar arkası)
    const bgGrad = ctx.createRadialGradient(135, 140, 0, 135, 140, 400);
    bgGrad.addColorStop(0, `${glowColor}1F`); // %12 Opacity
    bgGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 280);

    // Cam Efekti İç Panel
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.beginPath();
    ctx.roundRect(20, 20, 960, 240, 25);
    ctx.fill();

    // Başlıklar
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px PoppinsBold';
    ctx.fillText(title, 285, 120);

    ctx.fillStyle = glowColor;
    ctx.font = 'bold 25px PoppinsBold';
    ctx.fillText(subTitle, 285, 165);
}

// 1. Yeni Bot Eklendi Kartı
async function createNewBotCard(botData) {
    const canvas = Canvas.createCanvas(1000, 280);
    const ctx = canvas.getContext('2d');
    const themeColor = '#0CA7FF'; // Mavi Tema

    drawBaseBackground(ctx, 'YENİ BOT ONAYLANDI!', botData.name.toUpperCase(), themeColor);

    // Alt Bilgi (Prefix & ID)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '20px PoppinsRegular';
    ctx.fillText(`Prefix: ${botData.prefix} • Bot ID: ${botData.id}`, 285, 210);

    // Avatar Çizimi
    const ax = 135, ay = 140, r = 85;
    ctx.save();
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(ax, ay, r + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    const avatar = await Canvas.loadImage(botData.avatar);
    ctx.drawImage(avatar, ax - r, ay - r, r * 2, r * 2);
    ctx.restore();

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'new-bot.png' });
}

// 2. Giriş Yapan Kullanıcı Kartı
async function createLoginCard(userData) {
    const canvas = Canvas.createCanvas(1000, 280);
    const ctx = canvas.getContext('2d');
    const themeColor = '#57F287'; // Yeşil Tema

    drawBaseBackground(ctx, 'HOŞ GELDİN!', userData.username.toUpperCase(), themeColor);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '20px PoppinsRegular';
    ctx.fillText(`Web sitesine başarıyla giriş yapıldı.`, 285, 210);

    // Avatar Çizimi
    const ax = 135, ay = 140, r = 85;
    ctx.save();
    ctx.shadowColor = themeColor;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(ax, ay, r + 8, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.clip();
    const avatar = await Canvas.loadImage(userData.avatarURL);
    ctx.drawImage(avatar, ax - r, ay - r, r * 2, r * 2);
    ctx.restore();

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'welcome.png' });
}

module.exports = { createNewBotCard, createLoginCard };