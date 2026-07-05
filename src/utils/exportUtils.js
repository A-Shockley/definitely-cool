// Backup, export, and printable Plant Binder generation.
// Everything runs in the browser — no server involved.

import { getPlants, replaceAllPlants, getEffectiveFrequency } from './plantStorage';
import { getPhotosForPlant } from './photoStorage';
import { getSpecies } from '../data/plantDatabase';

const LAST_BACKUP_KEY = 'plant-tracker-last-backup';
const REMINDER_DISMISSED_KEY = 'plant-tracker-backup-reminder-dismissed';
const FIRST_USE_KEY = 'plant-tracker-first-use';
const DAY_MS = 24 * 60 * 60 * 1000;

const todayStamp = () => new Date().toISOString().slice(0, 10);

const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// ── JSON backup ──────────────────────────────────────────────────────

export const exportBackup = () => {
  const payload = {
    app: 'plant-watering-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    plants: getPlants(),
  };
  downloadBlob(
    `plant-tracker-backup-${todayStamp()}.json`,
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  );
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
};

// Restore a backup file. Replaces the current plant list; throws with a
// friendly message if the file isn't a valid backup.
export const importBackup = async (file) => {
  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('That file is not a valid backup (could not read it as JSON).');
  }
  const plants = Array.isArray(payload) ? payload : payload.plants;
  if (!Array.isArray(plants) || plants.some((p) => !p || typeof p.name !== 'string')) {
    throw new Error('That file does not look like a Plant Tracker backup.');
  }
  replaceAllPlants(plants);
  return plants.length;
};

// ── CSV export ───────────────────────────────────────────────────────

