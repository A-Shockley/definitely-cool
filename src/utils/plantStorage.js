// Utility functions for managing plant data in localStorage

const STORAGE_KEY = 'plant-tracker-data';

// Get all plants from localStorage
export const getPlants = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const plants = data ? JSON.parse(data) : [];
    // One-time migration: plants saved before watering history existed
    // only have lastWatered — seed their history from it.
    let migrated = false;
    plants.forEach((plant) => {
      if (!Array.isArray(plant.wateringHistory)) {
        plant.wateringHistory = plant.lastWatered ? [plant.lastWatered] : [];
        migrated = true;
      }
    });
    if (migrated) savePlants(plants);
    return plants;
  } catch (error) {
    console.error('Error reading plants from storage:', error);
    return [];
  }
};

// Replace the entire collection (used by backup import).
export const replaceAllPlants = (plants) => savePlants(plants);

// Save plants to localStorage
export const savePlants = (plants) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
    return true;
  } catch (error) {
    console.error('Error saving plants to storage:', error);
    return false;
  }
};

// Add a new plant
export const addPlant = (plant) => {
  const plants = getPlants();
  const newPlant = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    lastWatered: null,
    ...plant,
  };
  plants.push(newPlant);
  savePlants(plants);
  return newPlant;
};

// Update an existing plant
export const updatePlant = (id, updates) => {
  const plants = getPlants();
  const index = plants.findIndex(p => p.id === id);
  if (index !== -1) {
    plants[index] = { ...plants[index], ...updates };
    savePlants(plants);
    return plants[index];
  }
  return null;
};

// Delete a plant
export const deletePlant = (id) => {
  const plants = getPlants();
  const filtered = plants.filter(p => p.id !== id);
  savePlants(filtered);
  return filtered;
};

// Log a watering. Pass a date to record a past ("watered late") event;
// defaults to now. Every watering is appended to the plant's history.
export const waterPlant = (id, dateISO = new Date().toISOString()) => {
  const plants = getPlants();
  const plant = plants.find((p) => p.id === id);
  if (!plant) return null;
  plant.wateringHistory = [...(plant.wateringHistory || []), dateISO].sort();
  plant.lastWatered = plant.wateringHistory[plant.wateringHistory.length - 1];
  plant.snoozedUntil = null; // watering clears any snooze
  savePlants(plants);
  return plant;
};

// Remove one history entry (undo a mistaken log).
export const removeWateringEntry = (id, dateISO) => {
  const plants = getPlants();
  const plant = plants.find((p) => p.id === id);
  if (!plant) return null;
  plant.wateringHistory = (plant.wateringHistory || []).filter((d) => d !== dateISO);
  plant.lastWatered =
    plant.wateringHistory.length > 0
      ? plant.wateringHistory[plant.wateringHistory.length - 1]
      : null;
  savePlants(plants);
  return plant;
};

// Push this plant's next watering out a couple of days ("soil is still
// damp, ask me again later").
export const snoozePlant = (id, days = 2) => {
  const until = new Date();
  until.setDate(until.getDate() + days);
  return updatePlant(id, { snoozedUntil: until.toISOString() });
};

// Winter months (Northern Hemisphere): November through February.
// Most houseplants slow down and need less water in these months.
const isWinter = () => {
  const month = new Date().getMonth(); // 0 = January
  return month === 10 || month === 11 || month === 0 || month === 1;
};

// The watering interval that applies right now for this plant.
// Plants with seasonal intervals switch automatically; plants with only a
// single wateringFrequency (older records or custom plants) use that.
export const getEffectiveFrequency = (plant) => {
  if (plant.wateringFrequencySummer && plant.wateringFrequencyWinter) {
    return isWinter() ? plant.wateringFrequencyWinter : plant.wateringFrequencySummer;
  }
  return plant.wateringFrequency || plant.wateringFrequencySummer || null;
};

// Normalize a date to midnight so day math ignores the time of day.
const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Calculate days until next watering
export const getDaysUntilNextWatering = (plant) => {
  const frequency = getEffectiveFrequency(plant);
  if (!plant.lastWatered || !frequency) {
    return null;
  }

  let nextWatering = startOfDay(plant.lastWatered);
  nextWatering.setDate(nextWatering.getDate() + frequency);

  // A snooze pushes the next watering out if it lands later.
  if (plant.snoozedUntil) {
    const snooze = startOfDay(plant.snoozedUntil);
    if (snooze > nextWatering) nextWatering = snooze;
  }

  return Math.round((nextWatering - startOfDay(new Date())) / (1000 * 60 * 60 * 24));
};

// Check if plant needs watering
export const needsWatering = (plant) => {
  const daysUntil = getDaysUntilNextWatering(plant);
  return daysUntil !== null && daysUntil <= 0;
};
