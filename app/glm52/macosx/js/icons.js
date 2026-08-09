/* ============================================
   SVG Icon Definitions for macOS Apps
   ============================================ */

const Icons = {
  // Finder - the smiling face icon
  finder: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="finder-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#19a0e5"/>
        <stop offset="1" stop-color="#0d6cbf"/>
      </linearGradient>
      <linearGradient id="finder-left" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1eb6ff"/>
        <stop offset="1" stop-color="#0d7fd4"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#finder-bg)"/>
    <path d="M6 26 Q6 6 26 6 L50 6 L50 94 L26 94 Q6 94 6 74 Z" fill="url(#finder-left)" opacity="0.5"/>
    <path d="M50 6 L50 94" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    <path d="M50 14 L50 86" stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
    <!-- Left eye -->
    <ellipse cx="38" cy="38" rx="3.5" ry="6" fill="#1a1a1a"/>
    <ellipse cx="39" cy="36" rx="1" ry="1.5" fill="#fff"/>
    <!-- Right eye -->
    <ellipse cx="62" cy="38" rx="3.5" ry="6" fill="#1a1a1a"/>
    <ellipse cx="63" cy="36" rx="1" ry="1.5" fill="#fff"/>
    <!-- Smile -->
    <path d="M35 60 Q50 72 65 60" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </svg>`,

  // Safari - compass
  safari: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="safari-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f5f5f7"/>
        <stop offset="1" stop-color="#d8d8de"/>
      </linearGradient>
      <radialGradient id="safari-dial" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#e8f4ff"/>
        <stop offset="1" stop-color="#b8d8f5"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="url(#safari-bg)"/>
    <circle cx="50" cy="50" r="40" fill="#1a8fe3"/>
    <circle cx="50" cy="50" r="38" fill="url(#safari-dial)" opacity="0.3"/>
    <!-- Tick marks -->
    <g stroke="#fff" stroke-width="1.5" opacity="0.6">
      <line x1="50" y1="12" x2="50" y2="18"/>
      <line x1="50" y1="82" x2="50" y2="88"/>
      <line x1="12" y1="50" x2="18" y2="50"/>
      <line x1="82" y1="50" x2="88" y2="50"/>
    </g>
    <!-- Compass needle -->
    <polygon points="50,50 62,38 56,44" fill="#ff3b30"/>
    <polygon points="50,50 38,62 44,56" fill="#fff"/>
    <polygon points="50,50 62,38 56,44" fill="#ff3b30" opacity="0.9"/>
    <circle cx="50" cy="50" r="3" fill="#fff"/>
    <circle cx="50" cy="50" r="1.5" fill="#1a8fe3"/>
  </svg>`,

  // Mail
  mail: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mail-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#37c2ff"/>
        <stop offset="1" stop-color="#0a84ff"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#mail-bg)"/>
    <rect x="22" y="30" width="56" height="40" rx="4" fill="#fff"/>
    <path d="M22 34 L50 52 L78 34" stroke="#0a84ff" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Notes
  notes: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="notes-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff5b8"/>
        <stop offset="1" stop-color="#ffd84d"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#notes-bg)"/>
    <rect x="22" y="20" width="56" height="60" rx="4" fill="#fffef5"/>
    <rect x="22" y="20" width="56" height="8" fill="#e8c44d"/>
    <line x1="28" y1="38" x2="72" y2="38" stroke="#e0d090" stroke-width="1.5"/>
    <line x1="28" y1="48" x2="72" y2="48" stroke="#e0d090" stroke-width="1.5"/>
    <line x1="28" y1="58" x2="72" y2="58" stroke="#e0d090" stroke-width="1.5"/>
    <line x1="28" y1="68" x2="60" y2="68" stroke="#e0d090" stroke-width="1.5"/>
  </svg>`,

  // Calculator
  calculator: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calc-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3a3c"/>
        <stop offset="1" stop-color="#1c1c1e"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#calc-bg)"/>
    <rect x="20" y="18" width="60" height="20" rx="4" fill="#1c1c1e"/>
    <text x="74" y="33" text-anchor="end" fill="#fff" font-size="14" font-family="monospace" font-weight="300">0</text>
    <circle cx="28" cy="50" r="7" fill="#555"/>
    <circle cx="44" cy="50" r="7" fill="#555"/>
    <circle cx="60" cy="50" r="7" fill="#555"/>
    <circle cx="76" cy="50" r="7" fill="#ff9f0a"/>
    <circle cx="28" cy="66" r="7" fill="#333"/>
    <circle cx="44" cy="66" r="7" fill="#333"/>
    <circle cx="60" cy="66" r="7" fill="#333"/>
    <circle cx="76" cy="66" r="7" fill="#ff9f0a"/>
    <circle cx="28" cy="82" r="7" fill="#333"/>
    <circle cx="44" cy="82" r="7" fill="#333"/>
    <circle cx="60" cy="82" r="7" fill="#333"/>
    <circle cx="76" cy="82" r="7" fill="#ff9f0a"/>
  </svg>`,

  // Terminal
  terminal: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="term-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3a3a3c"/>
        <stop offset="1" stop-color="#1c1c1e"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#term-bg)"/>
    <rect x="18" y="22" width="64" height="56" rx="6" fill="#0a0a0a"/>
    <text x="26" y="44" fill="#4ec9b0" font-size="14" font-family="monospace" font-weight="bold">&gt;_</text>
    <rect x="44" y="36" width="2" height="12" fill="#4ec9b0">
      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
    </rect>
  </svg>`,

  // Calendar
  calendar: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cal-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#e8e8ed"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#cal-bg)"/>
    <rect x="6" y="6" width="88" height="24" rx="20" fill="#ff3b30"/>
    <rect x="6" y="18" width="88" height="12" fill="#ff3b30"/>
    <text x="50" y="68" text-anchor="middle" fill="#1a1a1a" font-size="36" font-weight="300" font-family="-apple-system, sans-serif" class="cal-day-num">17</text>
    <text x="50" y="20" text-anchor="middle" fill="#fff" font-size="10" font-weight="600" font-family="-apple-system, sans-serif" class="cal-month-text">JAN</text>
  </svg>`,

  // Photos
  photos: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="88" height="88" rx="20" fill="#fff"/>
    <g transform="translate(50 50)">
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#ff3b30" opacity="0.9"/>
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#ff9500" opacity="0.9" transform="rotate(60)"/>
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#ffcc00" opacity="0.9" transform="rotate(120)"/>
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#34c759" opacity="0.9" transform="rotate(180)"/>
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#00c7be" opacity="0.9" transform="rotate(240)"/>
      <ellipse cx="0" cy="-22" rx="8" ry="22" fill="#5856d6" opacity="0.9" transform="rotate(300)"/>
      <circle cx="0" cy="0" r="6" fill="#fff"/>
    </g>
  </svg>`,

  // Music
  music: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="music-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff6b6b"/>
        <stop offset="0.5" stop-color="#ee5a6f"/>
        <stop offset="1" stop-color="#c44569"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#music-bg)"/>
    <path d="M42 28 L70 22 L70 30 L42 36 Z" fill="#fff"/>
    <path d="M42 28 L42 64 Q42 70 36 70 Q30 70 30 64 Q30 58 36 58 Q39 58 42 60 L42 36 Z" fill="#fff"/>
    <path d="M70 22 L70 58 Q70 64 64 64 Q58 64 58 58 Q58 52 64 52 Q67 52 70 54 L70 30 Z" fill="#fff"/>
  </svg>`,

  // Messages
  messages: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="msg-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#5efc82"/>
        <stop offset="1" stop-color="#25d05a"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#msg-bg)"/>
    <path d="M28 30 Q28 24 34 24 L66 24 Q72 24 72 30 L72 54 Q72 60 66 60 L44 60 L34 68 L36 60 L34 60 Q28 60 28 54 Z" fill="#fff"/>
  </svg>`,

  // Maps
  maps: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="map-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e8f5e9"/>
        <stop offset="1" stop-color="#c8e6c9"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#map-bg)"/>
    <path d="M20 30 L40 24 L60 30 L80 24 L80 70 L60 76 L40 70 L20 76 Z" fill="#a5d6a7" stroke="#81c784" stroke-width="1"/>
    <line x1="40" y1="24" x2="40" y2="70" stroke="#90caf9" stroke-width="3"/>
    <line x1="60" y1="30" x2="60" y2="76" stroke="#90caf9" stroke-width="3"/>
    <path d="M30 50 Q50 45 70 50" stroke="#ff9800" stroke-width="2" fill="none" stroke-dasharray="3 2"/>
    <path d="M50 38 C44 38 40 42 40 48 C40 56 50 64 50 64 C50 64 60 56 60 48 C60 42 56 38 50 38 Z" fill="#ff3b30"/>
    <circle cx="50" cy="48" r="3" fill="#fff"/>
  </svg>`,

  // System Settings (gear)
  settings: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="set-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6e6e73"/>
        <stop offset="1" stop-color="#3a3a3c"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#set-bg)"/>
    <g transform="translate(50 50)">
      <g fill="#fff">
        <rect x="-4" y="-32" width="8" height="12" rx="2"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(45)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(90)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(135)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(180)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(225)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(270)"/>
        <rect x="-4" y="-32" width="8" height="12" rx="2" transform="rotate(315)"/>
      </g>
      <circle cx="0" cy="0" r="22" fill="#fff"/>
      <circle cx="0" cy="0" r="10" fill="url(#set-bg)"/>
    </g>
  </svg>`,

  // TextEdit
  textedit: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="te-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#e8e8ed"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#te-bg)"/>
    <rect x="24" y="18" width="52" height="64" rx="4" fill="#fff" stroke="#ccc" stroke-width="1"/>
    <line x1="32" y1="30" x2="68" y2="30" stroke="#ccc" stroke-width="1.5"/>
    <line x1="32" y1="38" x2="68" y2="38" stroke="#ccc" stroke-width="1.5"/>
    <line x1="32" y1="46" x2="68" y2="46" stroke="#ccc" stroke-width="1.5"/>
    <line x1="32" y1="54" x2="56" y2="54" stroke="#ccc" stroke-width="1.5"/>
    <path d="M60 60 L76 44 L80 48 L64 64 L56 64 L56 60 Z" fill="#ff9500" stroke="#cc7700" stroke-width="0.5"/>
  </svg>`,

  // App Store
  appstore: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="as-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2db8ff"/>
        <stop offset="1" stop-color="#0066cc"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#as-bg)"/>
    <path d="M35 62 L42 50 M65 62 L58 50 M50 38 L62 58 L38 58 Z" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="50" cy="38" r="3" fill="#fff"/>
    <line x1="38" y1="68" x2="62" y2="68" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  // Weather
  weather: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="w-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2196f3"/>
        <stop offset="1" stop-color="#0d47a1"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#w-bg)"/>
    <circle cx="38" cy="40" r="14" fill="#ffd54f"/>
    <path d="M30 60 Q30 50 40 50 Q44 44 52 46 Q60 42 64 50 Q72 50 72 60 Q72 68 64 68 L36 68 Q30 68 30 60 Z" fill="#fff" opacity="0.9"/>
  </svg>`,

  // Trash
  trash: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trash-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#e8e8ed"/>
        <stop offset="1" stop-color="#b0b0b8"/>
      </linearGradient>
    </defs>
    <path d="M30 30 L34 80 Q34 86 40 86 L60 86 Q66 86 66 80 L70 30 Z" fill="url(#trash-bg)" stroke="#888" stroke-width="1"/>
    <rect x="26" y="24" width="48" height="6" rx="2" fill="#a0a0a8"/>
    <rect x="42" y="18" width="16" height="6" rx="2" fill="#a0a0a8"/>
    <line x1="42" y1="38" x2="42" y2="76" stroke="#888" stroke-width="1.5" opacity="0.5"/>
    <line x1="50" y1="38" x2="50" y2="76" stroke="#888" stroke-width="1.5" opacity="0.5"/>
    <line x1="58" y1="38" x2="58" y2="76" stroke="#888" stroke-width="1.5" opacity="0.5"/>
  </svg>`,

  // Launchpad
  launchpad: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lp-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8e8e93"/>
        <stop offset="1" stop-color="#48484a"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#lp-bg)"/>
    <g fill="#fff" opacity="0.9">
      <rect x="24" y="24" width="16" height="16" rx="4"/>
      <rect x="42" y="24" width="16" height="16" rx="4"/>
      <rect x="60" y="24" width="16" height="16" rx="4"/>
      <rect x="24" y="42" width="16" height="16" rx="4"/>
      <rect x="42" y="42" width="16" height="16" rx="4"/>
      <rect x="60" y="42" width="16" height="16" rx="4"/>
      <rect x="24" y="60" width="16" height="16" rx="4"/>
      <rect x="42" y="60" width="16" height="16" rx="4"/>
      <rect x="60" y="60" width="16" height="16" rx="4"/>
    </g>
  </svg>`,

  // Folder icon (for Finder)
  folder: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="fld-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7bb8f0"/>
        <stop offset="1" stop-color="#4a90d9"/>
      </linearGradient>
    </defs>
    <path d="M14 28 Q14 22 20 22 L38 22 L44 28 L80 28 Q86 28 86 34 L86 74 Q86 80 80 80 L20 80 Q14 80 14 74 Z" fill="url(#fld-bg)"/>
    <path d="M14 34 L86 34 L86 74 Q86 80 80 80 L20 80 Q14 80 14 74 Z" fill="#5ba0e8" opacity="0.5"/>
  </svg>`,

  // File icon
  file: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 14 L60 14 L78 32 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 18 Q22 14 26 14 Z" fill="#fff" stroke="#ccc" stroke-width="1"/>
    <path d="M60 14 L78 32 L60 32 Z" fill="#e8e8ed"/>
    <line x1="30" y1="44" x2="70" y2="44" stroke="#ccc" stroke-width="1.5"/>
    <line x1="30" y1="54" x2="70" y2="54" stroke="#ccc" stroke-width="1.5"/>
    <line x1="30" y1="64" x2="70" y2="64" stroke="#ccc" stroke-width="1.5"/>
    <line x1="30" y1="74" x2="56" y2="74" stroke="#ccc" stroke-width="1.5"/>
  </svg>`,

  // Image file icon
  imagefile: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 14 L60 14 L78 32 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 18 Q22 14 26 14 Z" fill="#fff" stroke="#ccc" stroke-width="1"/>
    <path d="M60 14 L78 32 L60 32 Z" fill="#e8e8ed"/>
    <rect x="30" y="42" width="40" height="30" rx="2" fill="#e8f5e9" stroke="#81c784" stroke-width="1"/>
    <circle cx="38" cy="50" r="3" fill="#ffd54f"/>
    <path d="M32 68 L42 58 L50 64 L60 54 L68 62 L68 68 Z" fill="#66bb6a"/>
  </svg>`,

  // App file icon
  appfile: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M26 14 L60 14 L78 32 L78 86 Q78 90 74 90 L26 90 Q22 90 22 86 L22 18 Q22 14 26 14 Z" fill="#fff" stroke="#ccc" stroke-width="1"/>
    <path d="M60 14 L78 32 L60 32 Z" fill="#e8e8ed"/>
    <rect x="34" y="44" width="32" height="32" rx="6" fill="#007aff"/>
    <text x="50" y="66" text-anchor="middle" fill="#fff" font-size="18" font-weight="bold">A</text>
  </svg>`,

  // Sidebar icons
  sidebar_favorites: `<svg viewBox="0 0 16 16" fill="#3b82f6"><path d="M8 14s-5-3-5-7a3 3 0 016-1 3 3 0 016 1c0 4-5 7-5 7z" opacity="0.8"/><path d="M8 14s-5-3-5-7a3 3 0 016-1 3 3 0 016 1c0 4-5 7-5 7z"/></svg>`,
  sidebar_desktop: `<svg viewBox="0 0 16 16" fill="#6b7280"><rect x="1" y="2" width="14" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="4" y1="14" x2="12" y2="14" stroke="currentColor" stroke-width="1.2"/></svg>`,
  sidebar_documents: `<svg viewBox="0 0 16 16" fill="#3b82f6"><path d="M3 2 L10 2 L13 5 L13 14 L3 14 Z" fill="currentColor" opacity="0.8"/><path d="M10 2 L13 5 L10 5 Z" fill="#fff"/></svg>`,
  sidebar_downloads: `<svg viewBox="0 0 16 16" fill="#3b82f6"><path d="M8 1 L8 10 M4 7 L8 11 L12 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><line x1="2" y1="14" x2="14" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  sidebar_applications: `<svg viewBox="0 0 16 16" fill="#6b7280"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor"/><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor"/><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/></svg>`,
  sidebar_icloud: `<svg viewBox="0 0 16 16" fill="#3b82f6"><path d="M4 12 Q1 12 1 9 Q1 7 3 6.5 Q3 4 6 4 Q9 4 9 6 Q12 6 12 9 Q12 12 9 12 Z" fill="currentColor"/></svg>`,
  sidebar_trash: `<svg viewBox="0 0 16 16" fill="#6b7280"><path d="M3 4 L13 4 L12 14 Q12 15 11 15 L5 15 Q4 15 4 14 Z" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" stroke-width="1.2"/><line x1="6" y1="2" x2="10" y2="2" stroke="currentColor" stroke-width="1.2"/></svg>`,

  // Generic app icon
  generic: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gen-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#8e8e93"/>
        <stop offset="1" stop-color="#48484a"/>
      </linearGradient>
    </defs>
    <rect x="6" y="6" width="88" height="88" rx="20" fill="url(#gen-bg)"/>
    <text x="50" y="60" text-anchor="middle" fill="#fff" font-size="36" font-weight="bold">?</text>
  </svg>`,
};
