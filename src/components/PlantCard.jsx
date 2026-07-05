import { useState } from 'react';
import {
  getDaysUntilNextWatering,
  getEffectiveFrequency,
  needsWatering,
} from '../utils/plantStorage';
import { getSpecies } from '../data/plantDatabase';
import CareCard from './CareCard';
import './PlantCard.css';

function PlantCard({ plant, onWater, onEdit, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);

  const daysUntil = getDaysUntilNextWatering(plant);
  const isThirsty = needsWatering(plant);
  const frequency = getEffectiveFrequency(plant);
  const species = plant.speciesId ? getSpecies(plant.speciesId) : null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getWateringStatus = () => {
    if (daysUntil === null) return { text: 'Not scheduled', class: 'no-schedule' };
    if (daysUntil < 0) return { text: `Overdue by ${Math.abs(daysUntil)} days!`, class: 'overdue' };
    if (daysUntil === 0) return { text: 'Water today!', class: 'today' };
    if (daysUntil === 1) return { text: 'Water tomorrow', class: 'soon' };
    return { text: `Water in ${daysUntil} days`, class: 'upcoming' };
  };

  const status = getWateringStatus();

  return (
    <div className={`plant-card ${isThirsty ? 'needs-water' : ''}`}>
      <div className="plant-card-header">
        <div className="plant-info">
          <h3>{plant.name}</h3>
          {plant.species && <p className="species">{plant.species}</p>}
          {plant.location && <p className="location">📍 {plant.location}</p>}
        </div>
        <div className="plant-actions">
          <button
            className="btn-water"
            onClick={() => onWater(plant.id)}
            title="Water this plant"
          >
            💧 Water
          </button>
        </div>
      </div>

      <div className={`watering-status ${status.class}`}>
        {status.text}
      </div>

      <div className="plant-meta">
        <span>Last watered: {formatDate(plant.lastWatered)}</span>
        {frequency && (
          <span>Every {frequency} days</span>
        )}
      </div>

      <button
        className="btn-toggle-details"
        onClick={() => setShowDetails(!showDetails)}
      >
        {showDetails ? '▲ Hide Details' : '▼ Show Details'}
      </button>

      {showDetails && (
        <div className="plant-details">
          {species && <CareCard species={species} />}
          {plant.notes && (
            <div className="detail-section">
              <strong>Notes:</strong>
              <p>{plant.notes}</p>
            </div>
          )}
          {!species && plant.lightRequirement && (
            <div className="detail-section">
              <strong>Light:</strong> {plant.lightRequirement}
            </div>
          )}
          {!species && plant.soilType && (
            <div className="detail-section">
              <strong>Soil:</strong> {plant.soilType}
            </div>
          )}
          <div className="detail-actions">
            <button className="btn-edit" onClick={() => onEdit(plant)}>
              ✏️ Edit
            </button>
            <button className="btn-delete" onClick={() => onDelete(plant.id)}>
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlantCard;
