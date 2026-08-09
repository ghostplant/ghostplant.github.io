/* ============================================
   macOS Desktop Simulation - Main Logic
   ============================================ */

// ============================================
// Shared Drag/Resize State
// ============================================
const DragState = {
  active: false,
  type: null, // 'move' or 'resize'
  element: null,
  dir: null,
  startX: 0,
  startY: 0,
  startLeft: 0,
  startTop: 0,
  startW: 0,
  startH: 0,
};

document.addEventListener('mousemove', (e) => {
  if (!DragState.active || !DragState.element) return;
  const win = DragState.element;

  if (DragState.type === 'move') {
    let newLeft = DragState.startLeft + (e.clientX - DragState.startX);
    let newTop = DragState.startTop + (e.clientY - DragState.startY);
    newTop = Math.max(0, newTop);
    win.style.left = newLeft + 'px';
    win.style.top = newTop + 'px';
  } else if (DragState.type === 'resize') {
    const dx = e.clientX - DragState.startX;
    const dy = e.clientY - DragState.startY;
    const dir = DragState.dir;
    let newW = DragState.startW, newH = DragState.startH, newL = DragState.startL, newT = DragState.startT;

    if (dir.includes('r')) newW = Math.max(200, DragState.startW + dx);
    if (dir.includes('b')) newH = Math.max(100, DragState.startH + dy);
    if (dir.includes('l')) { newW = Math.max(200, DragState.startW - dx); newL = DragState.startL + (DragState.startW - newW); }
    if (dir.includes('t')) { newH = Math.max(100, DragState.startH - dy); newT = DragState.startT + (DragState.startH - newH); }

    win.style.width = newW + 'px';
    win.style.height = newH + 'px';
    win.style.left = newL + 'px';
    win.style.top = newT + 'px';
  }
});

document.addEventListener('mouseup', () => {
  DragState.active = false;
  DragState.element = null;
  DragState.type = null;
});

