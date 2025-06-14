const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisTimeout = null;

// Moderatör komutu: Çekilişi başlat
app.get('/sanscek', (req, res) => {
  if (cekilisAktif) {
    return res.send('Çekiliş zaten devam ediyor.');
  }

  cekilisAktif = true;
  katilimcilar.clear();

  // 1 dakika katılım süresi
  cekilisTimeout = setTimeout(() => {
    cekilisAktif = false;
  }, 60 * 1000);

  console.log('🎉 Çekiliş başladı! 1 dakika katılım alınıyor.');

  res.send('Çekiliş başlatıldı! Katılmak için !sans yazın. 1 dakika süreniz var.');
});

// Kullanıcı komutu: Çekilişe katıl (chat mesajı yok)
app.get('/sans', (req, res) => {
  if (!cekilisAktif) {
    return res.send(''); // çekiliş yoksa sessiz cevap
  }

  // Kullanıcı adı sorgusu, Botrix'de parametre olarak gelebilir
  const username = req.query.username || 'bilinmeyen';

  katilimcilar.add(username.toLowerCase()); // küçük harfli ekle ki benzersiz olsun

  // Katılımda chat mesajı gitmesin, boş gönder
  res.send('');
});

// Moderatör komutu: Çekilişi yap, kazananı seç ve duyur
app.get('/cekilisyap', (req, res) => {
  if (cekilisAktif) {
    clearTimeout(cekilisTimeout);
    cekilisAktif = false;
  }

  if (katilimcilar.size === 0) {
    return res.send('Çekilişe katılan olmadı, kazanan seçilemiyor.');
  }

  // Katılımcılar arasından rastgele kazanan seç
  const katilimArray = Array.from(katilimcilar);
  const kazanan = katilimArray[Math.floor(Math.random() * katilimArray.length)];

  katilimcilar.clear();

  console.log(`🎉 Kazanan: ${kazanan}`);

  res.send(`🎉 Tebrikler @${kazanan}, Tebrikler Şanslı Kişi Sensin! 🎮`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    cekilisAktif,
    katilimciSayisi: katilimcilar.size,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    available_endpoints: [
      'GET /sanscek - Çekilişi başlat (moderatör)',
      'GET /sans - Çekilişe katıl (kullanıcı)',
      'GET /cekilisyap - Kazananı seç (moderatör)',
      'GET /health - Sistem durumu'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Sunucu hatası', message: error.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎉 Çekiliş botu çalışıyor: http://localhost:${PORT}`);
});
