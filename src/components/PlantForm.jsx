import { useState, useEffect } from 'react';
import './PlantForm.css';

function PlantForm({ plant, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    location: '',
    wateringFrequency: '',
    lightRequirement: '',
    soilType: '',
    notes: '',
  });

  useEffect(() => {
    if (plant) {
      setFormData({
        name: plant.name || '',
        species: plant.species || '',
        location: plant.location || '',
        wateringFrequency: plant.wateringFrequency || '',
        lightRequirement: plant.lightRequirement || '',
        soilType: plant.soilType || '',
        notes: plant.notes || '',
      });
    }
  }, [plant]);

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

    const plantData = {
      ...formData,
      wateringFrequency: formData.wateringFrequency ? parseInt(formData.wateringFrequency) : null,
    };

    onSave(plantData);
  };

  return (
    <div className="plant-form-overlay">
      <div className="plant-form-container">
        <h2>{plant ? 'Edit Plant' : 'Add New Plant'}</h2>
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Living room, Window sill"
            />
          </div>

          <div className="form-group">
            <label htmlFor="wateringFrequency">Watering Frequency (days)</label>
            <input
              type="number"
              id="wateringFrequency"
              name="wateringFrequency"
              value={formData.wateringFrequency}
              onChange={handleChange}
              placeholder="e.g., 7"
              min="1"
            />
            <small>How many days between waterings?</small>
          </div>

          <div className="form-group">
            <label htmlFor="lightRequirement">Light Requirement</label>
            <select
              id="lightRequirement"
              name="lightRequirement"
              value={formData.lightRequirement}
              onChange={handleChange}
            >
              <option value="">Select...</option>
              <option value="Full sun">Full sun (6+ hours direct)</option>
              <option value="Partial sun">Partial sun (3-6 hours)</option>
              <option value="Bright indirect">Bright indirect</option>
              <option value="Low light">Low light</option>
              <option value="Shade">Shade</option>
            </select>
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