// ============================================
// Window Manager
// ============================================
const WindowManager = {
  windows: [],
  zIndex: 100,
  activeWindow: null,
  windowIdCounter: 0,

  openApp(appId) {
    const app = AppDefinitions[appId];
    if (!app) {
      showNotification('Error', `Application "${appId}" not found.`);
      return;
    }

    // Check if window already exists (for single-instance apps)
    const existing = this.windows.find(w => w.appId === appId);
    if (existing && !app.allowMultiple) {
      this.focusWindow(existing.id);
      if (existing.minimized) {
        this.unminimizeWindow(existing.id);
      }
      return;
    }

    this.createWindow(appId, app);
  },

  createWindow(appId, app) {
    const id = ++this.windowIdCounter;
    const desktop = document.getElementById('windows-layer');
    const desktopRect = desktop.getBoundingClientRect();

    // Calculate position (cascade)
    const offset = (this.windows.length % 6) * 30;
    const width = Math.min(app.width, desktopRect.width - 40);
    const height = Math.min(app.height, desktopRect.height - 40);
    const x = Math.max(10, (desktopRect.width - width) / 2 + offset - 90);
    const y = Math.max(10, (desktopRect.height - height) / 2 + offset - 90);

    const win = document.createElement('div');
    win.className = 'window';
    win.id = `window-${id}`;
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.zIndex = ++this.zIndex;
    win.dataset.appId = appId;
    win.dataset.windowId = id;

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="traffic-lights">
          <button class="traffic-light tl-close" title="Close">
            <svg viewBox="0 0 8 8"><path d="M2 2 L6 6 M6 2 L2 6" stroke="#4d0000" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
          <button class="traffic-light tl-minimize" title="Minimize">
            <svg viewBox="0 0 8 8"><line x1="2" y1="4" x2="6" y2="4" stroke="#4d3500" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
          <button class="traffic-light tl-maximize" title="Maximize">
            <svg viewBox="0 0 8 8"><path d="M2 2 L6 6 M2 6 L6 2" stroke="#003d00" stroke-width="1.2" stroke-linecap="round" opacity="0"/><path d="M2.5 2.5 L5.5 2.5 L5.5 5.5 M2.5 5.5 L2.5 2.5" fill="none" stroke="#003d00" stroke-width="1.2"/></svg>
          </button>
        </div>
        <div class="window-title">${app.name}</div>
      </div>
      <div class="window-content"></div>
      ${app.resizable !== false ? `
        <div class="window-resize-handle wrh-t"></div>
        <div class="window-resize-handle wrh-b"></div>
        <div class="window-resize-handle wrh-l"></div>
        <div class="window-resize-handle wrh-r"></div>
        <div class="window-resize-handle wrh-br"></div>
        <div class="window-resize-handle wrh-bl"></div>
        <div class="window-resize-handle wrh-tr"></div>
        <div class="window-resize-handle wrh-tl"></div>
      ` : ''}
    `;

    const contentEl = win.querySelector('.window-content');
    contentEl.innerHTML = app.content();

    desktop.appendChild(win);

    const windowData = {
      id,
      appId,
      element: win,
      title: app.name,
      minimized: false,
      maximized: false,
      prevRect: null,
    };

    this.windows.push(windowData);

    // Setup interactions
    this.setupDragging(win);
    this.setupTrafficLights(win, windowData);
    if (app.resizable !== false) {
      this.setupResize(win);
    }
    this.setupFocus(win, windowData);

    // Focus the new window
    this.focusWindow(id);

    // Call app's onOpen callback
    if (app.onOpen) {
      try {
        app.onOpen(win);
      } catch (e) {
        console.error('App onOpen error:', e);
      }
    }

    // Update dock indicators
    this.updateDockIndicators();

    // Update active app name in menu bar
    document.getElementById('active-app-name').textContent = app.name;

    // Bounce dock icon
    const dockIcon = document.querySelector(`.dock-icon[data-app="${appId}"]`);
    if (dockIcon) {
      dockIcon.classList.add('bouncing');
      setTimeout(() => dockIcon.classList.remove('bouncing'), 600);
    }
  },

  setupDragging(win) {
    const titlebar = win.querySelector('.window-titlebar');
    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.closest('.traffic-light')) return;
      if (win.dataset.maximized === 'true') return;
      DragState.active = true;
      DragState.type = 'move';
      DragState.element = win;
      DragState.startX = e.clientX;
      DragState.startY = e.clientY;
      DragState.startLeft = parseInt(win.style.left);
      DragState.startTop = parseInt(win.style.top);
      e.preventDefault();
    });
  },

  setupTrafficLights(win, windowData) {
    const closeBtn = win.querySelector('.tl-close');
    const minBtn = win.querySelector('.tl-minimize');
    const maxBtn = win.querySelector('.tl-maximize');

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeWindow(windowData.id);
    });

    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimizeWindow(windowData.id);
    });

    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(windowData.id);
    });

    // Double-click title bar to maximize
    win.querySelector('.window-titlebar').addEventListener('dblclick', (e) => {
      if (e.target.closest('.traffic-light')) return;
      this.toggleMaximize(windowData.id);
    });
  },

  setupResize(win) {
    const handles = win.querySelectorAll('.window-resize-handle');
    handles.forEach(handle => {
      const dir = handle.className.split(' ').find(c => c.startsWith('wrh-')).replace('wrh-', '');
      handle.addEventListener('mousedown', (e) => {
        if (win.dataset.maximized === 'true') return;
        DragState.active = true;
        DragState.type = 'resize';
        DragState.element = win;
        DragState.dir = dir;
        DragState.startX = e.clientX;
        DragState.startY = e.clientY;
        DragState.startW = parseInt(win.style.width);
        DragState.startH = parseInt(win.style.height);
        DragState.startL = parseInt(win.style.left);
        DragState.startT = parseInt(win.style.top);
        e.preventDefault();
        e.stopPropagation();
      });
    });
  },

  setupFocus(win, windowData) {
    win.addEventListener('mousedown', () => {
      this.focusWindow(windowData.id);
    });
  },

  focusWindow(id) {
    const windowData = this.windows.find(w => w.id === id);
    if (!windowData) return;

    this.windows.forEach(w => w.element.classList.add('inactive'));
    windowData.element.classList.remove('inactive');
    windowData.element.style.zIndex = ++this.zIndex;
    this.activeWindow = windowData;

    // Update menu bar
    const app = AppDefinitions[windowData.appId];
    if (app) {
      document.getElementById('active-app-name').textContent = app.name;
    }
  },

  closeWindow(id) {
    const idx = this.windows.findIndex(w => w.id === id);
    if (idx === -1) return;

    const windowData = this.windows[idx];
    windowData.element.classList.add('closing');

    setTimeout(() => {
      windowData.element.remove();
      this.windows.splice(idx, 1);
      this.updateDockIndicators();

      // Focus next window
      if (this.windows.length > 0) {
        this.focusWindow(this.windows[this.windows.length - 1].id);
      } else {
        document.getElementById('active-app-name').textContent = 'Finder';
      }
    }, 200);
  },

  minimizeWindow(id) {
    const windowData = this.windows.find(w => w.id === id);
    if (!windowData) return;

    windowData.element.classList.add('minimizing');
    windowData.minimized = true;

    setTimeout(() => {
      windowData.element.style.display = 'none';
      windowData.element.classList.remove('minimizing');
    }, 400);

    // Focus next window
    const nextWindow = this.windows.find(w => !w.minimized && w.id !== id);
    if (nextWindow) {
      this.focusWindow(nextWindow.id);
    }
  },

  unminimizeWindow(id) {
    const windowData = this.windows.find(w => w.id === id);
    if (!windowData) return;

    windowData.element.style.display = '';
    windowData.minimized = false;
    windowData.element.classList.add('window-open');
    setTimeout(() => windowData.element.classList.remove('window-open'), 200);
    this.focusWindow(id);
  },

  toggleMaximize(id) {
    const windowData = this.windows.find(w => w.id === id);
    if (!windowData) return;
    const win = windowData.element;
    const desktop = document.getElementById('windows-layer');
    const rect = desktop.getBoundingClientRect();

    if (win.dataset.maximized === 'true') {
      // Restore
      const prev = JSON.parse(win.dataset.prevRect);
      win.style.left = prev.left + 'px';
      win.style.top = prev.top + 'px';
      win.style.width = prev.width + 'px';
      win.style.height = prev.height + 'px';
      win.dataset.maximized = 'false';
      win.classList.remove('maximized');
    } else {
      // Maximize
      win.dataset.prevRect = JSON.stringify({
        left: parseInt(win.style.left),
        top: parseInt(win.style.top),
        width: parseInt(win.style.width),
        height: parseInt(win.style.height),
      });
      win.style.left = '0px';
      win.style.top = '0px';
      win.style.width = rect.width + 'px';
      win.style.height = rect.height + 'px';
      win.dataset.maximized = 'true';
      win.classList.add('maximized');
    }
  },

  updateDockIndicators() {
    const openApps = new Set(this.windows.map(w => w.appId));
    document.querySelectorAll('.dock-icon[data-app]').forEach(icon => {
      if (openApps.has(icon.dataset.app)) {
        icon.classList.add('has-indicator');
      } else {
        icon.classList.remove('has-indicator');
      }
    });
  },

  closeAll() {
    [...this.windows].forEach(w => this.closeWindow(w.id));
  },
};

// ============================================
// Dock
// ============================================
function initDock() {
  const dockItems = document.getElementById('dock-items');

  DockApps.forEach(appId => {
    const app = AppDefinitions[appId];
    if (!app) return;

    const icon = document.createElement('div');
    icon.className = 'dock-icon';
    icon.dataset.app = appId;
    icon.innerHTML = `
      <div class="dock-icon-inner">${Icons[app.icon] || Icons.generic}</div>
      <div class="dock-indicator"></div>
      <div class="dock-tooltip">${app.name}</div>
    `;

    icon.addEventListener('click', () => {
      WindowManager.openApp(appId);
    });

    dockItems.appendChild(icon);
  });

  // Add Launchpad icon at the beginning
  const launchpadIcon = document.createElement('div');
  launchpadIcon.className = 'dock-icon';
  launchpadIcon.dataset.app = 'launchpad';
  launchpadIcon.innerHTML = `
    <div class="dock-icon-inner">${Icons.launchpad}</div>
    <div class="dock-indicator"></div>
    <div class="dock-tooltip">Launchpad</div>
  `;
  launchpadIcon.addEventListener('click', () => {
    showLaunchpad();
  });
  dockItems.insertBefore(launchpadIcon, dockItems.firstChild);

  // Trash icon
  const trashIcon = document.getElementById('trash-icon');
  if (trashIcon) {
    trashIcon.innerHTML = Icons.trash;
  }
  const trashDockIcon = document.querySelector('.dock-icon[data-app="trash"]');
  if (trashDockIcon) {
    trashDockIcon.addEventListener('click', () => {
      showNotification('Trash', 'The Trash is empty.');
    });
  }
}

// ============================================
// Menu Bar & Clock
// ============================================
function initMenuBar() {
  // Clock
  function updateClock() {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    document.getElementById('datetime').textContent = `${dayName} ${monthName} ${date}  ${hours}:${minutes} ${ampm}`;

    // Update calendar icons (dock, launchpad, etc.)
    document.querySelectorAll('.cal-day-num').forEach(el => {
      el.textContent = date;
    });
    document.querySelectorAll('.cal-month-text').forEach(el => {
      el.textContent = monthName.toUpperCase();
    });
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Apple menu
  const appleMenu = document.getElementById('apple-menu-btn');
  appleMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'About This Mac', action: () => WindowManager.openApp('about') },
      { divider: true },
      { label: 'System Settings...', action: () => WindowManager.openApp('settings') },
      { label: 'App Store...', action: () => WindowManager.openApp('appstore') },
      { divider: true },
      { label: 'Recent Items', submenu: [] },
      { divider: true },
      { label: 'Force Quit...', shortcut: '⌥⌘⎋', action: () => showNotification('Force Quit', 'No applications need to be force quit.') },
      { divider: true },
      { label: 'Sleep', action: () => showNotification('Sleep', 'Sleep mode is not available in this simulation.') },
      { label: 'Restart...', action: () => location.reload() },
      { label: 'Shut Down...', action: () => showNotification('Shut Down', 'Shut down is not available in this simulation.') },
      { divider: true },
      { label: 'Lock Screen', shortcut: '⌃⌘Q', action: () => showNotification('Lock Screen', 'Lock screen is not available in this simulation.') },
    ]);
  });

  // Spotlight button
  document.getElementById('search-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    showSpotlight();
  });

  // Control center
  document.getElementById('control-center-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleControlCenter();
  });

  // Battery
  document.getElementById('battery-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Battery: 87%', action: () => {} },
      { divider: true },
      { label: 'Low Power Mode', action: () => {} },
      { divider: true },
      { label: 'Battery Settings...', action: () => WindowManager.openApp('settings') },
    ]);
  });

  // WiFi
  document.getElementById('wifi-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Wi-Fi: On', action: () => {} },
      { label: 'Home_Network_5G', action: () => {} },
      { label: 'Coffee_Shop_WiFi', action: () => {} },
      { label: 'Guest_Network', action: () => {} },
      { divider: true },
      { label: 'Wi-Fi Settings...', action: () => WindowManager.openApp('settings') },
    ]);
  });
}

// ============================================
// Spotlight Search
// ============================================
function showSpotlight() {
  const spotlight = document.getElementById('spotlight');
  spotlight.classList.remove('hidden');
  const input = document.getElementById('spotlight-input');
  input.value = '';
  input.focus();
  renderSpotlightResults('');
}

function hideSpotlight() {
  document.getElementById('spotlight').classList.add('hidden');
}

function renderSpotlightResults(query) {
  const results = document.getElementById('spotlight-results');
  const q = query.toLowerCase().trim();

  if (!q) {
    results.innerHTML = '';
    return;
  }

  const matches = Object.entries(AppDefinitions).filter(([id, app]) => {
    return app.name.toLowerCase().includes(q);
  });

  if (matches.length === 0) {
    results.innerHTML = '<div style="padding:16px;text-align:center;color:#888;">No results found</div>';
    return;
  }

  results.innerHTML = matches.map(([id, app], i) => `
    <div class="spotlight-result ${i === 0 ? 'selected' : ''}" data-app="${id}">
      <div class="spotlight-result-icon">${Icons[app.icon] || Icons.generic}</div>
      <div class="spotlight-result-text">
        <div class="spotlight-result-name">${app.name}</div>
        <div class="spotlight-result-type">Application</div>
      </div>
    </div>
  `).join('');

  results.querySelectorAll('.spotlight-result').forEach(el => {
    el.addEventListener('click', () => {
      WindowManager.openApp(el.dataset.app);
      hideSpotlight();
    });
  });
}

function initSpotlight() {
  const input = document.getElementById('spotlight-input');

  input.addEventListener('input', () => {
    renderSpotlightResults(input.value);
  });

  input.addEventListener('keydown', (e) => {
    const results = document.querySelectorAll('.spotlight-result');
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      const current = document.querySelector('.spotlight-result.selected');
      let idx = current ? Array.from(results).indexOf(current) : -1;
      idx = (idx + 1) % results.length;
      if (current) current.classList.remove('selected');
      results[idx].classList.add('selected');
      results[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      const current = document.querySelector('.spotlight-result.selected');
      let idx = current ? Array.from(results).indexOf(current) : 0;
      idx = (idx - 1 + results.length) % results.length;
      if (current) current.classList.remove('selected');
      results[idx].classList.add('selected');
      results[idx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      const selected = document.querySelector('.spotlight-result.selected');
      if (selected) {
        WindowManager.openApp(selected.dataset.app);
        hideSpotlight();
      }
    } else if (e.key === 'Escape') {
      hideSpotlight();
    }
  });

  document.getElementById('spotlight').addEventListener('click', (e) => {
    if (e.target.id === 'spotlight') hideSpotlight();
  });
}

// ============================================
// Launchpad
// ============================================
function showLaunchpad() {
  const launchpad = document.getElementById('launchpad');
  const grid = document.getElementById('launchpad-grid');

  grid.innerHTML = Object.entries(AppDefinitions)
    .filter(([id]) => id !== 'about')
    .map(([id, app]) => `
      <div class="launchpad-item" data-app="${id}">
        ${Icons[app.icon] || Icons.generic}
        <div class="launchpad-item-label">${app.name}</div>
      </div>
    `).join('');

  grid.querySelectorAll('.launchpad-item').forEach(item => {
    item.addEventListener('click', () => {
      WindowManager.openApp(item.dataset.app);
      hideLaunchpad();
    });
  });

  launchpad.classList.remove('hidden');
  document.getElementById('launchpad-search').value = '';
  document.getElementById('launchpad-search').focus();
}

function hideLaunchpad() {
  document.getElementById('launchpad').classList.add('hidden');
}

function initLaunchpad() {
  const search = document.getElementById('launchpad-search');
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    document.querySelectorAll('.launchpad-item').forEach(item => {
      const name = item.querySelector('.launchpad-item-label').textContent.toLowerCase();
      item.style.display = name.includes(q) ? '' : 'none';
    });
  });

  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideLaunchpad();
  });

  document.getElementById('launchpad').addEventListener('click', (e) => {
    if (e.target.id === 'launchpad') hideLaunchpad();
  });
}

// ============================================
// Context Menu
// ============================================
function showContextMenu(x, y, items) {
  const menu = document.getElementById('context-menu');
  menu.innerHTML = items.map(item => {
    if (item.divider) return '<div class="context-menu-divider"></div>';
    return `<div class="context-menu-item" data-action="${item.label || ''}">
      <span>${item.label}</span>
      ${item.shortcut ? `<span class="context-menu-shortcut">${item.shortcut}</span>` : ''}
    </div>`;
  }).join('');

  menu.classList.remove('hidden');
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  // Adjust if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
  }

  menu.querySelectorAll('.context-menu-item').forEach((el, i) => {
    const item = items.filter(it => !it.divider)[i];
    if (item && item.action) {
      el.addEventListener('click', () => {
        item.action();
        hideContextMenu();
      });
    }
  });
}

function hideContextMenu() {
  document.getElementById('context-menu').classList.add('hidden');
}

function initContextMenu() {
  // Desktop right-click
  document.getElementById('desktop-area').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
      { label: 'New Folder', action: () => showNotification('Finder', 'Cannot create new folder in this simulation.') },
      { divider: true },
      { label: 'Get Info', action: () => showNotification('Desktop', 'Desktop info: macOS Sequoia 15.0') },
      { label: 'Change Desktop Background...', action: () => WindowManager.openApp('settings') },
      { divider: true },
      { label: 'Use Stacks', action: () => {} },
      { label: 'Sort By', submenu: [] },
      { label: 'Clean Up', action: () => {} },
      { divider: true },
      { label: 'Show View Options', action: () => {} },
    ]);
  });

  // Click anywhere to close context menu
  document.addEventListener('click', () => {
    hideContextMenu();
  });

  document.addEventListener('contextmenu', (e) => {
    // Allow context menu on desktop area, prevent elsewhere
    if (!e.target.closest('#desktop-area')) {
      e.preventDefault();
    }
  });
}

// ============================================
// Control Center
// ============================================
function toggleControlCenter() {
  const cc = document.getElementById('control-center');
  cc.classList.toggle('hidden');
}

function initControlCenter() {
  document.addEventListener('click', (e) => {
    const cc = document.getElementById('control-center');
    if (!cc.classList.contains('hidden') && !cc.contains(e.target) && !e.target.closest('#control-center-btn')) {
      cc.classList.add('hidden');
    }
  });

  // Dark mode toggle
  document.getElementById('dark-mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const status = document.getElementById('dark-mode-status');
    status.textContent = document.body.classList.contains('dark-mode') ? 'On' : 'Off';
  });

  // Wi-Fi toggle
  const wifiTile = document.querySelector('.cc-tile:first-child');
  if (wifiTile) {
    wifiTile.addEventListener('click', () => {
      const icon = wifiTile.querySelector('.cc-tile-icon');
      icon.classList.toggle('wifi-active');
      const sub = wifiTile.querySelector('.cc-tile-sub');
      sub.textContent = icon.classList.contains('wifi-active') ? 'Home' : 'Off';
    });
  }
}

// ============================================
// Notifications
// ============================================
function showNotification(title, body) {
  const existing = document.getElementById('notification');
  if (existing) existing.remove();

  const notif = document.createElement('div');
  notif.id = 'notification';
  notif.innerHTML = `
    <div class="notif-icon">${Icons.finder}</div>
    <div class="notif-content">
      <div class="notif-title">${title}</div>
      <div class="notif-body">${body}</div>
    </div>
  `;
  document.getElementById('desktop').appendChild(notif);

  setTimeout(() => {
    notif.classList.add('hide');
    setTimeout(() => notif.remove(), 300);
  }, 3500);
}

// ============================================
// Keyboard Shortcuts
// ============================================
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Cmd+Space - Spotlight
    if (e.metaKey && e.code === 'Space') {
      e.preventDefault();
      const spotlight = document.getElementById('spotlight');
      if (spotlight.classList.contains('hidden')) {
        showSpotlight();
      } else {
        hideSpotlight();
      }
    }

    // Cmd+W - Close window
    if (e.metaKey && e.key === 'w' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      if (WindowManager.activeWindow) {
        WindowManager.closeWindow(WindowManager.activeWindow.id);
      }
    }

    // Cmd+M - Minimize window
    if (e.metaKey && e.key === 'm' && !e.target.matches('input, textarea')) {
      e.preventDefault();
      if (WindowManager.activeWindow) {
        WindowManager.minimizeWindow(WindowManager.activeWindow.id);
      }
    }

    // Escape - Close overlays
    if (e.key === 'Escape') {
      hideSpotlight();
      hideLaunchpad();
      hideContextMenu();
      document.getElementById('control-center').classList.add('hidden');
    }

    // F4 or trackpad gesture - Launchpad
    if (e.key === 'F4') {
      e.preventDefault();
      const launchpad = document.getElementById('launchpad');
      if (launchpad.classList.contains('hidden')) {
        showLaunchpad();
      } else {
        hideLaunchpad();
      }
    }
  });
}

// ============================================
// Desktop Interactions
// ============================================
function initDesktop() {
  // Desktop click - deselect
  document.getElementById('desktop-area').addEventListener('click', (e) => {
    if (e.target.id === 'desktop-area' || e.target.id === 'desktop-icons') {
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      document.getElementById('active-app-name').textContent = 'Finder';
    }
  });

  // Desktop icon selection
  document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
      icon.classList.add('selected');
    });

    icon.addEventListener('dblclick', () => {
      if (icon.dataset.drive === 'true') {
        WindowManager.openApp('finder');
      }
    });
  });
}

// ============================================
// Boot Screen
// ============================================
function initBootScreen() {
  setTimeout(() => {
    const boot = document.getElementById('boot-screen');
    boot.classList.add('fade-out');
    document.getElementById('desktop').classList.remove('hidden');

    setTimeout(() => {
      boot.style.display = 'none';
      // Open Finder by default
      WindowManager.openApp('finder');
    }, 800);
  }, 2800);
}

// ============================================
// Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initBootScreen();
  initDock();
  initMenuBar();
  initSpotlight();
  initLaunchpad();
  initContextMenu();
  initControlCenter();
  initKeyboardShortcuts();
  initDesktop();

  // Welcome notification
  setTimeout(() => {
    showNotification('Welcome to macOS', 'Press Cmd+Space for Spotlight, or click the Launchpad icon in the Dock.');
  }, 3500);
});
