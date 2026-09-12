import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const fontPath = "C:\\Users\\Casa\\AppData\\Local\\Temp\\opencode\\PlayfairDisplay-Italic.ttf";
const fontB64 = readFileSync(fontPath).toString("base64");

const CHOCOLATE_LIGHT = "#40241d";
const CHOCOLATE = "#2a1510";
const CHOCOLATE_DEEP = "#1f0f0b";
const GOLD = "#c59e4d";
const GOLD_BRIGHT = "#e8c67a";

const CANVAS = 1024;

function buildSvg({ contentScale = 1 }) {
  const c = CANVAS / 2;
  const ringR = CANVAS * 0.335 * contentScale;
  const ringW = CANVAS * 0.045 * contentScale;
  const fontPx = CANVAS * 0.52 * contentScale;
  const pY = c + fontPx * 0.35;

  return `<svg width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${GOLD_BRIGHT}"/>
      <stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
    <radialGradient id="bgGrad" cx="0.5" cy="0.42" r="0.85">
      <stop offset="0%" stop-color="${CHOCOLATE_LIGHT}"/>
      <stop offset="55%" stop-color="${CHOCOLATE}"/>
      <stop offset="100%" stop-color="${CHOCOLATE_DEEP}"/>
    </radialGradient>
    <style>
      @font-face {
        font-family: "Playfair Display";
        src: url(data:font/truetype;base64,${fontB64}) format("truetype");
        font-weight: 100 900;
        font-style: italic;
      }
    </style>
  </defs>
  <rect width="${CANVAS}" height="${CANVAS}" fill="url(#bgGrad)"/>
  <circle cx="${c}" cy="${c}" r="${ringR}" fill="none" stroke="url(#goldGrad)" stroke-opacity="0.55" stroke-width="${ringW}"/>
  <text x="${c}" y="${pY}" font-family="'Playfair Display'" font-size="${fontPx}" font-style="italic" font-weight="900" fill="url(#goldGrad)" text-anchor="middle">P</text>
</svg>`;
}

const icons = [
  { file: "icon-192.png", size: 192, contentScale: 1 },
  { file: "icon-512.png", size: 512, contentScale: 1 },
  { file: "icon-512-maskable.png", size: 512, contentScale: 0.75 },
  { file: "apple-touch-icon.png", size: 180, contentScale: 1 },
  { file: "icon-pdv-96.png", size: 96, contentScale: 1 },
  { file: "icon-admin-96.png", size: 96, contentScale: 1 },
];

mkdirSync("public/icons", { recursive: true });

const cache = new Map();
for (const icon of icons) {
  const key = icon.contentScale;
  if (!cache.has(key)) cache.set(key, Buffer.from(buildSvg({ contentScale: key })));
  await sharp(cache.get(key))
    .resize(icon.size, icon.size, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${icon.file}`);
  console.log("created", `public/icons/${icon.file}`);
}
