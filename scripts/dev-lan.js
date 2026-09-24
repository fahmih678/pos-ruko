const os = require('os');
const net = require('net');
const { spawn } = require('child_process');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const netInfo of interfaces[name]) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        const isWifi = name.toLowerCase().includes('wlan') || name.toLowerCase().includes('wifi');
        const isEth = name.toLowerCase().includes('eth') || name.toLowerCase().includes('en');
        const priority = isWifi ? 1 : isEth ? 2 : 3;
        candidates.push({ ip: netInfo.address, priority, interface: name });
      }
    }
  }

  candidates.sort((a, b) => a.priority - b.priority);
  return candidates.length > 0 ? candidates[0].ip : 'localhost';
}

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '0.0.0.0', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function main() {
  const localIp = getLocalIpAddress();
  const basePort = Number(process.env.PORT) || 3000;

  if (process.argv.includes('--test-ip')) {
    console.log(JSON.stringify({ localIp, networkUrl: `https://${localIp}:${basePort}` }));
    process.exit(0);
  }

  const port = await findAvailablePort(basePort);
  const networkUrl = `https://${localIp}:${port}`;
  const localUrl = `https://localhost:${port}`;

  console.log('\n=============================================================');
  console.log('📱 POS RUKO - PENGEMBANGAN AKSES MOBILE VIA WIFI (HTTPS)');
  console.log('=============================================================');
  console.log(`\n> Akses Laptop : \x1b[36m${localUrl}\x1b[0m`);
  console.log(`> Akses HP/WiFi: \x1b[32m\x1b[1m${networkUrl}\x1b[0m`);
  console.log('\nScan QR Code berikut langsung dengan kamera HP Anda:');

  try {
    const qrcode = require('qrcode-terminal');
    qrcode.generate(networkUrl, { small: true }, (qrcodeStr) => {
      console.log(qrcodeStr);
    });
  } catch (err) {
    console.log(`\n(Buka browser HP dan buka: ${networkUrl})`);
  }

  console.log('💡 TIPS PENTING DI BROWSER HP:');
  console.log(' 1. Pastikan HP & Laptop terhubung ke Wi-Fi yang sama.');
  console.log(' 2. Saat muncul peringatan "Koneksi tidak pribadi / Not Private":');
  console.log('    - Klik tombol "Lanjutan" / "Advanced"');
  console.log('    - Klik "Lanjutkan ke situs (tidak aman)" / "Proceed"');
  console.log(' 3. Fitur Kamera Barcode Scanner otomatis diizinkan karena HTTPS!\n');
  console.log('-------------------------------------------------------------\n');

  // Spawn Next.js dev server with HTTPS on all interfaces
  const nextDev = spawn(
    'npx',
    ['next', 'dev', '-H', '0.0.0.0', '-p', String(port), '--experimental-https'],
    {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: String(port) },
    }
  );

  nextDev.on('close', (code) => {
    process.exit(code || 0);
  });
}

main();

