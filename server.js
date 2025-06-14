const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let katilanlar = new Set();
let katilimAcik = false;

app.get('/', (req, res) => {
    res.send(`
        <h1>🎁 Çekiliş Sistemi</h1>
        <p>Katılım durumu: ${katilimAcik ? '🟢 Açık' : '🔴 Kapalı'}</p>
        <p>Katılan kişi sayısı: ${katilanlar.size}</p>
    `);
});

// Katılımı başlat - !sanscek
app.get('/baslat-katilim', (req, res) => {
    if (katilimAcik) return res.send("Katılım zaten açık.");

    katilimAcik = true;
    katilanlar.clear();

    console.log("✅ Katılım başladı (1 dakika)");

    setTimeout(() => {
        katilimAcik = false;
        console.log("⛔ Katılım süresi doldu.");
    }, 60000);

    res.send("🎲 1 dakikalık çekiliş başladı! Katılmak için !şansbenimle yazın.");
});

// Katılma - !şansbenimle
app.get('/challenge', (req, res) => {
    const username = req.query.user;
    if (!katilimAcik) return res.send("Şu anda çekiliş aktif değil.");
    if (!username) return res.send("Kullanıcı adı gerekli.");
    if (katilanlar.has(username)) return res.send(`@${username}, zaten katıldın.`);

    katilanlar.add(username);
    console.log(`Katıldı: ${username}`);
    res.send(`@${username}, çekilişe başarıyla katıldın! 🍀`);
});

// Kazananı seç - !cekilisyap
app.get('/cekilis-yap', (req, res) => {
    if (katilanlar.size === 0) return res.send("Katılan yok.");
    
    const entries = Array.from(katilanlar);
    const winner = entries[Math.floor(Math.random() * entries.length)];

    katilanlar.clear();
    katilimAcik = false;

    console.log(`🎉 Kazanan: ${winner}`);
    res.send(`🎉 Tebrikler @${winner}, Tebrikler Şanslı Kişi Sensin! 🎮`);
});

// Sağlık kontrolü
app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Hatalı route
app.use('*', (req, res) => {
    res.status(404).send("Böyle bir endpoint yok.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Çekiliş API aktif: http://localhost:${PORT}`);
});
