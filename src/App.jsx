import { useState, useEffect } from 'react';
import PlantCard from './components/PlantCard';
import PlantForm from './components/PlantForm';
import PlantLibrary from './components/PlantLibrary';
import BackupPanel from './components/BackupPanel';
import {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  waterPlant,
  snoozePlant,
  removeWateringEntry,
  fertilizePlant,
  repotPlant,
  archivePlant,
  restorePlant,
  needsWatering
} from './utils/plantStorage';
import { deletePhotosForPlant } from './utils/photoStorage';
import { shouldRemindBackup, dismissBackupReminder } from './utils/exportUtils';
import { maybeNotifyDuePlants } from './utils/notifications';
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
  const [activeTab, setActiveTab] = useState('plants'); // plants | library | backup
  const [showBackupReminder, setShowBackupReminder] = useState(
    () => shouldRemindBackup(getPlants().length)
  );
  const [filterView, setFilterView] = useState('all'); // all, needs-water, upcoming, archived
  const [roomFilter, setRoomFilter] = useState('all');
  const [groupByRoom, setGroupByRoom] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // If any plants are due when the app opens, show one notification per
  // day (when the user has allowed notifications).
  useEffect(() => {
    maybeNotifyDuePlants(getPlants().filter((p) => !p.archived && needsWatering(p)).length);
  }, []);

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
      deletePhotosForPlant(id).catch(console.error);
      setPlants(getPlants());
    }
  };

  const handleWaterPlant = (id) => {
    waterPlant(id);
    setPlants(getPlants());
  };

  // "Watered late" — record a watering on a past date
  const handleWaterPlantOn = (id, dateISO) => {
    waterPlant(id, dateISO);
    setPlants(getPlants());
  };

  // "Soil is still damp" — push the reminder out 2 days
  const handleSnoozePlant = (id) => {
    snoozePlant(id);
    setPlants(getPlants());
  };

  const handleRemoveWatering = (id, dateISO) => {
    removeWateringEntry(id, dateISO);
    setPlants(getPlants());
  };

  const handleFertilizePlant = (id) => {
    fertilizePlant(id);
    setPlants(getPlants());
  };

  const handleRepotPlant = (id) => {
    repotPlant(id);
    setPlants(getPlants());
  };

  const handleArchivePlant = (id) => {
    archivePlant(id);
    setPlants(getPlants());
  };

  const handleRestorePlant = (id) => {
    restorePlant(id);
    setPlants(getPlants());
  };

  const handleDismissReminder = () => {
    dismissBackupReminder();
    setShowBackupReminder(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlant(null);
    setFormSpecies(null);
  };

  const activePlants = plants.filter((p) => !p.archived);
  const archivedPlants = plants.filter((p) => p.archived);

  // Every room currently in use, for the room filter dropdown
  const roomsInUse = [...new Set(activePlants.map((p) => p.location).filter(Boolean))].sort();

  // Filter plants based on view, room, and search
  const filteredPlants = (filterView === 'archived' ? archivedPlants : activePlants).filter(plant => {
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
    return true; // 'all' or 'archived'
  });

  // Room-by-room grouping for watering rounds
  const groupedPlants = groupByRoom
    ? [...new Set(filteredPlants.map((p) => p.location || 'No room set'))].map(
        (room) => ({
          room,
          plants: filteredPlants.filter((p) => (p.location || 'No room set') === room),
        })
      )
    : null;

  const plantStats = {
    total: activePlants.length,
    needsWater: activePlants.filter(needsWatering).length,
  };

  const renderCard = (plant) => (
    <PlantCard
      key={plant.id}
      plant={plant}
      onWater={handleWaterPlant}
      onWaterOn={handleWaterPlantOn}
      onSnooze={handleSnoozePlant}
      onRemoveWatering={handleRemoveWatering}
      onFertilize={handleFertilizePlant}
      onRepot={handleRepotPlant}
      onArchive={handleArchivePlant}
      onRestore={handleRestorePlant}
      onEdit={handleEditPlant}
      onDelete={handleDeletePlant}
    />
  );

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
        <button
          className={activeTab === 'backup' ? 'active' : ''}
          onClick={() => setActiveTab('backup')}
        >
          💾 Backup
        </button>
      </nav>

      {showBackupReminder && activeTab !== 'backup' && (
        <div className="backup-reminder">
          <span>
            💾 It's been a while since your last backup — your plants live
            only in this browser.
          </span>
          <div className="backup-reminder-actions">
            <button
              className="reminder-go"
              onClick={() => setActiveTab('backup')}
            >
              Back up now
            </button>
            <button className="reminder-dismiss" onClick={handleDismissReminder}>
              Later
            </button>
          </div>
        </div>
      )}

      {activeTab === 'backup' ? (
        <BackupPanel
          plantCount={plants.length}
          onImported={() => {
            setPlants(getPlants());
            setShowBackupReminder(false);
          }}
        />
      ) : activeTab === 'library' ? (
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
              {archivedPlants.length > 0 && (
                <button
                  className={filterView === 'archived' ? 'active' : ''}
                  onClick={() => setFilterView('archived')}
                >
                  🗄️ Archived ({archivedPlants.length})
                </button>
              )}
              <button
                className={`group-toggle ${groupByRoom ? 'active' : ''}`}
                onClick={() => setGroupByRoom(!groupByRoom)}
                title="Group the list by room for watering rounds"
              >
                🏠 By room
              </button>
            </div>
          </div>

          {filteredPlants.length === 0 ? (
            <main className="plant-grid">
              <div className="empty-state">
                {plants.length === 0 ? (
                  <>
                    <h2>🌿 No plants yet!</h2>
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
            </main>
          ) : groupedPlants ? (
            <main>
              {groupedPlants.map(({ room, plants: roomPlants }) => (
                <section key={room} className="room-section">
                  <h2 className="room-heading">
                    📍 {room}{' '}
                    <span className="room-count">({roomPlants.length})</span>
                  </h2>
                  <div className="plant-grid">{roomPlants.map(renderCard)}</div>
                </section>
              ))}
            </main>
          ) : (
            <main className="plant-grid">{filteredPlants.map(renderCard)}</main>
          )}
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
