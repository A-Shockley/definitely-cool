import { useState } from 'react';
import { getSpeciesByCategory } from '../data/plantDatabase';
import CareCard from './CareCard';
import './PlantLibrary.css';

// Browsable reference of every species in the built-in care database.
function PlantLibrary({ onAddSpecies }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const groups = getSpeciesByCategory()
    .map(({ category, species }) => ({
      category,
      species: species.filter((s) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          s.commonName.toLowerCase().includes(q) ||
          s.botanicalName.toLowerCase().includes(q) ||
          s.varieties.some((v) => v.toLowerCase().includes(q))
        );
      }),
    }))
    .filter((g) => g.species.length > 0);

  return (
    <div className="plant-library">
      <div className="library-intro">
        <h2>📚 Plant Library</h2>
        <p>
          Care guides for 30 popular houseplants. Tap a plant to see its care
          card, or add it straight to your collection.
        </p>
        <input
          type="text"
          className="library-search"
          placeholder="🔍 Search the library..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {groups.length === 0 && (
        <div className="library-empty">No plants match your search.</div>
      )}

      {groups.map(({ category, species }) => (
        <section key={category} className="library-category">
          <h3>{category}</h3>
          <div className="library-grid">
            {species.map((s) => (
              <div key={s.id} className="library-item">
                <button
                  className="library-item-header"
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                >
                  <span className="library-item-name">
                    <strong>{s.commonName}</strong>
                    <em>{s.botanicalName}</em>
                    {s.varieties.length > 0 && (
                      <small>Varieties: {s.varieties.join(', ')}</small>
                    )}
                  </span>
                  <span className="library-item-badges">
                    {!s.toxic && <span className="mini-badge safe">Pet-safe</span>}
                    <span className={`mini-badge diff-${s.difficulty.toLowerCase()}`}>
                      {s.difficulty}
                    </span>
                    <span className="expand-arrow">
                      {expandedId === s.id ? '▲' : '▼'}
                    </span>
                  </span>
                </button>
                {expandedId === s.id && (
                  <div className="library-item-body">
                    <CareCard species={s} />
                    <button
                      className="btn-add-from-library"
                      onClick={() => onAddSpecies(s)}
                    >
                      + Add to My Plants
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default PlantLibrary;
