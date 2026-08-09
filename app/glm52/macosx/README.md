# macOS Desktop Simulation

A web-based macOS desktop environment built with HTML, CSS, and JavaScript. This project simulates the look and feel of macOS (Sequoia/Big Sur style) with a fully interactive desktop experience.

## Features

### Desktop Environment
- **Boot Screen** — Animated Apple logo with progress bar on startup
- **Dynamic Wallpaper** — Animated gradient background
- **Menu Bar** — Translucent top bar with Apple menu, app name, battery, WiFi, Spotlight, Control Center, and live clock
- **Dock** — Magnifying dock with app indicators, tooltips, and bounce animation
- **Desktop Icons** — Click to select, double-click to open

### Window Management
- **Draggable Windows** — Click and drag title bars to move windows
- **Resizable Windows** — Drag edges/corners to resize
- **Traffic Lights** — Close (red), Minimize (yellow), Maximize (green) buttons
- **Window Focus** — Click any window to bring it to front
- **Window Inactive State** — Inactive windows dim their traffic lights
- **Double-click title bar** to maximize/restore

### Applications
| App | Description |
|-----|-------------|
| **Finder** | File browser with sidebar (Desktop, Documents, Downloads, Applications, etc.) |
| **Safari** | Web browser with address bar and start page favorites |
| **Messages** | Messaging app with chat list and conversation view |
| **Mail** | Mail app icon (opens Finder-style window) |
| **Maps** | Map viewer with search bar and SVG map |
| **Photos** | Photo grid with colorful gradients |
| **Notes** | Note-taking app with create/edit/delete functionality |
| **Calendar** | Month view calendar with navigation |
| **Music** | Music player with play/pause and progress bar |
| **Calculator** | Fully functional calculator with keyboard support |
| **Terminal** | Command-line interface with working commands |
| **TextEdit** | Rich text editor with formatting controls |
| **App Store** | App store with discover page |
| **Weather** | Weather forecast with hourly and daily views |
| **System Settings** | Settings panels (Appearance, Wallpaper, Sound, Network, etc.) |
| **About This Mac** | System information window |

### Terminal Commands
The Terminal app supports the following commands:
- `help` — List available commands
- `ls` — List directory contents
- `pwd` — Print working directory
- `whoami` — Print current user
- `date` — Show current date and time
- `echo [text]` — Print text
- `clear` — Clear the terminal
- `neofetch` — Show system information (ASCII art)
- `open [app]` — Open an application
- `about` — About this Mac
- `history` — Show command history
- `cat [file]` — Display file contents
- `uname` — Show system info
- `uptime` — Show system uptime
- `banner` — Show ASCII art banner

### Spotlight Search
- Press **Cmd+Space** or click the search icon in the menu bar
- Type to search for applications
- Use arrow keys to navigate results
- Press Enter to open

### Launchpad
- Click the Launchpad icon in the dock (first icon) or press **F4**
- Grid view of all applications
- Search to filter apps

### Control Center
- Click the control center icon in the menu bar
- Toggle Wi-Fi, Bluetooth, Dark Mode
- Adjust Display and Sound sliders

### Context Menu
- Right-click on the desktop for a context menu
- Options include New Folder, Change Desktop Background, and more

### Dark Mode
- Open Control Center and toggle Dark Mode
- Changes window colors to dark theme

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| **Cmd+Space** | Toggle Spotlight |
| **Cmd+W** | Close active window |
| **Cmd+M** | Minimize active window |
| **Escape** | Close overlays |
| **F4** | Toggle Launchpad |

## File Structure
```
macosx/
├── index.html          # Main HTML structure
├── css/
│   ├── desktop.css     # Desktop, menu bar, dock, overlays styles
│   └── windows.css     # Window and app-specific styles
├── js/
│   ├── icons.js        # SVG icon definitions for all apps
│   ├── apps.js         # App definitions and content
│   └── main.js         # Core logic (window manager, dock, menu bar, etc.)
└── README.md           # This file
```

## How to Run
1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
2. Wait for the boot screen to finish
3. The desktop will appear with Finder open by default
4. Click dock icons to open applications
5. Try Spotlight (Cmd+Space), Launchpad, and the Control Center

## Technical Details
- **No external dependencies** — Pure HTML, CSS, and JavaScript
- **No build step** — Just open the HTML file
- **SVG icons** — All app icons are inline SVG with gradients
- **Glassmorphism** — Uses `backdrop-filter` for blur effects
- **Responsive windows** — All windows are draggable and resizable
- **State management** — In-memory state (notes, calculator, terminal history, etc.)

## Browser Support
Requires a modern browser with support for:
- CSS `backdrop-filter`
- CSS Grid & Flexbox
- ES6+ JavaScript
- SVG

Tested on Chrome, Firefox, Safari, and Edge.
