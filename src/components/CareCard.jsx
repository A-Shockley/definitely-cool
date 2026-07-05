import './CareCard.css';

// Displays the built-in care profile for a species from the plant database.
function CareCard({ species }) {
  if (!species) return null;

  return (
    <div className="care-card">
      <div className="care-card-header">
        <span className="care-card-title">🪴 Care Guide</span>
        <span className={`toxicity-badge ${species.toxic ? 'toxic' : 'safe'}`}>
          {species.toxic ? '⚠️ Toxic to pets' : '✅ Pet-safe'}
        </span>
      </div>

      <div className="care-card-name">
        <strong>{species.commonName}</strong>
        <em>{species.botanicalName}</em>
      </div>

      <div className="care-facts">
        <div className="care-fact">
          <span className="care-fact-label">💧 Water</span>
          <span>
            Every ~{species.waterSummer} days (summer) / ~{species.waterWinter} days (winter)
          </span>
        </div>
        <div className="care-fact">
          <span className="care-fact-label">☀️ Light</span>
          <span>{species.light}</span>
        </div>
        <div className="care-fact">
          <span className="care-fact-label">💨 Humidity</span>
          <span>{species.humidity}</span>
        </div>
        <div className="care-fact">
          <span className="care-fact-label">🪨 Soil</span>
          <span>{species.soil}</span>
        </div>
        <div className="care-fact">
          <span className="care-fact-label">📊 Difficulty</span>
          <span>{species.difficulty}</span>
        </div>
      </div>

      {species.tips && (
        <div className="care-tips">
          <strong>💡 Tip:</strong> {species.tips}
        </div>
      )}
    </div>
  );
}

export default CareCard;
