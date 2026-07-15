import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const publicDir = join(import.meta.dirname, '..', 'public');
const svgBuffer = readFileSync(join(publicDir, 'favicon.svg'));

async function generate() {
  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(publicDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(publicDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 180x180 PNG (Apple touch icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 32x32 PNG for favicon.ico fallback
  const favicon32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  // 16x16 PNG
  const favicon16 = await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toBuffer();

  // Create ICO from 16x16 and 32x32 PNGs using sharp (ICO format)
  // sharp doesn't support ICO directly, so we'll use PNG favicon
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(join(publicDir, 'favicon.png'));
  console.log('Created favicon.png');

  console.log('All icons generated!');
}

generate().catch(console.error);
