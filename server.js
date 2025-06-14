const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000; // 1 dakika
let cekilisTimer = null;

// Çekilişi başlat
app.get('/sanscek', (req, res) => {
  if (cekilisAktif) {
    return res.send('Çekiliş zaten aktif!');
  }

  cekilisAktif = true;
  katilimcilar.clear();

  cekilisTimer = setTimeout(() => {
    cekilisAktif = false;
    cekilisTimer = null;
    console.log('Çekiliş süresi doldu.');
  }, cekilisSuresi);

  console.log('Çekiliş başladı!');
  res.send('🎉 Çekiliş başladı! Katılım için !sans yazabilirsiniz. 🎉');
});

// Katılım (sessiz)
app.get('/sans', (req, res) => {
  if (!cekilisAktif) return res.send('');

  const username = req.query.username;
  if (!username) return res.send('');

  if (katilimcilar.has(username)) return res.send('');

  katilimcilar.add(username);
  res.send(''); // Sessiz yanıt
});

// Çekilişi bitir
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
    return res.send('Çekilişe katılan kimse yok.');
  }

  const katilimciArray = Array.from(katilimcilar);
  const kazanan = katilimciArray[Math.floor(Math.random() * katilimciArray.length)];

  katilimcilar.clear();

  const mesaj = `🎉 Tebrikler @${kazanan}, yayıncıya 1 oyun önerme hakkı kazandın! 🎮`;
  console.log(mesaj);
  res.send(mesaj);
});

// Health
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    cekilisAktif,
    katilimciSayisi: katilimcilar.size
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint yok',
    endpoints: ['/sanscek', '/sans?username=...', '/cekilisyap']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Çekiliş API ${PORT} portunda çalışıyor`);
});
