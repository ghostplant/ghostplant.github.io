/* ============================================
   App Definitions & Content
   ============================================ */

const AppDefinitions = {
  finder: {
    name: 'Finder',
    icon: 'finder',
    width: 720,
    height: 480,
    resizable: true,
    content: function() {
      return `
        <div class="finder">
          <div class="finder-sidebar">
            <div class="finder-sidebar-section">
              <div class="finder-sidebar-header">Favorites</div>
              <div class="finder-sidebar-item active" data-folder="Desktop">${Icons.sidebar_desktop} Desktop</div>
              <div class="finder-sidebar-item" data-folder="Documents">${Icons.sidebar_documents} Documents</div>
              <div class="finder-sidebar-item" data-folder="Downloads">${Icons.sidebar_downloads} Downloads</div>
              <div class="finder-sidebar-item" data-folder="Applications">${Icons.sidebar_applications} Applications</div>
            </div>
            <div class="finder-sidebar-section">
              <div class="finder-sidebar-header">iCloud</div>
              <div class="finder-sidebar-item" data-folder="iCloud">${Icons.sidebar_icloud} iCloud Drive</div>
            </div>
            <div class="finder-sidebar-section">
              <div class="finder-sidebar-header">Locations</div>
              <div class="finder-sidebar-item" data-folder="Macintosh HD">${Icons.sidebar_desktop} Macintosh HD</div>
              <div class="finder-sidebar-item" data-folder="Trash">${Icons.sidebar_trash} Trash</div>
            </div>
          </div>
          <div class="finder-main">
            <div class="finder-toolbar">
              <button class="finder-nav-btn" data-action="back">‹</button>
              <button class="finder-nav-btn" data-action="forward">›</button>
              <div class="finder-title">Desktop</div>
            </div>
            <div class="finder-content">
              <div class="finder-grid" id="finder-grid"></div>
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const folders = {
        'Desktop': [
          { name: 'Screenshot.png', icon: 'imagefile' },
          { name: 'Notes.txt', icon: 'file' },
          { name: 'Project', icon: 'folder' },
        ],
        'Documents': [
          { name: 'Resume.pdf', icon: 'file' },
          { name: 'Budget.xlsx', icon: 'file' },
          { name: 'Letter.docx', icon: 'file' },
          { name: 'Projects', icon: 'folder' },
          { name: 'Personal', icon: 'folder' },
        ],
        'Downloads': [
          { name: 'macOS_Sequoia.dmg', icon: 'file' },
          { name: 'photo.jpg', icon: 'imagefile' },
          { name: 'music.mp3', icon: 'file' },
          { name: 'archive.zip', icon: 'file' },
        ],
        'Applications': [
          { name: 'Safari', icon: 'safari' },
          { name: 'Mail', icon: 'mail' },
          { name: 'Notes', icon: 'notes' },
          { name: 'Calculator', icon: 'calculator' },
          { name: 'Terminal', icon: 'terminal' },
          { name: 'Calendar', icon: 'calendar' },
          { name: 'Photos', icon: 'photos' },
          { name: 'Music', icon: 'music' },
          { name: 'Messages', icon: 'messages' },
          { name: 'Maps', icon: 'maps' },
          { name: 'System Settings', icon: 'settings' },
          { name: 'App Store', icon: 'appstore' },
        ],
        'iCloud': [
          { name: 'iCloud Documents', icon: 'folder' },
          { name: 'iCloud Photos', icon: 'folder' },
          { name: 'iCloud Backup', icon: 'folder' },
        ],
        'Macintosh HD': [
          { name: 'Applications', icon: 'folder' },
          { name: 'Library', icon: 'folder' },
          { name: 'System', icon: 'folder' },
          { name: 'Users', icon: 'folder' },
        ],
        'Trash': [],
      };

      const grid = win.querySelector('#finder-grid');
      const titleEl = win.querySelector('.finder-title');
      const items = win.querySelectorAll('.finder-sidebar-item');

      function renderFolder(folderName) {
        titleEl.textContent = folderName;
        const items = folders[folderName] || [];
        grid.innerHTML = items.map(item => `
          <div class="finder-item" data-name="${item.name}">
            ${Icons[item.icon] || Icons.file}
            <div class="finder-item-name">${item.name}</div>
          </div>
        `).join('') || '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">This folder is empty</div>';

        grid.querySelectorAll('.finder-item').forEach(el => {
          el.addEventListener('click', (e) => {
            grid.querySelectorAll('.finder-item').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
          });
          el.addEventListener('dblclick', (e) => {
            const name = el.dataset.name;
            const item = folders[folderName].find(f => f.name === name);
            if (item && item.icon === 'folder' && folders[name]) {
              renderFolder(name);
            } else if (item && item.icon === 'appfile') {
              WindowManager.openApp(name.toLowerCase().replace(/\s/g, ''));
            }
          });
        });
      }

      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          renderFolder(item.dataset.folder);
        });
      });

      renderFolder('Desktop');
    }
  },

  safari: {
    name: 'Safari',
    icon: 'safari',
    width: 800,
    height: 560,
    resizable: true,
    content: function() {
      return `
        <div class="safari">
          <div class="safari-toolbar">
            <button class="safari-nav-btn" data-action="back">‹</button>
            <button class="safari-nav-btn" data-action="forward">›</button>
            <button class="safari-nav-btn" data-action="reload">⟳</button>
            <div class="safari-address-bar">
              <span style="color:#888;font-size:13px;">🔒</span>
              <input type="text" placeholder="Search or enter website name" value="Start Page" id="safari-url">
            </div>
            <button class="safari-nav-btn" data-action="share">⤴</button>
            <button class="safari-nav-btn" data-action="tabs">▢</button>
          </div>
          <div class="safari-content" id="safari-content">
            <div class="safari-startpage">
              <h1>Start Page</h1>
              <div class="safari-favorites">
                <div class="safari-fav" data-url="apple.com">
                  <div class="safari-fav-icon" style="background:#000;">🍎</div>
                  <div class="safari-fav-name">Apple</div>
                </div>
                <div class="safari-fav" data-url="google.com">
                  <div class="safari-fav-icon" style="background:#4285f4;">G</div>
                  <div class="safari-fav-name">Google</div>
                </div>
                <div class="safari-fav" data-url="youtube.com">
                  <div class="safari-fav-icon" style="background:#ff0000;">▶</div>
                  <div class="safari-fav-name">YouTube</div>
                </div>
                <div class="safari-fav" data-url="github.com">
                  <div class="safari-fav-icon" style="background:#24292e;">⌥</div>
                  <div class="safari-fav-name">GitHub</div>
                </div>
                <div class="safari-fav" data-url="wikipedia.org">
                  <div class="safari-fav-icon" style="background:#000;">W</div>
                  <div class="safari-fav-name">Wikipedia</div>
                </div>
                <div class="safari-fav" data-url="twitter.com">
                  <div class="safari-fav-icon" style="background:#1da1f2;">𝕏</div>
                  <div class="safari-fav-name">X</div>
                </div>
                <div class="safari-fav" data-url="reddit.com">
                  <div class="safari-fav-icon" style="background:#ff4500;">🤖</div>
                  <div class="safari-fav-name">Reddit</div>
                </div>
                <div class="safari-fav" data-url="amazon.com">
                  <div class="safari-fav-icon" style="background:#ff9900;">a</div>
                  <div class="safari-fav-name">Amazon</div>
                </div>
              </div>
              <p style="margin-top:30px;color:#888;font-size:13px;">This is a simulated browser. Click favorites to see a placeholder page.</p>
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const content = win.querySelector('#safari-content');
      const urlInput = win.querySelector('#safari-url');
      win.querySelectorAll('.safari-fav').forEach(fav => {
        fav.addEventListener('click', () => {
          const url = fav.dataset.url;
          urlInput.value = url;
          content.innerHTML = `
            <div style="padding:40px;text-align:center;">
              <h1 style="font-size:28px;margin-bottom:16px;">${url}</h1>
              <p style="color:#666;margin-bottom:20px;">This is a simulated page for ${url}</p>
              <div style="max-width:500px;margin:0 auto;text-align:left;background:#fff;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <h2>Welcome to ${url}</h2>
                <p style="color:#666;margin-top:10px;">This is a demo page within the macOS desktop simulation. The browser is not connected to the internet.</p>
                <p style="color:#666;margin-top:10px;">In a real browser, you would see the actual content of ${url}.</p>
              </div>
            </div>
          `;
        });
      });
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const url = urlInput.value;
          content.innerHTML = `
            <div style="padding:40px;text-align:center;">
              <h1 style="font-size:28px;margin-bottom:16px;">${url}</h1>
              <p style="color:#666;">Simulated page for ${url}</p>
            </div>
          `;
        }
      });
    }
  },

  mail: {
    name: 'Mail',
    icon: 'mail',
    width: 760,
    height: 500,
    resizable: true,
    content: function() {
      return `
        <div style="display:flex;height:100%;">
          <div style="width:160px;background:rgba(230,230,238,0.6);backdrop-filter:blur(20px);padding:38px 0 10px 0;overflow-y:auto;flex-shrink:0;border-right:0.5px solid rgba(0,0,0,0.08);">
            <div style="font-size:11px;font-weight:700;color:#888;padding:4px 14px;text-transform:uppercase;">Mailboxes</div>
            <div class="mail-folder active" data-folder="inbox" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;background:rgba(0,122,255,0.15);">Inbox <span style="margin-left:auto;font-size:11px;color:#007aff;font-weight:600;">3</span></div>
            <div class="mail-folder" data-folder="sent" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;">Sent</div>
            <div class="mail-folder" data-folder="drafts" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;">Drafts</div>
            <div class="mail-folder" data-folder="trash" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;">Trash</div>
            <div class="mail-folder" data-folder="junk" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;">Junk</div>
            <div class="mail-folder" data-folder="flagged" style="display:flex;align-items:center;gap:8px;padding:5px 14px;font-size:13px;cursor:default;border-radius:6px;margin:1px 6px;">Flagged</div>
          </div>
          <div style="width:240px;background:rgba(240,240,245,0.5);border-right:0.5px solid rgba(0,0,0,0.08);overflow-y:auto;flex-shrink:0;" id="mail-list"></div>
          <div style="flex:1;background:rgba(255,255,255,0.7);overflow-y:auto;padding:20px;" id="mail-preview"></div>
        </div>
      `;
    },
    onOpen: function(win) {
      const emails = {
        inbox: [
          { id: 1, from: 'Apple', fromColor: '#555', subject: 'Welcome to your new Mac', date: '10:30 AM', preview: 'Discover what your Mac can do...', body: '<h2>Welcome to your new Mac!</h2><p>Thank you for choosing Mac. We hope you enjoy your new computer.</p><p>Here are some tips to get started:</p><ul><li>Set up your Apple ID</li><li>Explore the Dock</li><li>Try Spotlight Search (Cmd+Space)</li><li>Customize your Desktop</li></ul><p>Enjoy your new Mac!</p>' },
          { id: 2, from: 'GitHub', fromColor: '#24292e', subject: 'New activity on your repository', date: '9:15 AM', preview: 'A new pull request was opened...', body: '<h2>New Pull Request</h2><p><strong>user/project</strong></p><p>A new pull request was opened in your repository.</p><p><strong>Title:</strong> Add dark mode support</p><p><strong>Description:</strong> This PR adds dark mode support to the settings page.</p>' },
          { id: 3, from: 'LinkedIn', fromColor: '#0a66c2', subject: 'You have 3 new connection requests', date: 'Yesterday', preview: '3 people want to connect with you...', body: '<h2>New Connection Requests</h2><p>You have 3 new connection requests:</p><ul><li><strong>Jane Smith</strong> - Software Engineer at Tech Co</li><li><strong>John Doe</strong> - Product Designer at Design Inc</li><li><strong>Alice Wang</strong> - Data Scientist at Data Corp</li></ul>' },
          { id: 4, from: 'Amazon', fromColor: '#ff9900', subject: 'Your order has shipped', date: 'Yesterday', preview: 'Track your package...', body: '<h2>Your order has shipped!</h2><p>Your order #12345 has been shipped.</p><p><strong>Tracking Number:</strong> 1Z999AA10123456784</p><p><strong>Estimated Delivery:</strong> 3-5 business days</p>' },
          { id: 5, from: 'Medium', fromColor: '#000', subject: 'Top stories for you this week', date: 'Mon', preview: 'The best articles curated for you...', body: '<h2>Top Stories This Week</h2><p>Here are the top stories curated just for you:</p><ul><li>How to Build a macOS Desktop Simulation in HTML</li><li>10 CSS Tips for Better UI Design</li><li>The Future of Web Development</li></ul>' },
        ],
        sent: [
          { id: 6, from: 'To: Jane', fromColor: '#ff6b6b', subject: 'Re: Project Update', date: '10:00 AM', preview: 'Thanks for the update...', body: '<h2>Re: Project Update</h2><p>Thanks for the update, Jane! The project looks great.</p><p>Let me know if you need any help.</p>' },
          { id: 7, from: 'To: Team', fromColor: '#48dbfb', subject: 'Meeting Tomorrow', date: 'Yesterday', preview: 'Hi team, just a reminder...', body: '<h2>Meeting Tomorrow</h2><p>Hi team, just a reminder that we have a meeting tomorrow at 10 AM.</p><p>Please review the agenda beforehand.</p>' },
        ],
        drafts: [
          { id: 8, from: 'Draft', fromColor: '#888', subject: 'Vacation Request', date: '', preview: 'Dear Manager, I would like to request...', body: '<h2>Vacation Request</h2><p>Dear Manager, I would like to request vacation time from...</p><p><em>This is a draft.</em></p>' },
        ],
        trash: [],
        junk: [
          { id: 9, from: 'Winner', fromColor: '#ff0000', subject: 'You won!', date: 'Last week', preview: 'Congratulations! You have won...', body: '<h2>You won!</h2><p>Congratulations! You have won a prize.</p><p><em>This message was flagged as junk.</em></p>' },
        ],
        flagged: [
          { id: 1, from: 'Apple', fromColor: '#555', subject: 'Welcome to your new Mac', date: '10:30 AM', preview: 'Discover what your Mac can do...', body: '<h2>Welcome to your new Mac!</h2><p>Thank you for choosing Mac.</p>' },
        ],
      };

      const listEl = win.querySelector('#mail-list');
      const previewEl = win.querySelector('#mail-preview');
      const folders = win.querySelectorAll('.mail-folder');
      let currentFolder = 'inbox';
      let currentEmail = emails.inbox[0];

      function renderList() {
        const items = emails[currentFolder] || [];
        if (items.length === 0) {
          listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#888;font-size:13px;">No messages</div>';
          return;
        }
        listEl.innerHTML = items.map(email => `
          <div class="mail-item" data-id="${email.id}" style="padding:12px 14px;border-bottom:0.5px solid rgba(0,0,0,0.06);cursor:default;${currentEmail && currentEmail.id === email.id ? 'background:rgba(0,122,255,0.1);' : ''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${email.from}</div>
              <div style="font-size:11px;color:#888;">${email.date}</div>
            </div>
            <div style="font-size:12px;font-weight:500;color:#1a1a1a;margin-bottom:2px;">${email.subject}</div>
            <div style="font-size:11px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${email.preview}</div>
          </div>
        `).join('');

        listEl.querySelectorAll('.mail-item').forEach(item => {
          item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            currentEmail = items.find(e => e.id === id);
            renderList();
            renderPreview();
          });
        });
      }

      function renderPreview() {
        if (!currentEmail) {
          previewEl.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">Select a message to preview</div>';
          return;
        }
        previewEl.innerHTML = `
          <div style="border-bottom:0.5px solid rgba(0,0,0,0.1);padding-bottom:16px;margin-bottom:16px;">
            <h2 style="font-size:20px;font-weight:600;margin-bottom:8px;color:#1a1a1a;">${currentEmail.subject}</h2>
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:${currentEmail.fromColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;">${currentEmail.from.charAt(0)}</div>
              <div>
                <div style="font-size:13px;font-weight:600;color:#1a1a1a;">${currentEmail.from}</div>
                <div style="font-size:11px;color:#888;">${currentEmail.date}</div>
              </div>
            </div>
          </div>
          <div style="font-size:14px;line-height:1.6;color:#1a1a1a;">${currentEmail.body}</div>
        `;
      }

      folders.forEach(folder => {
        folder.addEventListener('click', () => {
          folders.forEach(f => { f.style.background = ''; f.classList.remove('active'); });
          folder.style.background = 'rgba(0,122,255,0.15)';
          folder.classList.add('active');
          currentFolder = folder.dataset.folder;
          currentEmail = (emails[currentFolder] || [])[0];
          renderList();
          renderPreview();
        });
      });

      renderList();
      renderPreview();
    }
  },


  notes: {
    name: 'Notes',
    icon: 'notes',
    width: 600,
    height: 420,
    resizable: true,
    content: function() {
      return `
        <div class="notes">
          <div class="notes-sidebar">
            <div class="notes-sidebar-header">
              <button class="notes-btn" id="notes-new" title="New Note">✎</button>
              <button class="notes-btn" id="notes-delete" title="Delete">🗑</button>
            </div>
            <div class="notes-list" id="notes-list"></div>
          </div>
          <div class="notes-editor">
            <div class="notes-editor-header" id="notes-date"></div>
            <textarea id="notes-textarea" placeholder="Start writing..." style="font-family: inherit;"></textarea>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      let notes = [
        { id: 1, title: 'Welcome to Notes', content: 'Welcome to Notes!\n\nThis is a simulated notes app. You can:\n- Create new notes with the ✎ button\n- Delete notes with the 🗑 button\n- Edit notes in the editor\n\nEnjoy!' },
        { id: 2, title: 'Shopping List', content: 'Shopping List\n\n- Milk\n- Eggs\n- Bread\n- Coffee\n- Apples' },
        { id: 3, title: 'Ideas', content: 'Project Ideas\n\n1. Build a macOS desktop simulation\n2. Learn a new programming language\n3. Start a blog' },
      ];
      let activeNoteId = 1;

      const listEl = win.querySelector('#notes-list');
      const textarea = win.querySelector('#notes-textarea');
      const dateEl = win.querySelector('#notes-date');

      function renderList() {
        listEl.innerHTML = notes.map(note => `
          <div class="notes-list-item ${note.id === activeNoteId ? 'active' : ''}" data-id="${note.id}">
            <div class="notes-list-title">${note.title || 'New Note'}</div>
            <div class="notes-list-preview">${note.content.split('\n').slice(1).join(' ') || 'No additional text'}</div>
          </div>
        `).join('');

        listEl.querySelectorAll('.notes-list-item').forEach(el => {
          el.addEventListener('click', () => {
            activeNoteId = parseInt(el.dataset.id);
            renderList();
            renderEditor();
          });
        });
      }

      function renderEditor() {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          textarea.value = note.content;
          const now = new Date();
          dateEl.textContent = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
      }

      textarea.addEventListener('input', () => {
        const note = notes.find(n => n.id === activeNoteId);
        if (note) {
          note.content = textarea.value;
          note.title = note.content.split('\n')[0] || 'New Note';
          renderList();
        }
      });

      win.querySelector('#notes-new').addEventListener('click', () => {
        const newNote = { id: Date.now(), title: 'New Note', content: '' };
        notes.unshift(newNote);
        activeNoteId = newNote.id;
        renderList();
        renderEditor();
        textarea.focus();
      });

      win.querySelector('#notes-delete').addEventListener('click', () => {
        notes = notes.filter(n => n.id !== activeNoteId);
        if (notes.length > 0) {
          activeNoteId = notes[0].id;
        } else {
          const newNote = { id: Date.now(), title: 'New Note', content: '' };
          notes.push(newNote);
          activeNoteId = newNote.id;
        }
        renderList();
        renderEditor();
      });

      renderList();
      renderEditor();
    }
  },

  calculator: {
    name: 'Calculator',
    icon: 'calculator',
    width: 280,
    height: 420,
    resizable: false,
    content: function() {
      return `
        <div class="calculator">
          <div class="calc-display" id="calc-display">0</div>
          <div class="calc-buttons" id="calc-buttons">
            <button class="calc-btn fn" data-val="AC">AC</button>
            <button class="calc-btn fn" data-val="+/-">±</button>
            <button class="calc-btn fn" data-val="%">%</button>
            <button class="calc-btn op" data-val="/">÷</button>
            <button class="calc-btn" data-val="7">7</button>
            <button class="calc-btn" data-val="8">8</button>
            <button class="calc-btn" data-val="9">9</button>
            <button class="calc-btn op" data-val="*">×</button>
            <button class="calc-btn" data-val="4">4</button>
            <button class="calc-btn" data-val="5">5</button>
            <button class="calc-btn" data-val="6">6</button>
            <button class="calc-btn op" data-val="-">−</button>
            <button class="calc-btn" data-val="1">1</button>
            <button class="calc-btn" data-val="2">2</button>
            <button class="calc-btn" data-val="3">3</button>
            <button class="calc-btn op" data-val="+">+</button>
            <button class="calc-btn zero" data-val="0">0</button>
            <button class="calc-btn" data-val=".">.</button>
            <button class="calc-btn op" data-val="=">=</button>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const display = win.querySelector('#calc-display');
      const buttons = win.querySelector('#calc-buttons');
      let current = '0';
      let previous = null;
      let operation = null;
      let waitingForOperand = false;

      function updateDisplay() {
        let val = current;
        if (val.length > 9) {
          const num = parseFloat(val);
          if (Math.abs(num) > 999999999) {
            val = num.toExponential(4);
          } else {
            val = num.toPrecision(9);
          }
        }
        display.textContent = val;
      }

      function inputDigit(digit) {
        if (waitingForOperand) {
          current = digit;
          waitingForOperand = false;
        } else {
          current = current === '0' ? digit : current + digit;
        }
        updateDisplay();
      }

      function inputDot() {
        if (waitingForOperand) {
          current = '0.';
          waitingForOperand = false;
        } else if (current.indexOf('.') === -1) {
          current += '.';
        }
        updateDisplay();
      }

      function clearAll() {
        current = '0';
        previous = null;
        operation = null;
        waitingForOperand = false;
        updateDisplay();
      }

      function toggleSign() {
        current = (parseFloat(current) * -1).toString();
        updateDisplay();
      }

      function percent() {
        current = (parseFloat(current) / 100).toString();
        updateDisplay();
      }

      function performOperation(nextOp) {
        const inputValue = parseFloat(current);
        if (previous === null) {
          previous = inputValue;
        } else if (operation) {
          const result = calculate(previous, inputValue, operation);
          current = String(result);
          previous = result;
          updateDisplay();
        }
        waitingForOperand = true;
        operation = nextOp;

        buttons.querySelectorAll('.calc-btn.op').forEach(b => b.classList.remove('active'));
        if (nextOp !== '=') {
          buttons.querySelector(`[data-val="${nextOp}"]`).classList.add('active');
        }
      }

      function calculate(a, b, op) {
        switch (op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/': return b === 0 ? 'Error' : a / b;
          default: return b;
        }
      }

      buttons.addEventListener('click', (e) => {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;
        const val = btn.dataset.val;

        if (val >= '0' && val <= '9') {
          inputDigit(val);
        } else if (val === '.') {
          inputDot();
        } else if (val === 'AC') {
          clearAll();
        } else if (val === '+/-') {
          toggleSign();
        } else if (val === '%') {
          percent();
        } else if (['+', '-', '*', '/', '='].includes(val)) {
          performOperation(val);
        }
      });
    }
  },

  terminal: {
    name: 'Terminal',
    icon: 'terminal',
    width: 640,
    height: 400,
    resizable: true,
    content: function() {
      return `
        <div class="terminal" id="terminal">
          <div id="terminal-output"></div>
          <div class="terminal-input-line">
            <span class="terminal-prompt">user@MacBook</span><span class="terminal-prompt-path"> ~ %</span>&nbsp;
            <input type="text" class="terminal-input" id="terminal-input" autocomplete="off" spellcheck="false">
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const output = win.querySelector('#terminal-output');
      const input = win.querySelector('#terminal-input');
      const term = win.querySelector('#terminal');
      let history = [];
      let historyIndex = -1;

      const commands = {
        help: () => {
          return `<div class="terminal-output info">Available commands:
  help        - Show this help message
  ls          - List directory contents
  pwd         - Print working directory
  whoami      - Print current user
  date        - Show current date and time
  echo [text] - Print text
  clear       - Clear the terminal
  neofetch    - Show system information
  open [app]  - Open an application
  about       - About this Mac
  history     - Show command history
  cat [file]  - Display file contents
  uname       - Show system info
  uptime      - Show system uptime
  banner      - Show ASCII art banner</div>`;
        },
        ls: () => {
          return `<div class="terminal-output">Desktop    Documents  Downloads  Movies     Music
Pictures   Public     Applications  Library</div>`;
        },
        pwd: () => `<div class="terminal-output">/Users/user</div>`,
        whoami: () => `<div class="terminal-output">user</div>`,
        date: () => `<div class="terminal-output">${new Date().toString()}</div>`,
        clear: () => { output.innerHTML = ''; return null; },
        neofetch: () => {
          return `<div class="terminal-output info">
                    'c.          user@MacBook
                 ,xNMM.          ----------------
               .OMMMMo           OS: macOS Sequoia 15.0
               OMMM0,            Host: MacBook Pro
     .;loddo:' loolloddol;.      Kernel: 24.0.0
   cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: ${Math.floor(Math.random() * 24)} hours
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Packages: 128 (brew)
 XMMMMMMMMMMMMMMMMMMMMMMMX.      Shell: zsh 5.9
;MMMMMMMMMMMMMMMMMMMMMMMM:       Resolution: ${window.innerWidth}x${window.innerHeight}
:MMMMMMMMMMMMMMMMMMMMMMMM:       WM: Quartz Compositor
.MMMMMMMMMMMMMMMMMMMMMMMMX.      Terminal: Terminal.app
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.    CPU: Apple M3 Pro
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   Memory: 16384MiB
   .XMMMMMMMMMMMMMMMMMMMMMMMMK.</div>`;
        },
        about: () => `<div class="terminal-output info">macOS Sequoia 15.0\nMacBook Pro (16-inch, 2024)\nApple M3 Pro\n16 GB Memory</div>`,
        uname: () => `<div class="terminal-output">Darwin MacBook.local 24.0.0 Darwin Kernel Version 24.0.0</div>`,
        uptime: () => `<div class="terminal-output">${new Date().toLocaleTimeString()} up ${Math.floor(Math.random() * 23 + 1)} hrs, ${Math.floor(Math.random() * 59)} users</div>`,
        history: () => {
          return `<div class="terminal-output">${history.map((c, i) => `  ${i + 1}  ${c}`).join('\n')}</div>`;
        },
        banner: () => `<div class="terminal-output info">
  __  __     _   ___   ___ ___   ___
 |  \\/  |   /_\\ | _ ) / __| _ \\ / _ \\
 | |\\/| |  / _ \\| _ \\ \\__ \\   / (_) |
 |_|  |_| /_/ \\_\\___/ |___/_|_\\ \\___/</div>`,
        cat: (args) => {
          if (!args[0]) return `<div class="terminal-output error">cat: missing file operand</div>`;
          const files = {
            'README.md': '# macOS Desktop Simulation\nA web-based macOS desktop environment built with HTML, CSS, and JavaScript.',
            'hello.txt': 'Hello, World!',
            '.zshrc': 'export PATH=/usr/local/bin:$PATH\nalias ll="ls -la"',
          };
          if (files[args[0]]) return `<div class="terminal-output">${files[args[0]]}</div>`;
          return `<div class="terminal-output error">cat: ${args[0]}: No such file or directory</div>`;
        },
        echo: (args) => `<div class="terminal-output">${args.join(' ')}</div>`,
        open: (args) => {
          if (!args[0]) return `<div class="terminal-output error">open: missing application name</div>`;
          const appName = args[0].toLowerCase();
          if (AppDefinitions[appName]) {
            WindowManager.openApp(appName);
            return `<div class="terminal-output success">Opening ${args[0]}...</div>`;
          }
          return `<div class="terminal-output error">open: ${args[0]}: application not found</div>`;
        },
      };

      function printOutput(html) {
        if (html === null) return;
        output.innerHTML += html;
      }

      function executeCommand(cmd) {
        const parts = cmd.trim().split(/\s+/);
        const cmdName = parts[0].toLowerCase();
        const args = parts.slice(1);

        if (commands[cmdName]) {
          const result = commands[cmdName](args);
          printOutput(result);
        } else if (cmd.trim() === '') {
          // do nothing
        } else {
          printOutput(`<div class="terminal-output error">zsh: command not found: ${cmdName}</div>`);
        }
      }

      function printPrompt(cmd) {
        output.innerHTML += `<div class="terminal-line"><span class="terminal-prompt">user@MacBook</span><span class="terminal-prompt-path"> ~ %</span>&nbsp;${cmd}</div>`;
      }

      // Welcome message
      output.innerHTML = `<div class="terminal-output info">Last login: ${new Date().toString()} on ttys000
Welcome to macOS Terminal Simulation. Type 'help' for available commands.</div>`;

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value;
          printPrompt(cmd);
          if (cmd.trim()) {
            history.push(cmd);
            historyIndex = history.length;
          }
          executeCommand(cmd);
          input.value = '';
          term.scrollTop = term.scrollHeight;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (historyIndex > 0) {
            historyIndex--;
            input.value = history[historyIndex];
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            historyIndex++;
            input.value = history[historyIndex];
          } else {
            historyIndex = history.length;
            input.value = '';
          }
        }
      });

      term.addEventListener('click', () => input.focus());
      setTimeout(() => input.focus(), 100);
    }
  },

  calendar: {
    name: 'Calendar',
    icon: 'calendar',
    width: 640,
    height: 480,
    resizable: true,
    content: function() {
      return `
        <div class="calendar">
          <div class="calendar-header">
            <div class="calendar-nav">
              <button class="calendar-nav-btn" id="cal-prev">‹</button>
              <button class="calendar-nav-btn" id="cal-today">Today</button>
              <button class="calendar-nav-btn" id="cal-next">›</button>
            </div>
            <div class="calendar-title" id="cal-title"></div>
            <div style="width:100px;"></div>
          </div>
          <div class="calendar-grid" id="cal-grid"></div>
        </div>
      `;
    },
    onOpen: function(win) {
      let viewDate = new Date();
      const today = new Date();

      function render() {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        win.querySelector('#cal-title').textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const grid = win.querySelector('#cal-grid');
        let html = '';

        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(d => {
          html += `<div class="calendar-day-header">${d}</div>`;
        });

        for (let i = firstDay - 1; i >= 0; i--) {
          html += `<div class="calendar-day other-month">${daysInPrevMonth - i}</div>`;
        }

        for (let i = 1; i <= daysInMonth; i++) {
          const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          html += `<div class="calendar-day ${isToday ? 'today' : ''}">${i}</div>`;
        }

        const totalCells = firstDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;
        for (let i = 1; i <= remainingCells; i++) {
          html += `<div class="calendar-day other-month">${i}</div>`;
        }

        grid.innerHTML = html;
      }

      win.querySelector('#cal-prev').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        render();
      });
      win.querySelector('#cal-next').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        render();
      });
      win.querySelector('#cal-today').addEventListener('click', () => {
        viewDate = new Date();
        render();
      });

      render();
    }
  },

  settings: {
    name: 'System Settings',
    icon: 'settings',
    width: 700,
    height: 480,
    resizable: true,
    content: function() {
      return `
        <div class="settings">
          <div class="settings-sidebar">
            <input class="settings-search" placeholder="Search" type="text">
            <div class="settings-item active" data-panel="appearance">${Icons.settings} Appearance</div>
            <div class="settings-item" data-panel="wallpaper">${Icons.settings} Wallpaper</div>
            <div class="settings-item" data-panel="general">${Icons.settings} General</div>
            <div class="settings-item" data-panel="dock">${Icons.settings} Dock & Menu Bar</div>
            <div class="settings-item" data-panel="displays">${Icons.settings} Displays</div>
            <div class="settings-item" data-panel="sound">${Icons.settings} Sound</div>
            <div class="settings-item" data-panel="network">${Icons.settings} Network</div>
            <div class="settings-item" data-panel="bluetooth">${Icons.settings} Bluetooth</div>
            <div class="settings-item" data-panel="battery">${Icons.settings} Battery</div>
          </div>
          <div class="settings-main" id="settings-main"></div>
        </div>
      `;
    },
    onOpen: function(win) {
      const main = win.querySelector('#settings-main');
      const items = win.querySelectorAll('.settings-item');

      const panels = {
        appearance: `
          <h2>Appearance</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Dark Mode</div>
              <div class="toggle-switch on" data-setting="darkmode"></div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Accent Color</div>
              <div style="display:flex;gap:8px;">
                <div style="width:20px;height:20px;border-radius:50%;background:#007aff;cursor:default;border:2px solid #fff;box-shadow:0 0 0 1px #007aff;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#ff3b30;cursor:default;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#34c759;cursor:default;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#ff9500;cursor:default;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#5856d6;cursor:default;"></div>
              </div>
            </div>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Show scroll bars</div>
              <div style="font-size:13px;color:#888;">Automatic</div>
            </div>
          </div>
        `,
        wallpaper: `
          <h2>Wallpaper</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Current Wallpaper</div>
              <div style="width:120px;height:70px;border-radius:8px;background:linear-gradient(135deg, #0a0a2e, #6b2d8c, #e94560);"></div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px;">
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #0a0a2e, #6b2d8c, #e94560);cursor:default;"></div>
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #1a1a2e, #16213e);cursor:default;"></div>
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #667eea, #764ba2);cursor:default;"></div>
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #f093fb, #f5576c);cursor:default;"></div>
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #4facfe, #00f2fe);cursor:default;"></div>
            <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg, #43e97b, #38f9d7);cursor:default;"></div>
          </div>
        `,
        general: `
          <h2>General</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">About</div>
              <div style="font-size:13px;color:#888;">MacBook Pro</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Software Update</div>
              <div style="font-size:13px;color:#888;">Up to date</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Storage</div>
              <div style="font-size:13px;color:#888;">256 GB available</div>
            </div>
          </div>
        `,
        dock: `
          <h2>Dock & Menu Bar</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Magnification</div>
              <div class="toggle-switch on" data-setting="magnification"></div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Automatically hide and show the Dock</div>
              <div class="toggle-switch" data-setting="autohide"></div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Position on screen</div>
              <div style="font-size:13px;color:#888;">Bottom</div>
            </div>
          </div>
        `,
        displays: `
          <h2>Displays</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Resolution</div>
              <div style="font-size:13px;color:#888;">Default for display</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">True Tone</div>
              <div class="toggle-switch on" data-setting="truetone"></div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Night Shift</div>
              <div class="toggle-switch" data-setting="nightshift"></div>
            </div>
          </div>
        `,
        sound: `
          <h2>Sound</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Output volume</div>
              <div style="width:200px;height:22px;background:rgba(0,0,0,0.1);border-radius:11px;position:relative;">
                <div style="width:60%;height:100%;background:rgba(0,0,0,0.2);border-radius:11px;"></div>
                <div style="position:absolute;top:50%;left:60%;transform:translate(-50%,-50%);width:18px;height:18px;background:#fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
              </div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Mute</div>
              <div class="toggle-switch" data-setting="mute"></div>
            </div>
          </div>
        `,
        network: `
          <h2>Network</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Wi-Fi</div>
              <div style="font-size:13px;color:#007aff;">Connected</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Network Name</div>
              <div style="font-size:13px;color:#888;">Home_Network_5G</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">IP Address</div>
              <div style="font-size:13px;color:#888;">192.168.1.42</div>
            </div>
          </div>
        `,
        bluetooth: `
          <h2>Bluetooth</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Bluetooth</div>
              <div class="toggle-switch on" data-setting="bluetooth"></div>
            </div>
          </div>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">AirPods Pro</div>
              <div style="font-size:13px;color:#888;">Connected</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Magic Mouse</div>
              <div style="font-size:13px;color:#888;">Connected</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Magic Keyboard</div>
              <div style="font-size:13px;color:#888;">Connected</div>
            </div>
          </div>
        `,
        battery: `
          <h2>Battery</h2>
          <div class="settings-group">
            <div class="settings-row">
              <div class="settings-row-label">Battery Level</div>
              <div style="font-size:13px;color:#888;">87%</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Power Source</div>
              <div style="font-size:13px;color:#888;">Battery</div>
            </div>
            <div class="settings-row">
              <div class="settings-row-label">Low Power Mode</div>
              <div class="toggle-switch" data-setting="lowpower"></div>
            </div>
          </div>
          <div style="margin-top:16px;padding:16px;background:rgba(0,122,255,0.1);border-radius:10px;">
            <div style="font-size:13px;color:#007aff;font-weight:600;">💡 Tip</div>
            <div style="font-size:12px;color:#555;margin-top:4px;">Your battery is performing normally.</div>
          </div>
        `,
      };

      function showPanel(name) {
        main.innerHTML = panels[name] || '<h2>Settings</h2><p>Select a category from the sidebar.</p>';
        main.querySelectorAll('.toggle-switch').forEach(t => {
          t.addEventListener('click', () => {
            t.classList.toggle('on');
            if (t.dataset.setting === 'darkmode') {
              document.body.classList.toggle('dark-mode');
            }
          });
        });
      }

      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          showPanel(item.dataset.panel);
        });
      });

      showPanel('appearance');
    }
  },

  photos: {
    name: 'Photos',
    icon: 'photos',
    width: 640,
    height: 480,
    resizable: true,
    content: function() {
      const colors = [
        ['#ff6b6b', '#feca57'], ['#48dbfb', '#0abde3'], ['#1dd1a1', '#10ac84'],
        ['#ff9ff3', '#f368e0'], ['#54a0ff', '#2e86de'], ['#5f27cd', '#341f97'],
        ['#00d2d3', '#01a3a4'], ['#ff6348', '#ff4757'], ['#a55eea', '#8854d0'],
        ['#26de81', '#20bf6b'], ['#fd79a8', '#e84393'], ['#fdcb6e', '#e17055'],
        ['#6c5ce7', '#a29bfe'], ['#00b894', '#00cec9'], ['#e17055', '#fab1a0'],
        ['#74b9ff', '#0984e3'], ['#fd79a8', '#fdcb6e'], ['#6c5ce7', '#fd79a8'],
      ];
      const emojis = ['🌅', '🏔️', '🌊', '🌸', '🍂', '❄️', '🌺', '🌴', '🏖️', '🌊', '🌲', '🌻', '🦋', '🐝', '🐞', '🐦', '🦅', '🦉'];
      return `
        <div class="photos">
          <div class="photos-toolbar">
            <h2>Photos</h2>
            <span style="margin-left:auto;color:#888;font-size:13px;">${colors.length} Items</span>
          </div>
          <div class="photos-grid">
            ${colors.map((c, i) => `
              <div class="photos-item" style="background:linear-gradient(135deg, ${c[0]}, ${c[1]});">${emojis[i % emojis.length]}</div>
            `).join('')}
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      win.querySelectorAll('.photos-item').forEach(item => {
        item.addEventListener('click', () => {
          showNotification('Photos', 'Photo viewing is not available in this simulation.');
        });
      });
    }
  },

  music: {
    name: 'Music',
    icon: 'music',
    width: 580,
    height: 420,
    resizable: true,
    content: function() {
      return `
        <div class="music">
          <div class="music-main">
            <div class="music-album">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            </div>
            <div class="music-title">Midnight City</div>
            <div class="music-artist">M83</div>
            <div class="music-progress">
              <div class="music-progress-fill" id="music-progress"></div>
            </div>
            <div style="display:flex;justify-content:space-between;width:80%;font-size:11px;color:#888;">
              <span id="music-current">1:24</span>
              <span>3:56</span>
            </div>
            <div class="music-controls">
              <button class="music-btn">⏮</button>
              <button class="music-btn play" id="music-play">▶</button>
              <button class="music-btn">⏭</button>
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const playBtn = win.querySelector('#music-play');
      const progress = win.querySelector('#music-progress');
      const current = win.querySelector('#music-current');
      let playing = false;
      let progressVal = 35;
      let interval;

      playBtn.addEventListener('click', () => {
        playing = !playing;
        playBtn.textContent = playing ? '⏸' : '▶';
        if (playing) {
          interval = setInterval(() => {
            progressVal += 0.5;
            if (progressVal > 100) progressVal = 0;
            progress.style.width = progressVal + '%';
            const totalSec = 236;
            const curSec = Math.floor(totalSec * progressVal / 100);
            current.textContent = Math.floor(curSec / 60) + ':' + String(curSec % 60).padStart(2, '0');
          }, 500);
        } else {
          clearInterval(interval);
        }
      });
    }
  },

  messages: {
    name: 'Messages',
    icon: 'messages',
    width: 600,
    height: 440,
    resizable: true,
    content: function() {
      return `
        <div class="messages">
          <div class="messages-sidebar">
            <div class="messages-header">Messages</div>
            <div class="messages-item active" data-chat="1">
              <div class="messages-avatar" style="background:#ff6b6b;">A</div>
              <div class="messages-item-content">
                <div class="messages-item-name">Alice</div>
                <div class="messages-item-preview">Hey! How are you?</div>
              </div>
            </div>
            <div class="messages-item" data-chat="2">
              <div class="messages-avatar" style="background:#48dbfb;">B</div>
              <div class="messages-item-content">
                <div class="messages-item-name">Bob</div>
                <div class="messages-item-preview">See you tomorrow!</div>
              </div>
            </div>
            <div class="messages-item" data-chat="3">
              <div class="messages-avatar" style="background:#1dd1a1;">C</div>
              <div class="messages-item-content">
                <div class="messages-item-name">Charlie</div>
                <div class="messages-item-preview">Thanks for the help 🙏</div>
              </div>
            </div>
            <div class="messages-item" data-chat="4">
              <div class="messages-avatar" style="background:#a55eea;">D</div>
              <div class="messages-item-content">
                <div class="messages-item-name">Diana</div>
                <div class="messages-item-preview">Did you see the news?</div>
              </div>
            </div>
            <div class="messages-item" data-chat="5">
              <div class="messages-avatar" style="background:#fd79a8;">E</div>
              <div class="messages-item-content">
                <div class="messages-item-name">Eve</div>
                <div class="messages-item-preview">🎉🎉🎉</div>
              </div>
            </div>
          </div>
          <div class="messages-chat">
            <div class="messages-chat-header" id="msg-header">Alice</div>
            <div class="messages-chat-body" id="msg-body"></div>
            <div class="messages-chat-input">
              <input type="text" id="msg-input" placeholder="iMessage" autocomplete="off">
              <button class="music-btn" style="color:#007aff;width:30px;height:30px;">↑</button>
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const chats = {
        '1': { name: 'Alice', messages: [
          { text: 'Hey! How are you?', sent: false },
          { text: 'I am doing great! Just finished working on a project.', sent: true },
          { text: 'That sounds awesome! What kind of project?', sent: false },
          { text: 'A macOS desktop simulation in HTML/CSS/JS 😊', sent: true },
          { text: 'Wow, that sounds cool! Can\'t wait to see it!', sent: false },
        ]},
        '2': { name: 'Bob', messages: [
          { text: 'See you tomorrow!', sent: false },
          { text: 'Yes, looking forward to it!', sent: true },
        ]},
        '3': { name: 'Charlie', messages: [
          { text: 'Thanks for the help 🙏', sent: false },
          { text: 'No problem! Anytime!', sent: true },
        ]},
        '4': { name: 'Diana', messages: [
          { text: 'Did you see the news?', sent: false },
          { text: 'What news?', sent: true },
          { text: 'The new macOS was announced!', sent: false },
        ]},
        '5': { name: 'Eve', messages: [
          { text: '🎉🎉🎉', sent: false },
        ]},
      };

      const items = win.querySelectorAll('.messages-item');
      const header = win.querySelector('#msg-header');
      const body = win.querySelector('#msg-body');
      const input = win.querySelector('#msg-input');
      let activeChat = '1';

      function renderChat(chatId) {
        const chat = chats[chatId];
        header.textContent = chat.name;
        body.innerHTML = chat.messages.map(m =>
          `<div class="message-bubble ${m.sent ? 'sent' : 'received'}">${m.text}</div>`
        ).join('');
        body.scrollTop = body.scrollHeight;
      }

      items.forEach(item => {
        item.addEventListener('click', () => {
          items.forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          activeChat = item.dataset.chat;
          renderChat(activeChat);
        });
      });

      function sendMessage() {
        const text = input.value.trim();
        if (!text) return;
        chats[activeChat].messages.push({ text, sent: true });
        input.value = '';
        renderChat(activeChat);

        // Simulate a reply
        setTimeout(() => {
          const replies = ['Nice!', 'Cool! 😎', 'I see.', 'Tell me more!', 'Got it!', '👍', 'Haha!', 'Interesting...'];
          const reply = replies[Math.floor(Math.random() * replies.length)];
          chats[activeChat].messages.push({ text: reply, sent: false });
          renderChat(activeChat);
        }, 1000 + Math.random() * 2000);
      }

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
      win.querySelector('.messages-chat-input button').addEventListener('click', sendMessage);

      renderChat('1');
    }
  },

  maps: {
    name: 'Maps',
    icon: 'maps',
    width: 640,
    height: 480,
    resizable: true,
    content: function() {
      return `
        <div class="maps">
          <div class="maps-toolbar">
            <input class="maps-search" placeholder="Search Maps" type="text">
          </div>
          <div class="maps-canvas">
            <svg viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice">
              <rect width="640" height="440" fill="#e8f5e9"/>
              <!-- Water -->
              <path d="M0 300 Q100 280 200 290 L200 440 L0 440 Z" fill="#b3d9ff"/>
              <path d="M480 0 Q500 100 490 200 L640 200 L640 0 Z" fill="#b3d9ff"/>
              <!-- Roads -->
              <path d="M0 200 L640 200" stroke="#fff" stroke-width="6"/>
              <path d="M0 200 L640 200" stroke="#ccc" stroke-width="2" stroke-dasharray="4 4"/>
              <path d="M200 0 L200 440" stroke="#fff" stroke-width="6"/>
              <path d="M200 0 L200 440" stroke="#ccc" stroke-width="2" stroke-dasharray="4 4"/>
              <path d="M400 0 L400 300" stroke="#fff" stroke-width="4"/>
              <path d="M0 100 L480 100" stroke="#fff" stroke-width="4"/>
              <path d="M0 350 L640 350" stroke="#fff" stroke-width="4"/>
              <!-- Buildings -->
              <rect x="50" y="50" width="60" height="40" fill="#d4c5a9" rx="2"/>
              <rect x="120" y="40" width="50" height="50" fill="#c9b896" rx="2"/>
              <rect x="50" y="110" width="40" height="80" fill="#d4c5a9" rx="2"/>
              <rect x="100" y="110" width="80" height="80" fill="#c9b896" rx="2"/>
              <rect x="220" y="50" width="70" height="40" fill="#d4c5a9" rx="2"/>
              <rect x="300" y="50" width="80" height="40" fill="#c9b896" rx="2"/>
              <rect x="220" y="110" width="60" height="80" fill="#d4c5a9" rx="2"/>
              <rect x="290" y="110" width="90" height="80" fill="#c9b896" rx="2"/>
              <rect x="420" y="50" width="50" height="40" fill="#d4c5a9" rx="2"/>
              <rect x="220" y="210" width="80" height="130" fill="#c9b896" rx="2"/>
              <rect x="310" y="210" width="70" height="130" fill="#d4c5a9" rx="2"/>
              <rect x="420" y="210" width="50" height="80" fill="#c9b896" rx="2"/>
              <rect x="50" y="210" width="60" height="80" fill="#d4c5a9" rx="2"/>
              <rect x="120" y="210" width="60" height="80" fill="#c9b896" rx="2"/>
              <!-- Park -->
              <rect x="420" y="300" width="50" height="40" fill="#a5d6a7" rx="4"/>
              <text x="445" y="325" text-anchor="middle" font-size="8" fill="#558b2f">Park</text>
              <!-- Pin -->
              <g transform="translate(320 220)">
                <path d="M0 0 C-12 -12 -12 -28 0 -28 C12 -28 12 -12 0 0 Z" fill="#ff3b30"/>
                <circle cx="0" cy="-20" r="5" fill="#fff"/>
              </g>
              <text x="320" y="195" text-anchor="middle" font-size="10" fill="#333" font-weight="bold">You are here</text>
            </svg>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const search = win.querySelector('.maps-search');
      search.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && search.value.trim()) {
          showNotification('Maps', `Searching for "${search.value}"... (simulation)`);
        }
      });
    }
  },

  textedit: {
    name: 'TextEdit',
    icon: 'textedit',
    width: 560,
    height: 400,
    resizable: true,
    content: function() {
      return `
        <div class="textedit">
          <div class="textedit-toolbar">
            <button class="textedit-btn" data-cmd="bold" style="font-weight:bold;">B</button>
            <button class="textedit-btn" data-cmd="italic" style="font-style:italic;">I</button>
            <button class="textedit-btn" data-cmd="underline" style="text-decoration:underline;">U</button>
            <div style="width:1px;height:20px;background:rgba(0,0,0,0.1);margin:0 4px;"></div>
            <button class="textedit-btn" data-cmd="insertUnorderedList">• List</button>
            <button class="textedit-btn" data-cmd="insertOrderedList">1. List</button>
            <div style="width:1px;height:20px;background:rgba(0,0,0,0.1);margin:0 4px;"></div>
            <select class="textedit-btn" id="textedit-fontsize">
              <option value="2">Small</option>
              <option value="3" selected>Medium</option>
              <option value="5">Large</option>
              <option value="6">X-Large</option>
            </select>
          </div>
          <div class="textedit-area" contenteditable="true" id="textedit-area" data-placeholder="Start writing...">
            <h2>Welcome to TextEdit</h2>
            <p>This is a rich text editor. You can <b>bold</b>, <i>italicize</i>, and <u>underline</u> text.</p>
            <p>Try the formatting buttons above!</p>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      const area = win.querySelector('#textedit-area');
      win.querySelectorAll('.textedit-btn[data-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          area.focus();
          document.execCommand(btn.dataset.cmd, false, null);
          btn.classList.toggle('active');
        });
      });
      win.querySelector('#textedit-fontsize').addEventListener('change', (e) => {
        area.focus();
        document.execCommand('fontSize', false, e.target.value);
      });
    }
  },

  appstore: {
    name: 'App Store',
    icon: 'appstore',
    width: 720,
    height: 480,
    resizable: true,
    content: function() {
      return `
        <div class="appstore">
          <div class="appstore-sidebar">
            <div class="appstore-nav-item active">🔍 Discover</div>
            <div class="appstore-nav-item">🎮 Arcade</div>
            <div class="appstore-nav-item">🏗️ Create</div>
            <div class="appstore-nav-item">💼 Work</div>
            <div class="appstore-nav-item">🎮 Play</div>
            <div class="appstore-nav-item">📈 Categories</div>
            <div class="appstore-nav-item">⬇️ Updates</div>
          </div>
          <div class="appstore-main">
            <h2>Discover</h2>
            <div style="background:linear-gradient(135deg,#667eea,#764ba2);border-radius:12px;padding:24px;margin-bottom:20px;color:#fff;">
              <div style="font-size:12px;opacity:0.8;margin-bottom:4px;">APP OF THE DAY</div>
              <div style="font-size:24px;font-weight:700;margin-bottom:8px;">Pixelmator Pro</div>
              <div style="font-size:13px;opacity:0.9;margin-bottom:12px;">Professional image editor for everyone</div>
              <button style="padding:6px 20px;background:rgba(255,255,255,0.2);border:none;border-radius:14px;color:#fff;font-weight:600;cursor:default;">GET</button>
            </div>
            <h2 style="font-size:16px;">Top Free Apps</h2>
            <div class="appstore-grid">
              <div class="appstore-card">
                ${Icons.notes}<div class="appstore-card-name">Notes</div>
                <div class="appstore-card-desc">Capture your ideas</div>
                <button class="appstore-get-btn">GET</button>
              </div>
              <div class="appstore-card">
                ${Icons.music}<div class="appstore-card-name">Music</div>
                <div class="appstore-card-desc">Listen to music</div>
                <button class="appstore-get-btn">GET</button>
              </div>
              <div class="appstore-card">
                ${Icons.photos}<div class="appstore-card-name">Photos</div>
                <div class="appstore-card-desc">Manage your photos</div>
                <button class="appstore-get-btn">GET</button>
              </div>
              <div class="appstore-card">
                ${Icons.maps}<div class="appstore-card-name">Maps</div>
                <div class="appstore-card-desc">Explore the world</div>
                <button class="appstore-get-btn">GET</button>
              </div>
              <div class="appstore-card">
                ${Icons.weather}<div class="appstore-card-name">Weather</div>
                <div class="appstore-card-desc">Check the forecast</div>
                <button class="appstore-get-btn">GET</button>
              </div>
              <div class="appstore-card">
                ${Icons.messages}<div class="appstore-card-name">Messages</div>
                <div class="appstore-card-desc">Stay connected</div>
                <button class="appstore-get-btn">GET</button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {
      win.querySelectorAll('.appstore-get-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          btn.textContent = 'OPEN';
          showNotification('App Store', 'App installed successfully!');
        });
      });
      win.querySelectorAll('.appstore-nav-item').forEach(item => {
        item.addEventListener('click', () => {
          win.querySelectorAll('.appstore-nav-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        });
      });
    }
  },

  weather: {
    name: 'Weather',
    icon: 'weather',
    width: 420,
    height: 480,
    resizable: false,
    content: function() {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const temps = [72, 68, 75, 80, 73, 65, 70];
      const icons = ['☀️', '⛅', '☀️', '☀️', '⛅', '🌧️', '⛅'];
      return `
        <div class="weather">
          <div class="weather-city">Cupertino</div>
          <div class="weather-temp">72°</div>
          <div class="weather-cond">Sunny</div>
          <div class="weather-range">H:75° L:62°</div>
          <div class="weather-forecast">
            ${days.map((d, i) => `
              <div class="weather-day">
                <div>${d}</div>
                <div style="font-size:20px;">${icons[i]}</div>
                <div class="weather-day-temp">${temps[i]}°</div>
              </div>
            `).join('')}
          </div>
          <div style="margin-top:20px;background:rgba(255,255,255,0.15);border-radius:12px;padding:16px;backdrop-filter:blur(10px);width:100%;max-width:340px;">
            <div style="font-size:12px;opacity:0.8;margin-bottom:8px;">HOURLY FORECAST</div>
            <div style="display:flex;justify-content:space-between;">
              ${[0,1,2,3,4,5].map(i => {
                const h = (new Date().getHours() + i) % 24;
                return `<div style="text-align:center;font-size:11px;">
                  <div>${h}:00</div>
                  <div style="font-size:18px;margin:4px 0;">${['☀️','⛅','☀️','⛅','☀️','☀️'][i]}</div>
                  <div>${70 + i}°</div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    },
    onOpen: function(win) {}
  },

  about: {
    name: 'About This Mac',
    icon: 'finder',
    width: 400,
    height: 420,
    resizable: false,
    content: function() {
      return `
        <div class="about-mac">
          <svg class="about-mac-logo" viewBox="0 0 170 170"><path fill="#1a1a1a" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.618 13.415-3.702 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375-.119-1-.188-2.045-.188-3.139 0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.596 4.62-2.252 8.99-3.497 13.1-3.71.119 1.083.17 2.166.17 3.249z"/></svg>
          <h1>macOS Sequoia</h1>
          <h2>Version 15.0</h2>
          <div class="about-mac-info">
            <div><strong>MacBook Pro</strong></div>
            <div>16-inch, 2024</div>
            <br>
            <div><strong>Chip</strong></div>
            <div>Apple M3 Pro</div>
            <br>
            <div><strong>Memory</strong></div>
            <div>16 GB</div>
            <br>
            <div><strong>Startup disk</strong></div>
            <div>Macintosh HD</div>
            <br>
            <div><strong>Serial number</strong></div>
            <div>C02ABC1234</div>
          </div>
          <button style="margin-top:20px;padding:6px 20px;background:#007aff;color:#fff;border:none;border-radius:6px;cursor:default;font-size:13px;" onclick="WindowManager.openApp('settings')">More Info...</button>
        </div>
      `;
    },
    onOpen: function(win) {}
  },
};

// Dock apps list (order matters)
const DockApps = [
  'finder', 'safari', 'messages', 'mail', 'maps', 'photos',
  'notes', 'calendar', 'music', 'calculator', 'terminal',
  'textedit', 'appstore', 'weather', 'settings'
];
