// Photo storage backed by IndexedDB.
// Photos are far too large for localStorage (~5 MB total cap), so plant
// records stay in localStorage while photo blobs live here — IndexedDB
// comfortably holds hundreds of compressed photos.

const DB_NAME = 'plant-tracker-photos';
const DB_VERSION = 1;
const STORE = 'photos';

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('plantId', 'plantId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

// Downscale to at most MAX_DIMENSION px and re-encode as JPEG so a phone
// camera photo (often 5-10 MB) stores at a few hundred KB.
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))),
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that file as an image'));
    };
    img.src = url;
  });

// Save a photo for a plant. Returns the stored record.
export const addPhoto = async (plantId, file) => {
  const blob = await compressImage(file);
  const photo = {
    id: `${plantId}-${Date.now()}`,
    plantId,
    takenAt: new Date().toISOString(),
    blob,
  };
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return photo;
};

// All photos for one plant, oldest first.
export const getPhotosForPlant = async (plantId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db
      .transaction(STORE)
      .objectStore(STORE)
      .index('plantId')
      .getAll(plantId);
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => a.takenAt.localeCompare(b.takenAt)));
    request.onerror = () => reject(request.error);
  });
};

export const deletePhoto = async (id) => {
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

// Remove all photos belonging to a plant (used when the plant is deleted).
export const deletePhotosForPlant = async (plantId) => {
  const photos = await getPhotosForPlant(plantId);
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    photos.forEach((p) => store.delete(p.id));
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};
