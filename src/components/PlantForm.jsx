import { useState } from 'react';
import { PLANT_DATABASE, getSpecies, getSpeciesByCategory } from '../data/plantDatabase';
import { ROOMS } from '../data/rooms';
import './PlantForm.css';

// Sentinel value for the "Other…" room option.
const OTHER_ROOM = '__other__';

const emptyForm = {
  speciesId: '',
  name: '',
  species: '',
  location: '',
  wateringFrequencySummer: '',
  wateringFrequencyWinter: '',
  lightRequirement: '',
  soilType: '',
  notes: '',
};

// Build form values from a species profile in the built-in database.
const formFromSpecies = (species, base) => ({
  ...base,
  speciesId: species.id,
  name: base.name || species.commonName,
  species: species.botanicalName,
  wateringFrequencySummer: species.waterSummer,
  wateringFrequencyWinter: species.waterWinter,
  lightRequirement: species.light,
  soilType: species.soil,
});

function PlantForm({ plant, initialSpecies, onSave, onCancel }) {
  // The form is mounted fresh each time it opens, so we can initialize
  // state once from whichever starting point applies.
  const [formData, setFormData] = useState(() => {
    if (plant) {
      return {
        speciesId: plant.speciesId || '',
        name: plant.name || '',
        species: plant.species || '',
        location: plant.location || '',
        // Older plants only have wateringFrequency — show it in the summer field
        wateringFrequencySummer:
          plant.wateringFrequencySummer || plant.wateringFrequency || '',
        wateringFrequencyWinter: plant.wateringFrequencyWinter || '',
        lightRequirement: plant.lightRequirement || '',
        soilType: plant.soilType || '',
        notes: plant.notes || '',
      };
    }
    if (initialSpecies) {
      return formFromSpecies(initialSpecies, emptyForm);
    }
    return emptyForm;
  });

  // Track whether the location is a custom (typed) room rather than one
  // from the ROOMS list — e.g. a plant saved before rooms existed.
  const [customRoom, setCustomRoom] = useState(
    () => Boolean(plant?.location) && !ROOMS.includes(plant.location)
  );

  const handleRoomChange = (e) => {
    const value = e.target.value;
    if (value === OTHER_ROOM) {
      setCustomRoom(true);
      setFormData((prev) => ({ ...prev, location: '' }));
    } else {
      setCustomRoom(false);
      setFormData((prev) => ({ ...prev, location: value }));
    }
  };

  const handleSpeciesChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setFormData((prev) => ({ ...prev, speciesId: '' }));
      return;
    }
    const species = getSpecies(id);
    if (species) {
      setFormData((prev) => formFromSpecies(species, prev));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a plant name');
      return;
    }

    const summer = formData.wateringFrequencySummer
      ? parseInt(formData.wateringFrequencySummer)
      : null;
    const winter = formData.wateringFrequencyWinter
      ? parseInt(formData.wateringFrequencyWinter)
      : null;

    const plantData = {
      ...formData,
      wateringFrequencySummer: summer,
      wateringFrequencyWinter: winter,
      // Keep the original single-frequency field in sync for compatibility
      wateringFrequency: summer,
    };

    onSave(plantData);
  };

  const selectedSpecies = formData.speciesId ? getSpecies(formData.speciesId) : null;

  return (
    <div className="plant-form-overlay">
      <div className="plant-form-container">
        <h2>{plant ? 'Edit Plant' : 'Add New Plant'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group species-picker">
            <label htmlFor="speciesId">Plant Type</label>
            <select
              id="speciesId"
              name="speciesId"
              value={formData.speciesId}
              onChange={handleSpeciesChange}
            >
              <option value="">Custom / not listed</option>
              {getSpeciesByCategory().map(({ category, species }) => (
                <optgroup key={category} label={category}>
                  {species.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.commonName} ({s.botanicalName})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <small>
              {selectedSpecies
                ? '✓ Care details filled in below — adjust anything you like.'
                : `Pick from ${PLANT_DATABASE.length} common houseplants to auto-fill care details.`}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="name">Plant Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., My Fiddle Leaf Fig"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="species">Species</label>
            <input
              type="text"
              id="species"
              name="species"
              value={formData.species}
              onChange={handleChange}
              placeholder="e.g., Ficus lyrata"
            />
          </div>

          <div className="form-group">
            <label htmlFor="room">Room</label>
            <select
              id="room"
              value={customRoom ? OTHER_ROOM : formData.location}
              onChange={handleRoomChange}
            >
              <option value="">Choose a room...</option>
              {ROOMS.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
              <option value={OTHER_ROOM}>Other...</option>
            </select>
            {customRoom && (
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Type a location, e.g., Front porch"
              />
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="wateringFrequencySummer">Watering (summer)</label>
              <input
                type="number"
                id="wateringFrequencySummer"
                name="wateringFrequencySummer"
                value={formData.wateringFrequencySummer}
                onChange={handleChange}
                placeholder="e.g., 7"
                min="1"
              />
              <small>Days between waterings</small>
            </div>

            <div className="form-group">
              <label htmlFor="wateringFrequencyWinter">Watering (winter)</label>
              <input
                type="number"
                id="wateringFrequencyWinter"
                name="wateringFrequencyWinter"
                value={formData.wateringFrequencyWinter}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="1"
              />
              <small>Optional — Nov to Feb</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="lightRequirement">Light Requirement</label>
            <input
              type="text"
              id="lightRequirement"
              name="lightRequirement"
              value={formData.lightRequirement}
              onChange={handleChange}
              placeholder="e.g., Bright indirect"
              list="light-options"
            />
            <datalist id="light-options">
              <option value="Direct sun" />
              <option value="Bright indirect" />
              <option value="Medium to bright indirect" />
              <option value="Low to medium" />
              <option value="Low light" />
            </datalist>
          </div>

          <div className="form-group">
            <label htmlFor="soilType">Soil Type</label>
            <input
              type="text"
              id="soilType"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              placeholder="e.g., Well-draining potting mix"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional care instructions or observations..."
              rows="4"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {plant ? 'Update Plant' : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlantForm;
