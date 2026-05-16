/**
 * auth-utils.js — Centralized authentication utilities for TIL USER CRM
 * Used by all portal pages (admin, teacher, student).
 */

// --- Global Theme Logic (Must be top level) ---
window.toggleTheme = function() {
    console.log('Theme toggle clicked');
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleUI(newTheme);
};

function updateThemeToggleUI(theme) {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
        btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    });
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleUI(savedTheme);
}

// API_URL — пустая строка = относительные URL (/api/...) — работает на любом хосте
const API_URL = '';

function getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
}

function getUserInfo() {
    return {
        id:    localStorage.getItem('user_id'),
        name:  localStorage.getItem('user_name'),
        email: localStorage.getItem('user_email'),
        role:  localStorage.getItem('user_role'),
    };
}

function logout() {
    localStorage.clear();
    // Determine path depth and redirect accordingly
    const path = window.location.pathname;
    if (path.includes('/admin/') || path.includes('/teacher/')) {
        window.location.href = '../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

/**
 * Auth guard — call at top of protected pages.
 * @param {string[]} allowedRoles - e.g. ['admin'] or ['teacher','admin']
 */
function authGuard(allowedRoles = []) {
    const token = localStorage.getItem('access_token');
    const role  = localStorage.getItem('user_role');

    if (!token) {
        logout();
        return false;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        // Redirect to correct portal
        if (role === 'admin')        window.location.href = '../admin/dashboard.html';
        else if (role === 'teacher') window.location.href = '../teacher/dashboard.html';
        else                         window.location.href = '../dashboard.html';
        return false;
    }
    return true;
}

// Auto-bind logout button on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Display user name in any element with class 'user-display-name'
    const nameEl = document.querySelector('.user-display-name');
    if (nameEl) {
        nameEl.textContent = localStorage.getItem('user_name') || '—';
    }

    // Auto-populate admin/user name in top bar
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) {
        adminNameEl.textContent = localStorage.getItem('user_name') || 'Admin';
    }

    // ── Auto-mark active sidebar link based on current URL ──
    autoMarkSidebarActive();

    updateChatBadge();
    initTheme();

    // Re-bind theme toggles dynamically
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.onclick = null;
        btn.addEventListener('click', toggleTheme);
    });

    // Mobile sidebar
    initSidebar();

    // Desktop sidebar collapse features
    initSidebarCollapse();
});

/**
 * Automatically marks the matching sidebar link as active
 * based on the current page's filename.
 */
function autoMarkSidebarActive() {
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const sidebarLinks = document.querySelectorAll('.sidebar a, .sidebar-nav a');

    sidebarLinks.forEach(link => {
        link.classList.remove('active');
        const linkFile = link.getAttribute('href')?.split('/').pop() || '';
        if (linkFile && linkFile === currentFile) {
            link.classList.add('active');
        }
    });
}

