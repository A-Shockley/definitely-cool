import { useState } from 'react';
import PlantCard from './components/PlantCard';
import PlantForm from './components/PlantForm';
import PlantLibrary from './components/PlantLibrary';
import {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  waterPlant,
  needsWatering
} from './utils/plantStorage';
import './App.css';

// If the chosen name is already taken, add a number: "Spider Plant" →
// "Spider Plant 2", "Spider Plant 3", ... so identical plants stay
// distinguishable.
const uniqueName = (name, plants) => {
  if (!plants.some((p) => p.name === name)) return name;
  let n = 2;
  while (plants.some((p) => p.name === `${name} ${n}`)) n++;
  return `${name} ${n}`;
};

function App() {
  const [plants, setPlants] = useState(() => getPlants());
  const [showForm, setShowForm] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [formSpecies, setFormSpecies] = useState(null); // prefill from the library
  const [activeTab, setActiveTab] = useState('plants'); // plants | library
  const [filterView, setFilterView] = useState('all'); // all, needs-water, upcoming
  const [roomFilter, setRoomFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddPlant = () => {
    setEditingPlant(null);
    setFormSpecies(null);
    setShowForm(true);
  };

  const handleEditPlant = (plant) => {
    setEditingPlant(plant);
    setFormSpecies(null);
    setShowForm(true);
  };

  // "Add to My Plants" from the Plant Library
  const handleAddSpecies = (species) => {
    setEditingPlant(null);
    setFormSpecies(species);
    setShowForm(true);
  };

  const handleSavePlant = (plantData) => {
    if (editingPlant) {
      updatePlant(editingPlant.id, plantData);
    } else {
      addPlant({ ...plantData, name: uniqueName(plantData.name, plants) });
    }
    setPlants(getPlants());
    setShowForm(false);
    setEditingPlant(null);
    setFormSpecies(null);
    setActiveTab('plants');
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
    setFormSpecies(null);
  };

  // Every room currently in use, for the room filter dropdown
  const roomsInUse = [...new Set(plants.map((p) => p.location).filter(Boolean))].sort();

  // Filter plants based on view, room, and search
  const filteredPlants = plants.filter(plant => {
    // Room filter
    if (roomFilter !== 'all' && plant.location !== roomFilter) {
      return false;
    }

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

      <nav className="app-tabs">
        <button
          className={activeTab === 'plants' ? 'active' : ''}
          onClick={() => setActiveTab('plants')}
        >
          🪴 My Plants ({plantStats.total})
        </button>
        <button
          className={activeTab === 'library' ? 'active' : ''}
          onClick={() => setActiveTab('library')}
        >
          📚 Plant Library
        </button>
      </nav>

      {activeTab === 'library' ? (
        <PlantLibrary onAddSpecies={handleAddSpecies} />
      ) : (
        <>
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
              {roomsInUse.length > 0 && (
                <select
                  className="room-filter"
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  title="Filter by room"
                >
                  <option value="all">🏠 All rooms</option>
                  {roomsInUse.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              )}
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
                    <p>
                      Click "Add Plant" to get started, or browse the Plant
                      Library for care guides and one-tap adding.
                    </p>
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
        </>
      )}

      {showForm && (
        <PlantForm
          plant={editingPlant}
          initialSpecies={formSpecies}
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
