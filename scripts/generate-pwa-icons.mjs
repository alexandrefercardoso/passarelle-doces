import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { readFileSync } from "node:fs";

const fontPath = "C:\\Users\\Casa\\AppData\\Local\\Temp\\opencode\\PlayfairDisplay-Italic.ttf";
const fontB64 = readFileSync(fontPath).toString("base64");

const CANVAS = 1024;

function toGradient(stops) {
  return stops
    .map(
      (stop, i) =>
        `<stop offset="${Math.round((i / (stops.length - 1)) * 100)}%" stop-color="${stop}"/>`,
    )
    .join("");
}

function buildSvg(palette, { contentScale = 1 }) {
  const c = CANVAS / 2;
  const ringR = CANVAS * 0.335 * contentScale;
  const ringW = CANVAS * 0.045 * contentScale;
  const fontPx = CANVAS * 0.52 * contentScale;
  const pY = c + fontPx * 0.35;

  return `<svg width="${CANVAS}" height="${CANVAS}" viewBox="0 0 ${CANVAS} ${CANVAS}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="letterGrad" x1="0" y1="0" x2="0" y2="1">
      ${toGradient(palette.letter)}
    </linearGradient>
    <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="1">
      ${toGradient(palette.ring)}
    </linearGradient>
    <radialGradient id="bgGrad" cx="0.5" cy="0.42" r="0.85">
      ${toGradient(palette.bg)}
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
  <circle cx="${c}" cy="${c}" r="${ringR}" fill="none" stroke="url(#ringGrad)" stroke-opacity="${palette.ringOpacity}" stroke-width="${ringW}"/>
  <text x="${c}" y="${pY}" font-family="'Playfair Display'" font-size="${fontPx}" font-style="italic" font-weight="900" fill="url(#letterGrad)" text-anchor="middle">P</text>
</svg>`;
}

const CHOCOLATE_LIGHT = "#40241d";
const CHOCOLATE = "#2a1510";
const CHOCOLATE_DEEP = "#1f0f0b";
const CHOCOLATE_REAL = "#462e2d";
const GOLD = "#c59e4d";
const GOLD_BRIGHT = "#e8c67a";
const GOLD_SOFT = "#f2e3bf";
const GOLD_DEEP = "#9a7528";
const CREAM = "#f6ead2";

const store = {
  bg: [CHOCOLATE_LIGHT, CHOCOLATE, CHOCOLATE_DEEP],
  letter: [GOLD_BRIGHT, GOLD],
  ring: [GOLD_BRIGHT, GOLD],
  ringOpacity: 0.55,
};

const pdv = {
  bg: [GOLD_SOFT, GOLD, GOLD_DEEP],
  letter: [CHOCOLATE_REAL, CHOCOLATE_DEEP],
  ring: [CHOCOLATE, CHOCOLATE_DEEP],
  ringOpacity: 0.5,
};

const admin = {
  bg: ["#3a2219", "#1c0e09", "#120804"],
  letter: [CREAM, "#e3c886"],
  ring: [GOLD_BRIGHT, GOLD],
  ringOpacity: 0.8,
};

const icons = [
  { file: "icon-192.png", size: 192, palette: store, contentScale: 1 },
  { file: "icon-512.png", size: 512, palette: store, contentScale: 1 },
  { file: "icon-512-maskable.png", size: 512, palette: store, contentScale: 0.75 },
  { file: "apple-touch-icon.png", size: 180, palette: store, contentScale: 1 },
  { file: "icon-pdv-192.png", size: 192, palette: pdv, contentScale: 1 },
  { file: "icon-pdv-512.png", size: 512, palette: pdv, contentScale: 1 },
  { file: "icon-admin-192.png", size: 192, palette: admin, contentScale: 1 },
  { file: "icon-admin-512.png", size: 512, palette: admin, contentScale: 1 },
];

mkdirSync("public/icons", { recursive: true });

const cache = new Map();
for (const icon of icons) {
  const key = `${icon.palette.letter.join()}-${icon.contentScale}`;
  if (!cache.has(key))
    cache.set(key, Buffer.from(buildSvg(icon.palette, { contentScale: icon.contentScale })));
  await sharp(cache.get(key))
    .resize(icon.size, icon.size, { kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toFile(`public/icons/${icon.file}`);
  console.log("created", `public/icons/${icon.file}`);
}
