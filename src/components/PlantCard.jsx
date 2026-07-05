import { useState } from 'react';
import {
  getDaysUntilNextWatering,
  getEffectiveFrequency,
  needsWatering,
} from '../utils/plantStorage';
import { getSpecies } from '../data/plantDatabase';
import { usePlantPhotos } from '../hooks/usePlantPhotos';
import CareCard from './CareCard';
import './PlantCard.css';

function PlantCard({ plant, onWater, onWaterOn, onSnooze, onRemoveWatering, onEdit, onDelete }) {
  const [showDetails, setShowDetails] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [pastDate, setPastDate] = useState('');

  const { photos, add: addPhoto, remove: removePhoto } = usePlantPhotos(plant.id);
  // Most recent photo doubles as the card's cover image
  const cover = photos.length > 0 ? photos[photos.length - 1] : null;

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

  const handlePhotoChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setSavingPhoto(true);
    try {
      await addPhoto(file);
    } catch (error) {
      console.error(error);
      alert('Sorry, that photo could not be saved. Try a different image.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleDeletePhoto = (id) => {
    if (window.confirm('Delete this photo?')) {
      removePhoto(id);
    }
  };

  const handleLogPastWatering = () => {
    if (!pastDate) return;
    // Anchor the chosen day at local noon so timezones can't shift it.
    const [year, month, day] = pastDate.split('-').map(Number);
    onWaterOn(plant.id, new Date(year, month - 1, day, 12).toISOString());
    setPastDate('');
  };

  // Watering history, most recent first
  const history = [...(plant.wateringHistory || [])].reverse();

  return (
    <div className={`plant-card ${isThirsty ? 'needs-water' : ''}`}>
      {cover && (
        <img className="plant-cover" src={cover.url} alt={plant.name} />
      )}

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
          {isThirsty && (
            <button
              className="btn-snooze"
              onClick={() => onSnooze(plant.id)}
              title="Soil still damp? Push the reminder out 2 days"
            >
              😴 +2d
            </button>
          )}
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
          <div className="photo-section">
            <div className="photo-section-header">
              <strong>📷 Photos</strong>
              <label className={`btn-add-photo ${savingPhoto ? 'disabled' : ''}`}>
                {savingPhoto ? 'Saving…' : '+ Add Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={savingPhoto}
                  hidden
                />
              </label>
            </div>
            {photos.length > 0 ? (
              <div className="photo-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="photo-thumb">
                    <img src={photo.url} alt={`${plant.name} on ${formatDate(photo.takenAt)}`} />
                    <button
                      className="photo-delete"
                      onClick={() => handleDeletePhoto(photo.id)}
                      title="Delete photo"
                    >
                      ✕
                    </button>
                    <span className="photo-date">{formatDate(photo.takenAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="photo-empty">
                No photos yet — add one to see this plant at a glance and track
                its growth over time.
              </p>
            )}
          </div>

          <div className="history-section">
            <strong>💧 Watering History ({history.length})</strong>
            {history.length > 0 ? (
              <ul className="history-list">
                {history.slice(0, 6).map((date) => (
                  <li key={date}>
                    <span>{formatDate(date)}</span>
                    <button
                      className="history-remove"
                      onClick={() => onRemoveWatering(plant.id, date)}
                      title="Remove this entry (logged by mistake)"
                    >
                      ✕
                    </button>
                  </li>
                ))}
                {history.length > 6 && (
                  <li className="history-more">…and {history.length - 6} more</li>
                )}
              </ul>
            ) : (
              <p className="history-empty">No waterings logged yet.</p>
            )}
            <div className="history-log-past">
              <input
                type="date"
                value={pastDate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setPastDate(e.target.value)}
                title="Forgot to log a watering? Pick the day it happened"
              />
              <button
                onClick={handleLogPastWatering}
                disabled={!pastDate}
              >
                Log past watering
              </button>
            </div>
          </div>

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
