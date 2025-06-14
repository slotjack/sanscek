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
    console.log('Çekiliş süresi doldu. Katılım kapandı.');
  }, cekilisSuresi);

  console.log('Çekiliş başladı! 1 dakika katılım alınacak.');
  res.send('🎉 Çekiliş başladı! Katılım için !sans yazabilirsiniz. 🎉');
});

// Katılım
app.get('/sans', (req, res) => {
  if (!cekilisAktif) return res.send('');
  const username = req.query.username;
  if (!username) return res.send('');
  if (katilimcilar.has(username)) return res.send('');
  katilimcilar.add(username);
  // Katılımda sessiz kal
  res.send('');
});

// Çekilişi sonlandır ve kazananı seç
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

  const katilimciArray = Array.from(katilimcilar);
  const kazanan = katilimciArray[Math.floor(Math.random() * katilimciArray.length)];

  katilimcilar.clear();

  // Burada kesinlikle kazananın adı dönüyor, sabit metin yok
  const mesaj = `🎉 Tebrikler şanslı kişi sensin: ${kazanan} 🎉`;
  console.log(mesaj);
  return res.send(mesaj);
});

// Sağlık kontrol
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
