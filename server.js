const express = require('express');
const cors = require('cors');

const app = express();

// Render Free Plan için özel ayarlar
app.use((req, res, next) => {
  // Render free plan 30sn timeout'u var, 20sn'de yanıt ver
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.log('⚠️ Timeout prevention - sending quick response');
      res.status(200).send('Processing...');
    }
  }, 20000);
  
  res.on('finish', () => clearTimeout(timeout));
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Minimal JSON parser
app.use(express.json({ limit: '100kb' }));

// Çekiliş durumu - Memory efficient
let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000; // 1 dakika
let cekilisTimer = null;

// Render Free Plan için Wake-up endpoint
app.get('/wake', (req, res) => {
  res.status(200).send('🔥 Server is awake!');
});

// Çekilişi başlat - Ultra hızlı
app.get('/sanscek', (req, res) => {
  // Önce yanıt ver, sonra işle
  if (cekilisAktif) {
    return res.status(200).send('Çekiliş zaten aktif!');
  }
  
  // Hızlı başlat
  cekilisAktif = true;
  katilimcilar.clear();
  
  // Timer'ı async başlat
  process.nextTick(() => {
    if (cekilisTimer) clearTimeout(cekilisTimer);
    cekilisTimer = setTimeout(() => {
      cekilisAktif = false;
      cekilisTimer = null;
      console.log('⏰ Çekiliş bitti');
    }, cekilisSuresi);
  });
  
  console.log('🎉 Çekiliş başladı');
  res.status(200).send('🎉 Çekiliş başladı! 1 dakika süreyle !sans yazarak katılabilirsiniz! 🎉');
});

// Katılım - Süper hızlı
app.get('/sans', (req, res) => {
  // Instant response for inactive draws
  if (!cekilisAktif) return res.status(200).send('');
  
  const username = req.query.username;
  if (!username) return res.status(200).send('');
  
  // Hızlı kontrol
  if (katilimcilar.has(username)) return res.status(200).send('');
  
  // Async add
  process.nextTick(() => {
    katilimcilar.add(username);
    console.log(`✅ ${username} katıldı (${katilimcilar.size})`);
  });
  
  res.status(200).send(''); // Instant silent response
});

// Çekiliş yap - Hızlı
app.get('/cekilisyap', (req, res) => {
  if (!cekilisAktif && katilimcilar.size === 0) {
    return res.status(200).send('Aktif çekiliş yok.');
  }
  
  // Cleanup
  if (cekilisTimer) clearTimeout(cekilisTimer);
  cekilisAktif = false;
  cekilisTimer = null;
  
  if (katilimcilar.size === 0) {
    return res.status(200).send('Katılımcı yok.');
  }
  
  // Hızlı winner selection
  const arr = [...katilimcilar];
  const winner = arr[Math.floor(Math.random() * arr.length)];
  
  // Cleanup
  katilimcilar.clear();
  
  console.log(`🏆 Kazanan: ${winner}`);
  res.status(200).send(`🎉 TEBRİKLER @${winner} ŞANSLI KİŞİ SENSİN! 🎉`);
});

// Sadece kazanan - Hızlı
app.get('/kazanan', (req, res) => {
  if (!cekilisAktif && katilimcilar.size === 0) {
    return res.status(200).send('');
  }
  
  // Cleanup
  if (cekilisTimer) clearTimeout(cekilisTimer);
  cekilisAktif = false;
  cekilisTimer = null;
  
  if (katilimcilar.size === 0) {
    return res.status(200).send('');
  }
  
  // Hızlı selection
  const arr = [...katilimcilar];
  const winner = arr[Math.floor(Math.random() * arr.length)];
  katilimcilar.clear();
  
  console.log(`🏆 Kazanan: ${winner}`);
  res.status(200).send(winner);
});

// Minimal health check
app.get('/health', (req, res) => {
  res.status(200).json({
    ok: true,
    active: cekilisAktif,
    count: katilimcilar.size,
    time: new Date().toISOString()
  });
});

// Ana sayfa - Minimal
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Kick Çekiliş API',
    version: '2.0-free',
    status: '✅ Free Plan Optimized',
    endpoints: ['/sanscek', '/sans', '/cekilisyap', '/kazanan', '/health', '/wake'],
    botrix: {
      start: '!sanscek -> fetch[https://sanscek.onrender.com/sanscek]',
      join: '!sans -> fetch[https://sanscek.onrender.com/sans?username={user.login}]',
      draw: '!cekilis -> fetch[https://sanscek.onrender.com/cekilisyap]'
    },
    tip: 'Use /wake to prevent cold starts'
  });
});

// 404 - Minimal
app.use('*', (req, res) => {
  res.status(404).send('404');
});

// Error handler - Minimal
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (!res.headersSent) {
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 10000;

// Minimal server setup
const server = app.listen(PORT, () => {
  console.log(`🚀 Free Plan API running on port ${PORT}`);
  console.log(`🔗 URL: https://sanscek.onrender.com`);
});

// Free plan optimizations
server.timeout = 25000; // 25 second timeout
server.keepAliveTimeout = 0; // Disable keep-alive to save resources
server.headersTimeout = 26000;

// Memory cleanup for free plan
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000); // Every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutdown...');
  server.close(() => process.exit(0));
});

// Prevent crashes on free plan
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('🆓 Render Free Plan Mode Active');
console.log('💡 Tip: Use /wake endpoint to prevent cold starts');
console.log('📊 Memory usage will be optimized automatically');
