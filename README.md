# 🌱 Plant Watering Tracker

A beautiful and intuitive web application to help you keep track of your plant watering schedule. Never forget to water your plants again!

## Features

- **Add & Manage Plants**: Easily add plants with detailed information (name, species, location, care instructions)
- **Watering Schedule**: Set watering frequency and get automatic reminders
- **Smart Tracking**: Visual indicators show which plants need water now, soon, or are overdue
- **Search & Filter**: Quickly find plants by name, species, or location
- **Plant Care Notes**: Store care instructions, soil type, light requirements, and more
- **Local Storage**: All data stored in your browser (no server required)
- **Responsive Design**: Works great on desktop, tablet, and mobile

## Tech Stack

- **React** - Modern UI library
- **Vite** - Lightning-fast build tool
- **CSS** - Clean, gradient-based styling
- **localStorage** - Client-side data persistence

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd definitely-cool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit: `http://localhost:5173`

## Usage

### Adding a Plant

1. Click the **"+ Add Plant"** button in the header
2. Fill in the plant details:
   - **Name** (required) - Give your plant a name
   - **Species** - Scientific or common name
   - **Location** - Where the plant is located (e.g., "Living room window")
   - **Watering Frequency** - How many days between waterings
   - **Light Requirement** - Select from dropdown options
   - **Soil Type** - Type of soil the plant needs
   - **Notes** - Any additional care instructions
3. Click **"Add Plant"** to save

### Watering a Plant

- Click the **💧 Water** button on any plant card
- The watering date will be recorded and the next watering date will be calculated

### Viewing Plant Details

- Click **"Show Details"** on any plant card to see:
  - Full care notes
  - Light requirements
  - Soil type
  - Edit and Delete options

### Filtering Plants

Use the filter buttons to view:
- **All Plants** - Show all your plants
- **Needs Water** - Only plants that need watering now or are overdue
- **Scheduled** - Plants with upcoming watering dates

### Searching

Use the search box to find plants by:
- Plant name
- Species
- Location

## Project Structure

```
definitely-cool/
├── src/
│   ├── components/
│   │   ├── PlantCard.jsx         # Individual plant card component
│   │   ├── PlantCard.css
│   │   ├── PlantForm.jsx          # Add/edit plant form
│   │   └── PlantForm.css
│   ├── utils/
│   │   └── plantStorage.js        # localStorage utilities
│   ├── App.jsx                     # Main app component
│   ├── App.css                     # Main app styles
│   ├── main.jsx                    # App entry point
│   └── index.css                   # Global styles
├── public/                         # Static assets
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── vite.config.js                 # Vite configuration
└── README.md                       # This file
```

## How It Works

### Data Model

Each plant is stored with the following properties:

```javascript
{
  id: "unique-timestamp-id",
  name: "Plant Name",
  species: "Plant Species",
  location: "Living Room",
  wateringFrequency: 7,  // days
  lightRequirement: "Bright indirect",
  soilType: "Well-draining",
  notes: "Care instructions...",
  lastWatered: "2025-12-30T00:00:00.000Z",
  createdAt: "2025-12-30T00:00:00.000Z"
}
```

### Watering Logic

- When you water a plant, the current timestamp is saved to `lastWatered`
- The app calculates the next watering date: `lastWatered + wateringFrequency`
- Plants are categorized as:
  - **Overdue** - Next watering date has passed
  - **Water today** - Next watering date is today
  - **Water tomorrow** - Next watering date is tomorrow
  - **Upcoming** - Next watering date is in the future

### Storage

- All data is stored in browser's `localStorage`
- Data persists between sessions
- No server or database required
- Data is specific to each browser/device

## Future Enhancements

Some ideas for expanding the app:

- 📷 **Photo Upload** - Add photos of your plants
- 🔔 **Browser Notifications** - Get desktop notifications for watering reminders
- 📊 **Watering History** - Track complete watering history for each plant
- 🗓️ **Calendar View** - See watering schedule in calendar format
- 📱 **PWA** - Install as a Progressive Web App
- ☁️ **Cloud Sync** - Sync data across devices with backend
- 📈 **Analytics** - Track plant health and growth over time
- 🏷️ **Tags & Categories** - Organize plants with custom tags
- 📥 **Import/Export** - Backup and restore plant data

## Development

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Contributing

This is a beginner-friendly project! Feel free to:
- Add new features
- Improve the UI/UX
- Fix bugs
- Enhance documentation

## License

MIT License - feel free to use this project however you'd like!

## Support

Questions or issues? Feel free to open an issue on GitHub.

---

Happy planting! 🌿
