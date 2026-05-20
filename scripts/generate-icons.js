/**
 * PWA Icon Generator
 * Downloads the HappyMoment logo and resizes it to every required PWA icon size.
 * Also creates maskable-safe variants with #0a0a0a background padding.
 * Requires Node.js with sharp.
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import sharp from 'sharp';

const LOGO_URL   = 'https://res.cloudinary.com/djjgkezui/image/upload/v1778959179/IMG-20260516-WA0050_zegaok.jpg';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public');
const SIZES      = [72, 96, 128, 144, 152, 192, 256, 384, 512];
const BG_COLOR   = { r: 10, g: 10, b: 10, alpha: 1 };   // #0a0a0a
const PAD        = 0.15;  // 15% padding for maskable icons

// ── helpers ──────────────────────────────────────────────────────────────────

function download(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(download(res.headers.location));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        res.on('data', (c) => chunks.push(c));
        res.on('end',  () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

/** Return a Buffer: rounded logo centered on a solid-background PNG. */
async function makeMaskable(inputBuffer, size, padding = PAD) {
  const pad  = Math.round(size * padding);
  const icon = size - pad * 2;

  // ── inner resized logo ──
  const logoBuf = await sharp(inputBuffer)
    .resize(icon, icon, { fit: 'cover' })
    .png()
    .toBuffer();

  // ── solid background frame ──
  // We pass the background explicitly to composite so that the result is
  // a single sharp pipeline (no intermediate PNG).
  const bg = sharp({
    create: { width: size, height: size, channels: 4, background: BG_COLOR },
  });

  // Composite places logo on top of the background frame
  return bg
    .composite([{ input: logoBuf, left: pad, top: pad }])
    .png()
    .toBuffer();
}

/** Write a PNG to `public/icon-${size}.png`. */
async function saveIcon(buf, size, suffix = '') {
  const name = suffix ? `icon-${size}${suffix}.png` : `icon-${size}.png`;
  await sharp(buf)
    .resize(size, size, { fit: 'cover', withoutEnlargement: false })
    .png()
    .toFile(path.join(OUTPUT_DIR, name));
  console.log(`  ✓  ${name}`);
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Downloading logo …');
  const logo = await download(LOGO_URL);
  console.log(`  Logo size: ${(logo.length / 1024).toFixed(1)} KB\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const size of SIZES) {
    console.log(`→ size ${size}px`);
    // Standard any-purpose icon
    await saveIcon(logo, size);

    // Maskable icon (centred on #0a0a0a background)
    const maskable = await makeMaskable(logo, size);
    await fs.promises.writeFile(
      path.join(OUTPUT_DIR, `icon-${size}-maskable.png`),
      maskable,
    );
    console.log(`  ✓  icon-${size}-maskable.png`);
  }

  // Always present (referenced in manifest and vite-plugin-pwa includes)
  console.log('\nEnsuring common-aliases …');
  await fs.promises.copyFile(
    path.join(OUTPUT_DIR, 'icon-192.png'),
    path.join(OUTPUT_DIR, 'icon-192.png'), // already created above
  );
  await fs.promises.copyFile(
    path.join(OUTPUT_DIR, 'icon-512.png'),
    path.join(OUTPUT_DIR, 'icon-512.png'),
  );
  console.log('All icons generated successfully.');
}

main().catch((err) => {
  console.error('\n✎ Icon generation failed:', err);
  process.exit(1);
});
