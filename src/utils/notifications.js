// Browser notifications for watering day.
// Honest limitation: with no server, the browser can only notify while
// the app is open — so we check when the app loads and show at most one
// notification per day.

const LAST_NOTIFY_KEY = 'plant-tracker-last-notify';

export const notificationsSupported = () => 'Notification' in window;

export const notificationPermission = () =>
  notificationsSupported() ? Notification.permission : 'unsupported';

export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
};

// Show "N plants need water" once per day, if permitted.
export const maybeNotifyDuePlants = (dueCount) => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  if (dueCount <= 0) return;
  const today = new Date().toDateString();
  if (localStorage.getItem(LAST_NOTIFY_KEY) === today) return;
  try {
    new Notification('🌱 Plant Watering Tracker', {
      body:
        dueCount === 1
          ? '1 plant needs water today'
          : `${dueCount} plants need water today`,
      icon: `${import.meta.env.BASE_URL}icon-192.png`,
    });
    localStorage.setItem(LAST_NOTIFY_KEY, today);
  } catch (error) {
    // Some platforms (e.g. Android) require service-worker notifications;
    // failing silently is fine — the in-app badge still shows what's due.
    console.warn('Notification failed:', error);
  }
};
