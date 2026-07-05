// Utility functions for managing plant data in localStorage

const STORAGE_KEY = 'plant-tracker-data';

// Get all plants from localStorage
export const getPlants = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading plants from storage:', error);
    return [];
  }
};

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

// Water a plant (update lastWatered timestamp)
export const waterPlant = (id) => {
  return updatePlant(id, {
    lastWatered: new Date().toISOString()
  });
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

  const nextWatering = startOfDay(plant.lastWatered);
  nextWatering.setDate(nextWatering.getDate() + frequency);

  return Math.round((nextWatering - startOfDay(new Date())) / (1000 * 60 * 60 * 24));
};

// Check if plant needs watering
export const needsWatering = (plant) => {
  const daysUntil = getDaysUntilNextWatering(plant);
  return daysUntil !== null && daysUntil <= 0;
};