const csvField = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const exportCSV = () => {
  const plants = getPlants();
  const header = [
    'Name', 'Species', 'Room', 'Water every (summer, days)',
    'Water every (winter, days)', 'Light', 'Soil', 'Notes',
    'Last watered', 'Times watered', 'Watering history',
  ];
  const rows = plants.map((p) => [
    p.name,
    p.species,
    p.location,
    p.wateringFrequencySummer || p.wateringFrequency,
    p.wateringFrequencyWinter,
    p.lightRequirement,
    p.soilType,
    p.notes,
    p.lastWatered ? new Date(p.lastWatered).toLocaleDateString() : 'Never',
    (p.wateringHistory || []).length,
    (p.wateringHistory || [])
      .map((d) => new Date(d).toLocaleDateString())
      .join('; '),
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
  downloadBlob(
    `plant-tracker-${todayStamp()}.csv`,
    new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  );
};

// ── Printable Plant Binder ───────────────────────────────────────────

const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const escapeHtml = (text) =>
  String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const binderPlantHtml = (plant, coverDataURL) => {
  const species = plant.speciesId ? getSpecies(plant.speciesId) : null;
  const frequency = getEffectiveFrequency(plant);
  const history = (plant.wateringHistory || []).slice(-12).reverse();

  const facts = [
    ['Species', plant.species],
    ['Room', plant.location],
    [
      'Watering',
      plant.wateringFrequencySummer
        ? `Every ${plant.wateringFrequencySummer} days (summer) / ${
            plant.wateringFrequencyWinter || plant.wateringFrequencySummer
          } days (winter)`
        : frequency
          ? `Every ${frequency} days`
          : '',
    ],
    ['Light', plant.lightRequirement || species?.light],
    ['Humidity', species?.humidity],
    ['Soil', plant.soilType || species?.soil],
    ['Pets', species ? (species.toxic ? '⚠️ Toxic to pets' : '✅ Pet-safe') : ''],
    ['Last watered', plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString() : 'Never'],
  ].filter(([, value]) => value);

  return `
    <article class="plant">
      <div class="plant-body">
        ${coverDataURL ? `<img class="cover" src="${coverDataURL}" alt="" />` : ''}
        <div class="plant-text">
          <h2>${escapeHtml(plant.name)}</h2>
          <table>
            ${facts
              .map(
                ([label, value]) =>
                  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
              )
              .join('')}
          </table>
          ${species?.tips ? `<p class="tip">💡 ${escapeHtml(species.tips)}</p>` : ''}
          ${plant.notes ? `<p class="notes"><strong>Notes:</strong> ${escapeHtml(plant.notes)}</p>` : ''}
          ${
            history.length > 0
              ? `<p class="history"><strong>Recent waterings:</strong> ${history
                  .map((d) => new Date(d).toLocaleDateString())
                  .join(', ')}</p>`
              : ''
          }
        </div>
      </div>
    </article>`;
};

// Opens a new tab with a print-ready document of every plant, grouped by
// room. Use the browser's Print → "Save as PDF" to keep a copy.
export const openPlantBinder = async () => {
  // The window must open synchronously in the click handler, before any
  // awaits, or pop-up blockers will stop it.
  const win = window.open('', '_blank');
  if (!win) {
    throw new Error('Your browser blocked the new tab. Please allow pop-ups and try again.');
  }
  win.document.write(
    '<p style="font-family: sans-serif; padding: 30px;">Preparing your Plant Binder…</p>'
  );

  const plants = [...getPlants()].sort((a, b) =>
    `${a.location || 'zz'} ${a.name}`.localeCompare(`${b.location || 'zz'} ${b.name}`)
  );

  // Use each plant's most recent photo as its picture.
  const covers = {};
  for (const plant of plants) {
    try {
      const photos = await getPhotosForPlant(plant.id);
      if (photos.length > 0) {
        covers[plant.id] = await blobToDataURL(photos[photos.length - 1].blob);
      }
    } catch {
      // A plant without a readable photo still gets its page.
    }
  }

  const rooms = [...new Set(plants.map((p) => p.location || 'No room set'))];
  const sections = rooms
    .map((room) => {
      const roomPlants = plants.filter((p) => (p.location || 'No room set') === room);
      return `
        <section>
          <h1 class="room">📍 ${escapeHtml(room)}</h1>
          ${roomPlants.map((p) => binderPlantHtml(p, covers[p.id])).join('')}
        </section>`;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>My Plant Binder</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a202c; margin: 40px; }
  header.binder { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2f855a; padding-bottom: 15px; }
  header.binder h1 { color: #22543d; margin: 0 0 6px; }
  header.binder p { color: #718096; margin: 0; }
  h1.room { color: #22543d; font-size: 1.3rem; border-bottom: 1px solid #c6f6d5; padding-bottom: 4px; margin: 30px 0 10px; }
  article.plant { border: 1px solid #cbd5e0; border-radius: 8px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
  .plant-body { display: flex; gap: 16px; }
  img.cover { width: 170px; height: 170px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
  .plant-text { flex: 1; }
  article.plant h2 { margin: 0 0 8px; color: #2d3748; }
  table { border-collapse: collapse; font-size: 0.9rem; }
  th { text-align: left; color: #2f855a; padding: 2px 14px 2px 0; vertical-align: top; white-space: nowrap; }
  td { padding: 2px 0; }
  p.tip, p.notes, p.history { font-size: 0.85rem; color: #4a5568; margin: 8px 0 0; }
  .print-hint { background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 25px; font-family: sans-serif; }
  @media print { .print-hint { display: none; } body { margin: 10px; } }
</style>
</head>
<body>
  <div class="print-hint">
    🖨️ Press <strong>Ctrl+P</strong> (or Cmd+P) and choose <strong>"Save as PDF"</strong> to keep this document.
  </div>
  <header class="binder">
    <h1>🌱 My Plant Binder</h1>
    <p>${plants.length} plants • Generated ${new Date().toLocaleDateString()}</p>
  </header>
  ${sections}
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
};

// ── Backup reminder ──────────────────────────────────────────────────

// True when the user has plants but hasn't backed up (or been asked)
// for 30+ days.
export const shouldRemindBackup = (plantCount) => {
  if (!plantCount) return false;
  let firstUse = localStorage.getItem(FIRST_USE_KEY);
  if (!firstUse) {
    firstUse = new Date().toISOString();
    localStorage.setItem(FIRST_USE_KEY, firstUse);
  }
  const reference = localStorage.getItem(LAST_BACKUP_KEY) || firstUse;
  if (Date.now() - new Date(reference).getTime() < 30 * DAY_MS) return false;
  const dismissed = localStorage.getItem(REMINDER_DISMISSED_KEY);
  if (dismissed && Date.now() - new Date(dismissed).getTime() < 30 * DAY_MS) return false;
  return true;
};

export const dismissBackupReminder = () => {
  localStorage.setItem(REMINDER_DISMISSED_KEY, new Date().toISOString());
};

export const getLastBackupDate = () => {
  const value = localStorage.getItem(LAST_BACKUP_KEY);
  return value ? new Date(value) : null;
};
