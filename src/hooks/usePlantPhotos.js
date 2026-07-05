import { useState, useEffect, useCallback } from 'react';
import {
  addPhoto,
  getPhotosForPlant,
  deletePhoto,
} from '../utils/photoStorage';

// Loads a plant's photos from IndexedDB and exposes add/remove actions.
// Blobs are turned into object URLs for <img> tags and revoked on cleanup.
export function usePlantPhotos(plantId) {
  const [photos, setPhotos] = useState([]); // [{ id, takenAt, url }]
  const [version, setVersion] = useState(0); // bump to reload after add/remove

  useEffect(() => {
    let cancelled = false;
    let urls = [];
    getPhotosForPlant(plantId)
      .then((records) => {
        if (cancelled) return;
        urls = records.map((r) => URL.createObjectURL(r.blob));
        setPhotos(
          records.map((r, i) => ({ id: r.id, takenAt: r.takenAt, url: urls[i] }))
        );
      })
      .catch((error) => console.error('Could not load photos:', error));
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [plantId, version]);

  const add = useCallback(
    async (file) => {
      await addPhoto(plantId, file);
      setVersion((v) => v + 1);
    },
    [plantId]
  );

  const remove = useCallback(async (id) => {
    await deletePhoto(id);
    setVersion((v) => v + 1);
  }, []);

  return { photos, add, remove };
}
