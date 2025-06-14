const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000;
let cekilisTimer = null;

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

  console.log('Çekiliş başladı!');
  res.send('🎉 Çekiliş başladı! Katılım için !sans yazabilirsiniz. 🎉');
});

app.get('/sans', (req, res) => {
  if (!cekilisAktif) return res.sendStatus(204); // Sessiz yanıt

  const username = req.query.username;
  if (!username) return res.sendStatus(204);

  if (katilimcilar.has(username)) return res.sendStatus(204);

  katilimcilar.add(username);
  return res.sendStatus(204); // Sessizce kabul et
});

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

  const mesaj = `🎉 Tebrikler şanslı kişi sensin: @${kazanan} 🎮`;
  console.log(mesaj);
  res.send(mesaj);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    cekilisAktif,
    katilimciSayisi: katilimcilar.size
  });
});

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