async function updateChatBadge() {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    if (!userId || !token) return;

    try {
        const res = await fetch(`${API_URL}/api/messages/unread/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const data = await res.json();
            const badges = document.querySelectorAll('.chat-badge');
            badges.forEach(b => {
                if (data.unread > 0) {
                    b.textContent = data.unread;
                    b.style.display = 'flex';
                } else {
                    b.style.display = 'none';
                }
            });
        }
    } catch (e) {}
}

// ── State helpers (loading / error / empty) ──
function showLoading(containerId, msg = "Загрузка...") {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="state-box"><div class="spinner"></div><div class="state-title">${msg}</div></div>`;
}
function showError(containerId, msg = "Ошибка загрузки", detail = "") {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="state-box"><div class="state-icon">⚠️</div><div class="state-title">${msg}</div>${detail ? `<div class="state-desc">${detail}</div>` : ""}</div>`;
}
function showEmpty(containerId, msg = "Нет данных", icon = "📭") {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="state-box"><div class="state-icon">${icon}</div><div class="state-title">${msg}</div></div>`;
}

// ── Sidebar collapse toggle (desktop) ──
function toggleSidebar() {
    const sb = document.getElementById('main-sidebar');
    if (!sb) return;
    const collapsed = sb.classList.toggle('collapsed');
    localStorage.setItem('sidebar-collapsed', collapsed);
}
window.toggleSidebar = toggleSidebar;

// ── Initialize sidebar collapse features ──
function initSidebarCollapse() {
    const sb = document.getElementById('main-sidebar') || document.querySelector('.sidebar');
    if (!sb) return;
    if (!sb.id) sb.id = 'main-sidebar';

    // Inject collapse toggle button
    if (!sb.querySelector('.sidebar-toggle-btn')) {
        const btn = document.createElement('button');
        btn.className = 'sidebar-toggle-btn';
        btn.innerHTML = '<span class="arrow">◀</span>';
        btn.title = 'Свернуть / развернуть';
        btn.addEventListener('click', function(e) { e.stopPropagation(); toggleSidebar(); });
        sb.appendChild(btn);
    }

    // Generate tooltip spans for each nav link
    sb.querySelectorAll('.sidebar-nav a').forEach(function(link) {
        if (link.querySelector('.nav-tooltip')) return;
        const txt = (link.title || link.textContent).replace(/[^\w\sа-яА-ЯёЁ\-]/g, '').trim();
        if (!txt) return;
        const tip = document.createElement('span');
        tip.className = 'nav-tooltip';
        tip.textContent = txt;
        link.appendChild(tip);
    });

    // Restore collapsed state from localStorage
    if (localStorage.getItem('sidebar-collapsed') === 'true') {
        sb.classList.add('collapsed');
    }

    // Auto-collapse on medium screens (768–1024px) on initial load
    // Only applies if user never explicitly toggled
    const w = window.innerWidth;
    if (w > 768 && w <= 1024 && localStorage.getItem('sidebar-collapsed') === null) {
        sb.classList.add('collapsed');
    }
}

// ── Mobile sidebar toggle ──
function initSidebar() {
    const sidebar = document.querySelector('#main-sidebar, .sidebar');
    if (!sidebar) return;
    // Create hamburger if missing
    let ham = document.querySelector('.hamburger');
    if (!ham) {
        ham = document.createElement('button');
        ham.className = 'hamburger';
        ham.innerHTML = '☰';
        ham.setAttribute('aria-label', 'Меню');
        document.body.appendChild(ham); // fixed positioning
    }
    // Create overlay if missing
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }
    ham.onclick = function() { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
    overlay.onclick = function() { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
}

window.showLoading = showLoading;
window.showError = showError;
window.showEmpty = showEmpty;

// ── Toast notifications ──
function showToast(msg, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    t.onclick = () => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 350); };
    container.appendChild(t);
    setTimeout(() => {
        if (t.isConnected) { t.classList.add('toast-out'); setTimeout(() => t.remove(), 350); }
    }, 3500);
}
window.showToast = showToast;

// ── Confirm helper for destructive actions ──
function confirmAction(msg, cb) {
    if (confirm(msg)) cb();
}
window.confirmAction = confirmAction;

// ═══════════════════════════════════════════════
// Push Notifications System
// ═══════════════════════════════════════════════

let notifInterval = null;
let lastNotifCheck = Date.now();
let notifPermission = false;

function initNotifications() {
    if (!('Notification' in window)) return;
    notifPermission = Notification.permission === 'granted';
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => { notifPermission = p === 'granted'; });
    }
    // Poll for unread
    pollNotifications();
    if (notifInterval) clearInterval(notifInterval);
    notifInterval = setInterval(pollNotifications, 15000);
}

