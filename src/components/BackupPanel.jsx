import { useState } from 'react';
import {
  exportBackup,
  importBackup,
  exportCSV,
  openPlantBinder,
  getLastBackupDate,
} from '../utils/exportUtils';
import './BackupPanel.css';

function BackupPanel({ plantCount, onImported }) {
  const [message, setMessage] = useState(null); // { kind: 'ok'|'error', text }
  const [lastBackup, setLastBackup] = useState(() => getLastBackupDate());

  const say = (kind, text) => setMessage({ kind, text });

  const handleBackup = () => {
    exportBackup();
    setLastBackup(getLastBackupDate());
    say('ok', 'Backup downloaded! Keep the file somewhere safe (Documents, a USB stick, cloud storage...).');
  };

  const handleImport = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (
      plantCount > 0 &&
      !window.confirm(
        `Restoring a backup will replace your current ${plantCount} plant(s) with the ones in the file. Continue?`
      )
    ) {
      return;
    }
    try {
      const count = await importBackup(file);
      onImported();
      say('ok', `Restored ${count} plant(s) from the backup.`);
    } catch (error) {
      say('error', error.message);
    }
  };

  const handleBinder = async () => {
    try {
      await openPlantBinder();
    } catch (error) {
      say('error', error.message);
    }
  };

  return (
    <div className="backup-panel">
      <div className="backup-card">
        <h2>💾 Backup &amp; Restore</h2>
        <p>
          Your plants live only in this browser — if its data is ever cleared,
          they're gone. Download a backup file now and then, and you can
          restore your whole collection anytime (or move it to another
          browser or computer).
        </p>
        <p className="backup-status">
          Last backup:{' '}
          <strong>{lastBackup ? lastBackup.toLocaleDateString() : 'never'}</strong>
        </p>
        <div className="backup-actions">
          <button className="btn-primary" onClick={handleBackup}>
            ⬇️ Download Backup
          </button>
          <label className="btn-secondary">
            ⬆️ Restore from Backup
            <input type="file" accept=".json,application/json" onChange={handleImport} hidden />
          </label>
        </div>
        <p className="fine-print">
          Note: backups include your plant details and watering history.
          Photos stay in this browser and aren't included in the file.
        </p>
      </div>

      <div className="backup-card">
        <h2>📖 Plant Binder</h2>
        <p>
          Create a beautiful printable document of your whole collection —
          every plant with its photo, care details, and recent waterings,
          organized by room. Save it as a PDF or print it out.
        </p>
        <div className="backup-actions">
          <button className="btn-primary" onClick={handleBinder}>
            🖨️ Open Plant Binder
          </button>
        </div>
        <p className="fine-print">
          The binder opens in a new tab — press Ctrl+P there and choose
          "Save as PDF".
        </p>
      </div>

      <div className="backup-card">
        <h2>📊 Spreadsheet Export</h2>
        <p>
          Download your plants and watering history as a CSV file you can
          open in Excel or Google Sheets.
        </p>
        <div className="backup-actions">
          <button className="btn-primary" onClick={exportCSV}>
            ⬇️ Download CSV
          </button>
        </div>
      </div>

      {message && (
        <div className={`backup-message ${message.kind}`}>{message.text}</div>
      )}
    </div>
  );
}

export default BackupPanel;
