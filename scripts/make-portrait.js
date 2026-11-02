#!/usr/bin/env node
/**
 * scripts/make-portrait.js
 *
 * Đọc ảnh gốc từ thong-tin/anh/<tên file>, tự động xoay theo EXIF,
 * XÓA TOÀN BỘ metadata EXIF/GPS/IPTC/XMP, cắt tỷ lệ 4:5 (tâm 50% ngang, 30% dọc),
 * và xuất ra AVIF / WebP / JPG ở 3 kích thước 480w (480x600), 800w (800x1000),
 * 1200w (1200x1500) vào thư mục assets/img/ (mỗi file <= 150KB).
 *
 * Cách dùng:
 *   node scripts/make-portrait.js <ten-file-trong-thong-tin-anh>
 *   node scripts/make-portrait.js --demo   (tạo bộ ảnh mẫu trung tính cho data/_demo/)
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error(
    '[make-portrait] Chưa cài đặt thư viện "sharp". Vui lòng cài đặt bằng lệnh: npm install --save-dev sharp'
  );
  process.exit(1);
}

const SIZES = [
  { width: 480, height: 600 },
  { width: 800, height: 1000 },
  { width: 1200, height: 1500 }
];

const MAX_BYTES = 150 * 1024; // 150 KB

function buildNeutralDemoSvg() {
  // Ảnh mẫu hình học / kiến trúc kiểu Swiss trung tính (tuyệt đối không dùng ảnh người thật)
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8e8e8"/>
      <stop offset="55%" stop-color="#d4d4d4"/>
      <stop offset="100%" stop-color="#b8b8b8"/>
    </linearGradient>
    <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2b2b2b"/>
      <stop offset="100%" stop-color="#121212"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1500" fill="url(#bg)"/>
  <!-- Lưới kiến trúc Swiss -->
  <g stroke="#9e9e9e" stroke-width="2" opacity="0.6">
    <line x1="200" y1="0" x2="200" y2="1500"/>
    <line x1="400" y1="0" x2="400" y2="1500"/>
    <line x1="600" y1="0" x2="600" y2="1500"/>
    <line x1="800" y1="0" x2="800" y2="1500"/>
    <line x1="1000" y1="0" x2="1000" y2="1500"/>
    <line x1="0" y1="250" x2="1200" y2="250"/>
    <line x1="0" y1="500" x2="1200" y2="500"/>
    <line x1="0" y1="750" x2="1200" y2="750"/>
    <line x1="0" y1="1000" x2="1200" y2="1000"/>
    <line x1="0" y1="1250" x2="1200" y2="1250"/>
  </g>
  <!-- Khối hình học trung tính đặt trọng tâm quanh 50% 30% (x=600, y=450) -->
  <rect x="240" y="180" width="720" height="1040" fill="#dcdcdc" stroke="#1a1a1a" stroke-width="6"/>
  <rect x="320" y="250" width="560" height="500" fill="url(#arch)"/>
  <circle cx="600" cy="450" r="165" fill="#f2f2f2"/>
  <circle cx="600" cy="450" r="78" fill="#1a1a1a"/>
  <rect x="320" y="810" width="260" height="330" fill="#4a4a4a"/>
  <rect x="620" y="810" width="260" height="150" fill="#707070"/>
  <rect x="620" y="990" width="260" height="150" fill="#1a1a1a"/>
</svg>`, 'utf8');
}

function resolveInputPath(argFile) {
  const candidates = [
    path.resolve(__dirname, '../../thong-tin/anh', argFile),
    path.resolve(__dirname, '../thong-tin/anh', argFile),
    path.resolve(process.cwd(), 'thong-tin/anh', argFile),
    path.resolve(process.cwd(), argFile)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      return c;
    }
  }
  return null;
}

async function encodeUnderLimit(pipelineFactory, format) {
  let quality = format === 'avif' ? 68 : format === 'webp' ? 82 : 84;
  const minQuality = 30;

  while (quality >= minQuality) {
    const p = pipelineFactory();
    let buf;
    if (format === 'avif') {
      buf = await p.avif({ quality, effort: 4 }).toBuffer();
    } else if (format === 'webp') {
      buf = await p.webp({ quality, effort: 4 }).toBuffer();
    } else {
      buf = await p.jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
    }

    if (buf.length <= MAX_BYTES || quality === minQuality) {
      return { buf, quality };
    }
    quality -= 6;
  }
  throw new Error(`Không thể nén ${format} xuống <= 150KB`);
}

async function processImage(inputSource, outDir, prefix) {
  fs.mkdirSync(outDir, { recursive: true });

  // Bước 1: Xoay tự động theo EXIF và chuyển thành buffer nguyên bản không kèm metadata
  const oriented = await sharp(inputSource)
    .rotate() // Tự động xoay theo EXIF Orientation và loại bỏ tag Orientation
    .toBuffer({ resolveWithObject: true });

  const srcW = oriented.info.width;
  const srcH = oriented.info.height;
  const targetAspect = 4 / 5;

  // Bước 2: Tính khung cắt 4:5 quanh tâm 50% ngang, 30% dọc (object-position: 50% 30%)
  let cropW = srcW;
  let cropH = Math.round(srcW / targetAspect);
  if (cropH > srcH) {
    cropH = srcH;
    cropW = Math.round(srcH * targetAspect);
  }

  const left = Math.max(0, Math.min(srcW - cropW, Math.round((srcW - cropW) * 0.5)));
  const top = Math.max(0, Math.min(srcH - cropH, Math.round((srcH - cropH) * 0.3)));

  const results = [];

  for (const { width, height } of SIZES) {
    const makeResized = () =>
      sharp(oriented.data)
        .extract({ left, top, width: cropW, height: cropH })
        .resize(width, height, { fit: 'cover' }); // Không gọi .withMetadata() -> XÓA toàn bộ EXIF/GPS

    for (const fmt of ['avif', 'webp', 'jpg']) {
      const { buf, quality } = await encodeUnderLimit(makeResized, fmt);

      // Kiểm tra xác nhận đã xóa sạch EXIF/GPS
      const checkMeta = await sharp(buf).metadata();
      if (checkMeta.exif) {
        throw new Error(`File ${prefix}-${width}.${fmt} vẫn còn dữ liệu EXIF!`);
      }
      if (buf.length > MAX_BYTES) {
        throw new Error(`File ${prefix}-${width}.${fmt} vượt quá 150KB (${buf.length} bytes)`);
      }

      const fileName = `${prefix}-${width}.${fmt}`;
      const outPath = path.join(outDir, fileName);
      fs.writeFileSync(outPath, buf);

      results.push({
        file: fileName,
        dimensions: `${width}x${height}`,
        format: fmt.toUpperCase(),
        quality,
        bytes: buf.length,
        kb: (buf.length / 1024).toFixed(2) + ' KB',
        exifRemoved: !checkMeta.exif
      });
    }
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Cách dùng:');
    console.log('  node scripts/make-portrait.js <tên-file-trong-thong-tin/anh>');
    console.log('  node scripts/make-portrait.js --demo');
    process.exit(1);
  }

  if (args[0] === '--demo') {
    const demoOutDir = path.resolve(__dirname, '../data/_demo');
    const svgBuf = buildNeutralDemoSvg();
    const res = await processImage(svgBuf, demoOutDir, 'demo-portrait');
    console.table(res);
    return;
  }

  const inputArg = args[0];
  const resolvedInput = resolveInputPath(inputArg);
  if (!resolvedInput) {
    console.error(`[make-portrait] Không tìm thấy file ảnh gốc: thong-tin/anh/${inputArg}`);
    process.exit(1);
  }

  const outDir = path.resolve(__dirname, '../assets/img');
  const res = await processImage(resolvedInput, outDir, 'portrait');
  console.log(`Đã xử lý ảnh gốc: ${resolvedInput}`);
  console.table(res);
}

main().catch(err => {
  console.error('[make-portrait] Lỗi:', err.message);
  process.exit(1);
});