async function pollNotifications() {
    const uid = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    if (!uid || !token) return;
    try {
        const res = await fetch(`${API_URL}/api/messages/unread/${uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        const cnt = data.unread || 0;

        // Update bell badge
        const dots = document.querySelectorAll('.notif-bell .badge-dot');
        dots.forEach(d => {
            d.classList.toggle('show', cnt > 0);
            d.textContent = cnt > 99 ? '99+' : cnt;
        });

        // Browser notification
        if (notifPermission && cnt > 0) {
            const since = lastNotifCheck;
            lastNotifCheck = Date.now();
            // Only notify if it's new (check was reset since last poll)
            if (Date.now() - since < 60000) {
                const n = new Notification('📬 Новое сообщение', {
                    body: `У вас ${cnt} непрочитанных сообщений`,
                    icon: '/favicon.ico',
                    silent: true,
                });
                setTimeout(() => n.close(), 5000);
            }
        }
    } catch(e) {}
}

function updateNotifBell(count) {
    const dots = document.querySelectorAll('.notif-bell .badge-dot');
    dots.forEach(d => {
        d.classList.toggle('show', count > 0);
        if (count > 0) d.textContent = count > 99 ? '99+' : count;
    });
}

// Toggle notification dropdown
function toggleNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    const isOpen = dd.classList.contains('show');
    document.querySelectorAll('.notif-dropdown').forEach(el => el.classList.remove('show'));
    if (!isOpen) {
        dd.classList.add('show');
        loadNotifDropdown();
    }
}

async function loadNotifDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    const uid = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');
    if (!uid || !token) { dd.innerHTML = '<div class="notif-empty">Не авторизован</div>'; return; }
    dd.innerHTML = '<div class="notif-hdr">📬 Сообщения</div><div style="padding:20px;text-align:center;"><div class="spinner"></div></div>';
    try {
        const res = await fetch(`${API_URL}/api/messages/contacts/${uid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) { dd.innerHTML = '<div class="notif-hdr">📬 Сообщения</div><div class="notif-empty">Ошибка загрузки</div>'; return; }
        const contacts = await res.json();
        const unread = contacts.filter(c => c.unread > 0);
        if (!unread.length) {
            dd.innerHTML = '<div class="notif-hdr">📬 Сообщения</div><div class="notif-empty">Нет непрочитанных</div>';
            return;
        }
        const path = window.location.pathname.includes('/admin/') ? '../chat.html' :
                     window.location.pathname.includes('/teacher/') ? '../chat.html' : 'chat.html';
        dd.innerHTML = '<div class="notif-hdr">📬 Непрочитанные</div>' +
            unread.map(c => `<div class="notif-item" onclick="goToChat(${c.user_id},'${path}')">
                <span class="n-icon">💬</span>
                <div><div class="n-text"><strong>${esc(c.name)}</strong>: ${esc(c.last_message||'')}</div>
                <div class="n-time">${c.unread} сообщ.</div></div>
            </div>`).join('');
    } catch(e) { dd.innerHTML = '<div class="notif-hdr">📬 Сообщения</div><div class="notif-empty">Ошибка сети</div>'; }
}

function goToChat(userId, path) {
    localStorage.setItem('chat_with', userId);
    window.location.href = path;
}

// Close dropdown on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('.notif-bell') && !e.target.closest('.notif-dropdown')) {
        document.querySelectorAll('.notif-dropdown').forEach(el => el.classList.remove('show'));
    }
});

// Init after DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initNotifications();
    // Re-init theme after new styles are loaded
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
});

// ── Mobile sidebar toggle ──
function toggleMobileSidebar() {
    const s = document.querySelector('.sidebar');
    const o = document.querySelector('.sidebar-overlay');
    if (s) s.classList.toggle('open');
    if (o) o.classList.toggle('show');
}

// ── Role guard for page access ──
function requireRole(allowedRoles) {
    const role = localStorage.getItem('user_role');
    if (!role) { window.location.href = 'login.html'; return false; }
    if (allowedRoles && !allowedRoles.includes(role)) {
        const targets = { admin: '../admin/dashboard.html', teacher: '../teacher/dashboard.html' };
        const fallback = { admin: 'admin/dashboard.html', teacher: 'teacher/dashboard.html', student: 'dashboard.html' };
        window.location.href = targets[role] || fallback[role] || 'login.html';
        return false;
    }
    return true;
}
window.requireRole = requireRole;
window.toggleMobileSidebar = toggleMobileSidebar;
