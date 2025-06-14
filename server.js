const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Çekiliş durumu
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
    console.log('⏰ Çekiliş süresi doldu. Katılım kapandı.');
  }, cekilisSuresi);
  
  console.log('🎉 Çekiliş başladı! 1 dakika katılım alınacak.');
  res.send('🎉 Çekiliş başladı! 1 dakika süreyle !sans yazarak katılabilirsiniz! 🎉');
});

// Katılım (sessiz)
app.get('/sans', (req, res) => {
  if (!cekilisAktif) return res.send('');
  
  const username = req.query.username;
  if (!username) return res.send('');
  
  if (katilimcilar.has(username)) return res.send('');
  
  katilimcilar.add(username);
  console.log(`✅ ${username} çekilişe katıldı. Toplam: ${katilimcilar.size}`);
  res.send(''); // Sessiz katılım - hiçbir mesaj göstermez
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
  
  console.log(`🏆 Kazanan: ${kazanan} (${katilimcilar.size} katılımcı arasından)`);
  katilimcilar.clear();
  
  // Kazananı duyur - Botrix için düzgün format
  return res.send(`🎉 TEBRİKLER @${kazanan} ŞANSLI KİŞİ SENSİN! 🎉`);
});

// Sadece kazanan adını döndür (Botrix custom message için)
app.get('/kazanan', (req, res) => {
  if (!cekilisAktif && katilimcilar.size === 0) {
    return res.send('');
  }
  
  if (cekilisTimer) {
    clearTimeout(cekilisTimer);
    cekilisTimer = null;
  }
  
  cekilisAktif = false;
  
  if (katilimcilar.size === 0) {
    return res.send('');
  }
  
  const katilimciArray = Array.from(katilimcilar);
  const kazanan = katilimciArray[Math.floor(Math.random() * katilimciArray.length)];
  
  console.log(`🏆 Kazanan: ${kazanan} (${katilimcilar.size} katılımcı arasından)`);
  katilimcilar.clear();
  
  // Sadece kullanıcı adını döndür
  return res.send(kazanan);
});

// Sağlık kontrol
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    cekilisAktif,
    katilimciSayisi: katilimcilar.size,
    timestamp: new Date().toISOString()
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    service: 'Kick Çekiliş API',
    version: '1.0.0',
    status: 'Çalışıyor',
    endpoints: {
      'GET /sanscek': 'Çekilişi başlat',
      'GET /sans?username=X': 'Katılım al (sessiz)',
      'GET /cekilisyap': 'Kazananı seç',
      'GET /kazanan': 'Sadece kazanan adı',
      'GET /health': 'Sistem durumu'
    },
    botrix_commands: {
      '!sanscek': 'fetch[https://sanscek.onrender.com/sanscek]',
      '!sans': 'fetch[https://sanscek.onrender.com/sans?username={user.login}]',
      '!cekilis_v1': 'fetch[https://sanscek.onrender.com/cekilisyap]',
      '!cekilis_v2': '🎉 TEBRİKLER {fetch[https://sanscek.onrender.com/kazanan]} ŞANSLI KİŞİ SENSİN! 🎉'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint bulunamadı',
    available_endpoints: ['/sanscek', '/sans', '/cekilisyap', '/kazanan', '/health']
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Çekiliş API ${PORT} portunda çalışıyor`);
  console.log(`🌐 API URL: https://sanscek.onrender.com`);
  console.log(`📊 Health Check: https://sanscek.onrender.com/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Sunucu kapatılıyor...');
  process.exit(0);
});
