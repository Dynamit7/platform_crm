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

    updateChatBadge();
    initTheme();

    // Re-bind theme toggles dynamically
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.onclick = null; // Remove inline onclick if present
        btn.addEventListener('click', toggleTheme);
    });
});

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

// Export for manual refresh
window.updateChatBadge = updateChatBadge;
