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

// Calculate days until next watering
export const getDaysUntilNextWatering = (plant) => {
  if (!plant.lastWatered || !plant.wateringFrequency) {
    return null;
  }

  const lastWatered = new Date(plant.lastWatered);
  const nextWatering = new Date(lastWatered);
  nextWatering.setDate(nextWatering.getDate() + plant.wateringFrequency);

  const today = new Date();
  const diffTime = nextWatering - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

// Check if plant needs watering
export const needsWatering = (plant) => {
  const daysUntil = getDaysUntilNextWatering(plant);
  return daysUntil !== null && daysUntil <= 0;
};
