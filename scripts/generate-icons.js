#!/usr/bin/env node

/**
 * Icon Generator for Rebuilding Iran PWA
 *
 * This script generates PWA icons at various sizes.
 * Run: node scripts/generate-icons.js
 *
 * Requires: sharp (npm install -D sharp)
 *
 * For now, this creates placeholder SVG icons that can be replaced
 * with properly designed icons later.
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Simple SVG icon template
const createSvgIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">IR</text>
</svg>`;

// Ensure icons directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG icons for each size
ICON_SIZES.forEach((size) => {
  const svgContent = createSvgIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(ICONS_DIR, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated: ${filename}`);
});

// Create a basic favicon.ico placeholder (SVG version)
const faviconSvg = createSvgIcon(32);
fs.writeFileSync(path.join(ICONS_DIR, 'favicon.svg'), faviconSvg);
console.log('Generated: favicon.svg');

console.log('\\nIcon generation complete!');
console.log('\\nNote: For production, convert these SVGs to PNGs using a tool like sharp:');
console.log('npm install -D sharp');
console.log('Then update this script to use sharp for PNG conversion.');
