'use strict';

const fs = require('fs');
const path = require('path');

// Rutas
const DATASET_PATH = path.join(__dirname, '..', 'dataset.txt');
const SEED_OUTPUT_PATH = path.join(__dirname, '..', 'backend', 'seed-markers.js');
const REPORT_OUTPUT_PATH = path.join(__dirname, 'dataset-report.json');

// ─── Funciones de extracción ────────────────────────────────────────────────

function extractPlacemarks(content) {
  const regex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractTitle(xml) {
  // El nombre puede estar en CDATA o texto plano
  const cdataMatch = xml.match(/<name><!\[CDATA\[([\s\S]*?)\]\]><\/name>/);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(/<name>([\s\S]*?)<\/name>/);
  return plainMatch ? plainMatch[1].trim() : null;
}

function extractFirstImage(xml) {
  const descMatch = xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
  if (!descMatch) return null;
  const desc = descMatch[1];
  const imgMatch = desc.match(/<img\s+src="([^"]+)"/);
  return imgMatch ? imgMatch[1] : null;
}

function extractCoordinates(xml) {
  const pointMatch = xml.match(/<Point>\s*<coordinates>\s*([\s\S]*?)\s*<\/coordinates>\s*<\/Point>/);
  if (!pointMatch) return null;
  const parts = pointMatch[1].trim().split(',');
  if (parts.length < 2) return null;
  const lng = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);
  if (isNaN(lng) || isNaN(lat)) return null;
  return [lng, lat];
}

function extractDescription(xml) {
  const descMatch = xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
  if (!descMatch) {
    // Texto plano sin CDATA
    const plainDesc = xml.match(/<description>([\s\S]*?)<\/description>/);
    if (!plainDesc) return '';
    return cleanHtml(plainDesc[1]);
  }
  return cleanHtml(descMatch[1]);
}

function cleanHtml(html) {
  // Reemplazar <br> y variantes por espacios
  let text = html.replace(/<br\s*\/?>/gi, ' ');
  // Eliminar todas las etiquetas HTML
  text = text.replace(/<[^>]+>/g, '');
  // Decodificar entidades HTML comunes
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  // Colapsar espacios múltiples
  text = text.replace(/\s+/g, ' ').trim();
  // Limitar a 500 caracteres
  if (text.length > 500) {
    text = text.substring(0, 500).trim();
  }
  return text;
}

function extractAuthor(cleanText) {
  // Buscar nombres en mayúsculas (2+ palabras, todas en mayúsculas, mínimo 2 letras por palabra)
  const authorRegex = /\b([A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{2,})+)\b/g;
  const matches = [];
  let m;
  while ((m = authorRegex.exec(cleanText)) !== null) {
    // Filtrar falsos positivos comunes
    const candidate = m[1];
    if (candidate.length < 5) continue;
    // Ignorar palabras comunes en mayúsculas que no son nombres
    const ignored = ['PINTA SAN LUIS', 'PLAN DE', 'EE UU'];
    if (ignored.includes(candidate)) continue;
    matches.push(candidate);
  }
  if (matches.length === 0) return '';
  // Tomar el primer match y formatearlo en Title Case
  const raw = matches[0];
  return raw
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function categorize(text) {
  const lower = text.toLowerCase();
  if (/escultura|sculpture|talla|tallado/.test(lower)) return 'sculpture';
  if (/graffiti|grafiti|stencil/.test(lower)) return 'graffiti';
  return 'mural';
}

// ─── Pipeline principal ─────────────────────────────────────────────────────

function main() {
  console.log('📖 Leyendo dataset...');
  const content = fs.readFileSync(DATASET_PATH, 'utf-8');

  const placemarks = extractPlacemarks(content);
  console.log(`   Encontrados ${placemarks.length} Placemarks`);

  const markers = [];
  const warnings = [];
  let recordsMissingCoordinates = 0;
  let recordsWithoutImages = 0;
  const categories = { mural: 0, graffiti: 0, sculpture: 0 };

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    try {
      const title = extractTitle(pm);
      const coordinates = extractCoordinates(pm);

      if (!coordinates) {
        recordsMissingCoordinates++;
        continue;
      }

      const imagePath = extractFirstImage(pm);
      if (!imagePath) recordsWithoutImages++;

      const description = extractDescription(pm);
      const author = extractAuthor(description);
      const category = categorize(description);
      categories[category]++;

      markers.push({
        title: title || 'Sin título',
        category,
        description,
        author,
        imagePath: imagePath || null,
        coordinates
      });
    } catch (err) {
      warnings.push(`Error procesando Placemark #${i + 1}: ${err.message}`);
    }
  }

  // Detectar duplicados por coordenadas idénticas
  const coordSet = new Set();
  let duplicatesDetected = 0;
  for (const m of markers) {
    const key = `${m.coordinates[0]},${m.coordinates[1]}`;
    if (coordSet.has(key)) {
      duplicatesDetected++;
    } else {
      coordSet.add(key);
    }
  }

  // ─── Generar seed-markers.js ────────────────────────────────────────────
  console.log('💾 Generando seed-markers.js...');

  const markersCode = markers.map(m => {
    const title = m.title.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const desc = m.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const author = m.author.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const imgLine = m.imagePath
      ? `    imagePath: "${m.imagePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}",`
      : '    imagePath: null,';

    return `  {
    title: "${title}",
    category: "${m.category}",
    description: "${desc}",
    author: "${author}",
    ${imgLine}
    location: { type: "Point", coordinates: [${m.coordinates[0]}, ${m.coordinates[1]}] },
    owner: new mongoose.Types.ObjectId("65a1b2c3d4e5f67890123456")
  }`;
  }).join(',\n');

  const seedFile = `'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const Marker = require('./src/models/Marker');

const markers = [
${markersCode}
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    const result = await Marker.insertMany(markers);
    console.log(\`Inserted \${result.length} markers successfully\`);
    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
`;

  fs.writeFileSync(SEED_OUTPUT_PATH, seedFile, 'utf-8');

  // ─── Generar reporte ───────────────────────────────────────────────────
  console.log('📊 Generando reporte...');

  const report = {
    totalRecords: placemarks.length,
    titlesPreserved: markers.length,
    categoriesNormalized: categories,
    recordsMissingCoordinates,
    recordsWithoutImages,
    duplicatesDetected,
    warnings,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // ─── Resumen ──────────────────────────────────────────────────────────
  console.log('\n✅ Pipeline completado:');
  console.log(`   • Total registros: ${report.totalRecords}`);
  console.log(`   • Markers generados: ${markers.length}`);
  console.log(`   • Categorías: mural=${categories.mural}, graffiti=${categories.graffiti}, sculpture=${categories.sculpture}`);
  console.log(`   • Sin coordenadas (omitidos): ${recordsMissingCoordinates}`);
  console.log(`   • Sin imágenes: ${recordsWithoutImages}`);
  console.log(`   • Duplicados detectados: ${duplicatesDetected}`);
  if (warnings.length > 0) {
    console.log(`   • Warnings: ${warnings.length}`);
  }
  console.log(`   • Archivos generados:`);
  console.log(`     - ${SEED_OUTPUT_PATH}`);
  console.log(`     - ${REPORT_OUTPUT_PATH}`);
}

main();
