const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Çekiliş değişkenleri
let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000; // 1 dakika
let cekilisTimer = null;

// Moderatör komutu: çekilişi başlatır, 1 dakika katılım alır
app.get('/sanscek', (req, res) => {
  if (cekilisAktif) {
    return res.send('Çekiliş zaten aktif!');
  }

  cekilisAktif = true;
  katilimcilar.clear();

  cekilisTimer = setTimeout(() => {
    cekilisAktif = false;
    cekilisTimer = null;
    console.log('Çekiliş süresi doldu. Katılım kapandı.');
  }, cekilisSuresi);

  console.log('Çekiliş başladı! 1 dakika katılım alınacak.');
  res.send('🎉 Çekiliş başladı! Katılım için !sans yazabilirsiniz. 🎉');
});

// Katılım komutu: çekilişe katılır
app.get('/sans', (req, res) => {
  if (!cekilisAktif) {
    return res.send('Çekiliş aktif değil.');
  }

  const username = req.query.username;
  if (!username) {
    return res.send('Kullanıcı adı belirtilmedi.');
  }

  if (katilimcilar.has(username)) {
    return res.send('Zaten çekilişe katıldınız.');
  }

  katilimcilar.add(username);
  res.send(`@${username}, çekilişe başarıyla katıldın! 🍀`);
});

// Moderatör komutu: çekilişi bitirir ve kazananı seçer
app.get('/cekilisyap', (req, res) => {
  if (!cekilisAktif && katilimcilar.size === 0) {
    return res.send('Aktif çekiliş veya katılımcı yok.');
  }

  if (cekilisTimer) {
    clearTimeout(cekilisTimer);
    cekilisTimer = null;
  }

  cekilisAktif = false;

  if (katilimcilar.size === 0) {
    return res.send('Çekilişe katılan kimse yok. Kazanan seçilemedi.');
  }

  // Kazananı seç (rastgele)
  const katilimciArray = Array.from(katilimcilar);
  const kazanan = katilimciArray[Math.floor(Math.random() * katilimciArray.length)];

  katilimcilar.clear();

  const mesaj = `🎉 Tebrikler @${kazanan}, yayıncıya 1 oyun önerme hakkı kazandın! 🎮`;
  console.log(mesaj);
  res.send(mesaj);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    cekilisAktif,
    katilimciSayisi: katilimcilar.size
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    endpoints: ['/sanscek', '/sans?username=...', '/cekilisyap', '/health']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Çekiliş API ${PORT} portunda çalışıyor`);
});
