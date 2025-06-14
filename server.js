const express = require('express');
const cors = require('cors');

const app = express();

// Render Free Plan için özel ayarlar
app.use((req, res, next) => {
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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100kb' }));

// Çekiliş durumu
let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000; // 1 dakika
let cekilisTimer = null;
let cekilisBaslangic = null;

// Wake-up endpoint
app.get('/wake', (req, res) => {
  res.status(200).send('🔥 Server is awake!');
});

// Çekilişi başlat
app.get('/sanscek', (req, res) => {
  try {
    if (cekilisAktif) {
      return res.status(200).send('Çekiliş zaten aktif!');
    }
    
    cekilisAktif = true;
    katilimcilar.clear();
    cekilisBaslangic = Date.now();
    
    process.nextTick(() => {
      if (cekilisTimer) clearTimeout(cekilisTimer);
      cekilisTimer = setTimeout(() => {
        cekilisAktif = false;
        cekilisTimer = null;
        console.log('⏰ Çekiliş otomatik bitti');
      }, cekilisSuresi);
    });
    
    console.log('🎉 Çekiliş başladı');
    res.status(200).send('🎉 Çekiliş başladı! 1 dakika süreyle !sans yazarak katılabilirsiniz! 🎉');
  } catch (error) {
    console.error('Sanscek error:', error);
    res.status(200).send('Çekiliş başlatılamadı.');
  }
});

// Katılım - Sessiz
app.get('/sans', (req, res) => {
  try {
    if (!cekilisAktif) {
      return res.status(200).send('');
    }
    
    const username = req.query.username;
    if (!username || username.trim() === '') {
      return res.status(200).send('');
    }
    
    const originalUsername = username.trim();
    const cleanUsername = originalUsername.toLowerCase();
    
    // Duplicate check için lowercase kullan ama orijinali sakla
    let alreadyExists = false;
    for (let participant of katilimcilar) {
      if (participant.toLowerCase() === cleanUsername) {
        alreadyExists = true;
        break;
      }
    }
    
    if (alreadyExists) {
      return res.status(200).send('');
    }
    
    katilimcilar.add(originalUsername);
    console.log(`✅ ${originalUsername} katıldı (${katilimcilar.size})`);
    
    res.status(200).send('');
  } catch (error) {
    console.error('Sans error:', error);
    res.status(200).send('');
  }
});

// Sadece kazanan - Botrix için
app.get('/kazanan', (req, res) => {
  try {
    console.log(`🔍 Kazanan endpoint - Aktif: ${cekilisAktif}, Katılımcı: ${katilimcilar.size}`);
    
    if (!cekilisAktif && katilimcilar.size === 0) {
      console.log('❌ Aktif çekiliş yok');
      return res.status(200).send('ÇEKILIŞ_YOK');
    }
    
    if (cekilisTimer) {
      clearTimeout(cekilisTimer);
      cekilisTimer = null;
    }
    
    cekilisAktif = false;
    
    if (katilimcilar.size === 0) {
      console.log('❌ Katılımcı yok');
      return res.status(200).send('KATILIMCI_YOK');
    }
    
    const participantArray = [...katilimcilar];
    const randomIndex = Math.floor(Math.random() * participantArray.length);
    const winner = participantArray[randomIndex];
    
    katilimcilar.clear();
    
    console.log(`🏆 Kazanan: ${winner} (${participantArray.length} kişi arasından)`);
    
    res.status(200).send(winner);
    
  } catch (error) {
    console.error('Kazanan error:', error.message);
    res.status(200).send('HATA');
  }
});

// Çekiliş yap - Tam mesaj ile
app.get('/cekilisyap', (req, res) => {
  try {
    if (!cekilisAktif && katilimcilar.size === 0) {
      return res.status(200).send('Aktif çekiliş yok.');
    }
    
    if (cekilisTimer) clearTimeout(cekilisTimer);
    cekilisAktif = false;
    cekilisTimer = null;
    
    if (katilimcilar.size === 0) {
      return res.status(200).send('Katılımcı yok.');
    }
    
    const arr = [...katilimcilar];
    const winner = arr[Math.floor(Math.random() * arr.length)];
    
    katilimcilar.clear();
    
    console.log(`🏆 Kazanan: ${winner}`);
    res.status(200).send(`🎉 TEBRİKLER @${winner} ŞANSLI KİŞİ SENSİN! 🎉`);
  } catch (error) {
    console.error('Cekilisyap error:', error);
    res.status(200).send('Çekiliş sırasında hata oluştu.');
  }
});

// Durum kontrolü
app.get('/durum', (req, res) => {
  try {
    const kalanSure = cekilisAktif && cekilisBaslangic ? 
      Math.max(0, Math.ceil((cekilisSuresi - (Date.now() - cekilisBaslangic)) / 1000)) : 0;
    
    const durum = {
      cekilisAktif,
      katilimciSayisi: katilimcilar.size,
      kalanSure: kalanSure + ' saniye',
      katilimcilar: cekilisAktif ? [...katilimcilar] : []
    };
    
    res.status(200).json(durum);
  } catch (error) {
    console.error('Durum error:', error);
    res.status(200).json({ error: 'Durum alınamadı' });
  }
});

// Health check
app.get('/health', (req, res) => {
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    res.status(200).json({
      ok: true,
      active: cekilisAktif,
      participants: katilimcilar.size,
      uptime: Math.floor(uptime),
      memory: Math.floor(memUsage.heapUsed / 1024 / 1024) + 'MB',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(200).json({ ok: false, error: error.message });
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Kick Çekiliş API',
    version: '2.1-fixed',
    status: '✅ Ready',
    endpoints: {
      start: '/sanscek - Çekiliş başlat',
      join: '/sans?username=NAME - Çekilişe katıl (sessiz)',
      draw: '/cekilisyap - Çekiliş yap (mesaj ile)',
      winner: '/kazanan - Sadece kazanan adı',
      status: '/durum - Çekiliş durumu',
      health: '/health - Server durumu',
      wake: '/wake - Server uyandır'
    },
    botrix_commands: {
      start: '!sanscek -> fetch[https://sanscek.onrender.com/sanscek]',
      join: '!sans -> fetch[https://sanscek.onrender.com/sans?username={user.login}]',
      draw: '!cekilis -> 🎉 TEBRİKLER @{fetch[https://sanscek.onrender.com/kazanan]} ŞANSLI KİŞİ SENSİN! 🎉'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: '404 - Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 URL: https://sanscek.onrender.com`);
});

server.timeout = 25000;
server.keepAliveTimeout = 5000;
server.headersTimeout = 26000;

// Memory cleanup
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000);

// Shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

console.log('🆓 Render Free Plan Active');
console.log('🤖 Botrix Ready');
