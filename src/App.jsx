import { useState, useEffect } from 'react';
import PlantCard from './components/PlantCard';
import PlantForm from './components/PlantForm';
import {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  waterPlant,
  needsWatering
} from './utils/plantStorage';
import './App.css';

function App() {
  const [plants, setPlants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [filterView, setFilterView] = useState('all'); // all, needs-water, upcoming
  const [searchTerm, setSearchTerm] = useState('');

  // Load plants on mount
  useEffect(() => {
    setPlants(getPlants());
  }, []);

  const handleAddPlant = () => {
    setEditingPlant(null);
    setShowForm(true);
  };

  const handleEditPlant = (plant) => {
    setEditingPlant(plant);
    setShowForm(true);
  };

  const handleSavePlant = (plantData) => {
    if (editingPlant) {
      updatePlant(editingPlant.id, plantData);
    } else {
      addPlant(plantData);
    }
    setPlants(getPlants());
    setShowForm(false);
    setEditingPlant(null);
  };

  const handleDeletePlant = (id) => {
    if (window.confirm('Are you sure you want to delete this plant?')) {
      deletePlant(id);
      setPlants(getPlants());
    }
  };

  const handleWaterPlant = (id) => {
    waterPlant(id);
    setPlants(getPlants());
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlant(null);
  };

  // Filter plants based on view and search
  const filteredPlants = plants.filter(plant => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        plant.name.toLowerCase().includes(search) ||
        plant.species?.toLowerCase().includes(search) ||
        plant.location?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // View filter
    if (filterView === 'needs-water') {
      return needsWatering(plant);
    }
    if (filterView === 'upcoming') {
      return !needsWatering(plant);
    }
    return true; // 'all'
  });

  const plantStats = {
    total: plants.length,
    needsWater: plants.filter(needsWatering).length,
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🌱 Plant Watering Tracker</h1>
          <p>Keep your plants happy and hydrated</p>
        </div>
        <button className="btn-add-plant" onClick={handleAddPlant}>
          + Add Plant
        </button>
      </header>

      <div className="app-stats">
        <div className="stat">
          <span className="stat-number">{plantStats.total}</span>
          <span className="stat-label">Total Plants</span>
        </div>
        <div className="stat highlight">
          <span className="stat-number">{plantStats.needsWater}</span>
          <span className="stat-label">Need Water</span>
        </div>
      </div>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search plants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filterView === 'all' ? 'active' : ''}
            onClick={() => setFilterView('all')}
          >
            All Plants
          </button>
          <button
            className={filterView === 'needs-water' ? 'active' : ''}
            onClick={() => setFilterView('needs-water')}
          >
            Needs Water ({plantStats.needsWater})
          </button>
          <button
            className={filterView === 'upcoming' ? 'active' : ''}
            onClick={() => setFilterView('upcoming')}
          >
            Scheduled
          </button>
        </div>
      </div>

      <main className="plant-grid">
        {filteredPlants.length === 0 ? (
          <div className="empty-state">
            {plants.length === 0 ? (
              <>
                <h2>No plants yet!</h2>
                <p>Click the "Add Plant" button to get started.</p>
              </>
            ) : (
              <>
                <h2>No plants found</h2>
                <p>Try adjusting your filters or search term.</p>
              </>
            )}
          </div>
        ) : (
          filteredPlants.map(plant => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onWater={handleWaterPlant}
              onEdit={handleEditPlant}
              onDelete={handleDeletePlant}
            />
          ))
        )}
      </main>

      {showForm && (
        <PlantForm
          plant={editingPlant}
          onSave={handleSavePlant}
          onCancel={handleCancelForm}
        />
      )}

      <footer className="app-footer">
        <p>Built with React • Data stored locally in your browser</p>
      </footer>
    </div>
  );
}

export default App;
