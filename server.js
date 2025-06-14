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
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Minimal JSON parser
app.use(express.json({ limit: '100kb' }));

// Çekiliş durumu - Memory efficient
let cekilisAktif = false;
let katilimcilar = new Set();
let cekilisSuresi = 60000; // 1 dakika
let cekilisTimer = null;
let cekilisBaslangic = null;

// Render Free Plan için Wake-up endpoint
app.get('/wake', (req, res) => {
  res.status(200).send('🔥 Server is awake!');
});

// Çekilişi başlat - Ultra hızlı
app.get('/sanscek', (req, res) => {
  try {
    // Önce yanıt ver, sonra işle
    if (cekilisAktif) {
      return res.status(200).send('Çekiliş zaten aktif!');
    }
    
    // Hızlı başlat
    cekilisAktif = true;
    katilimcilar.clear();
    cekilisBaslangic = Date.now();
    
    // Timer'ı async başlat
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
    // Çekiliş aktif değilse sessiz kal
    if (!cekilisAktif) {
      return res.status(200).send('');
    }
    
    const username = req.query.username;
    if (!username || username.trim() === '') {
      return res.status(200).send('');
    }
    
    // Orijinal kullanıcı adını sakla (büyük/küçük harf korunarak)
    const originalUsername = username.trim();
    const cleanUsername = originalUsername.toLowerCase();
    
    // Zaten katıldıysa sessiz kal
    if (katilimcilar.has(cleanUsername)) {
      return res.status(200).send('');
    }
    
    // Katılımcıyı ekle (orijinal formatı sakla)
    katilimcilar.add(originalUsername);
    console.log(`✅ ${originalUsername} katıldı (${katilimcilar.size})`);
    
    // Sessiz yanıt
    res.status(200).send('');
  } catch (error) {
    console.error('Sans error:', error);
    res.status(200).send('');
  }
});

// Çekiliş yap - Hızlı (Botrix için mesaj ile)
app.get('/cekilisyap', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Cekilisyap error:', error);
    res.status(200).send('Çekiliş sırasında hata oluştu.');
  }
});

🏆 Kazanan seçildi: ${winner}`);
    
    // Botrix için sadece kullanıcı adını döndür
    res.status(200).send(winner);
    
  } catch (error) {
    console.error('Kazanan error:', error.message);
    console.error('Stack:', error.stack);
    res.status(200).send('HATA_OLUSTU');
  }
});

// Botrix özel endpoint - Tam mesaj ile
app.get('/cekilisbotrix', (req, res) => {
  try {
    const caller = req.query.caller || 'Moderatör';
    
    console.log(`🔍 Botrix çekiliş çağrısı - Caller: ${caller}, Aktif: ${cekilisAktif}, Katılımcı: ${katilimcilar.size}`);
    
    if (!cekilisAktif && katilimcilar.size === 0) {
      return res.status(200).send('Aktif çekiliş yok. Önce !sanscek ile çekiliş başlatın.');
    }
    
    // Cleanup
    if (cekilisTimer) clearTimeout(cekilisTimer);
    cekilisAktif = false;
    cekilisTimer = null;
    
    if (katilimcilar.size === 0) {
      return res.status(200).send('Hiç katılımcı yok. Çekiliş iptal edildi.');
    }
    
    // Winner selection
    const arr = [...katilimcilar];
    const winner = arr[Math.floor(Math.random() * arr.length)];
    
    // Stats
    const katilimciSayisi = katilimcilar.size;
    katilimcilar.clear();
    
    console.log(`🏆 Botrix Kazanan: ${winner} (${katilimciSayisi} katılımcı)`);
    
    const message = `🎉 ÇEKILIŞ SONUCU 🎉\n\n🏆 Kazanan: @${winner}\n👥 Toplam Katılımcı: ${katilimciSayisi}\n🎯 Çekilişi Yapan: ${caller}\n\nTebrikler! 🎊`;
    
    res.status(200).send(message);
    
  } catch (error) {
    console.error('Botrix çekiliş error:', error);
    res.status(200).send('Çekiliş sırasında bir hata oluştu.');
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

// Health check - Daha detaylı
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

// Ana sayfa - Güncellenmiş
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Kick Çekiliş API',
    version: '2.1-botrix',
    status: '✅ Botrix Ready',
    endpoints: {
      start: '/sanscek - Çekiliş başlat',
      join: '/sans?username=NAME - Çekilişe katıl',
      draw_full: '/cekilisyap - Çekiliş yap (mesaj ile)',
      draw_botrix: '/cekilisbotrix?caller=NAME - Botrix çekilişi',
      winner_only: '/kazanan - Sadece kazanan adı',
      status: '/durum - Çekiliş durumu',
      health: '/health - Server durumu',
      wake: '/wake - Server uyandır'
    },
durum]'
    },
    tips: [
      'Use /wake to prevent cold starts',
      'Check /health for server status',
      'Use /durum to see draw status'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: '404 - Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  console.error('Stack:', err.stack);
  
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 10000;

// Server başlat
const server = app.listen(PORT, () => {
  console.log(`🚀 Botrix API running on port ${PORT}`);
  console.log(`🔗 URL: https://sanscek.onrender.com`);
  console.log(`📊 Endpoints: ${Object.keys(app._router.stack).length}`);
});

// Free plan optimizations
server.timeout = 25000;
server.keepAliveTimeout = 5000;
server.headersTimeout = 26000;

// Memory cleanup
let cleanupInterval = setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log('🧹 Memory cleanup performed');
  }
}, 300000);

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Shutting down gracefully...');
  
  clearInterval(cleanupInterval);
  if (cekilisTimer) clearTimeout(cekilisTimer);
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

console.log('🆓 Render Free Plan Mode Active');
console.log('🤖 Botrix Integration Ready');
console.log('💡 Tip: Use /wake endpoint to prevent cold starts');
