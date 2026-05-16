const API = '';

// ── Auth Guard ──────────────────────────────────────────
function authGuard() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

function authHeaders() {
    const token = localStorage.getItem('access_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

function showToast(msg) {
    let t = document.getElementById('toastMsg');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toastMsg';
        t.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#10B981;color:white;padding:14px 24px;border-radius:14px;font-weight:700;font-size:15px;box-shadow:0 8px 24px rgba(16,185,129,0.3);z-index:9999;animation:slideInRight 0.3s ease;display:none;';
        document.body.appendChild(t);
        const s = document.createElement('style');
        s.textContent = '@keyframes slideInRight{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}';
        document.head.appendChild(s);
    }
    t.textContent = '✅ ' + msg;
    t.style.display = 'block';
    clearTimeout(t._hide);
    t._hide = setTimeout(() => t.style.display = 'none', 3000);
}

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const token = authGuard();
    if (!token) return;

    const userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('user_name');
    const userRole = localStorage.getItem('user_role');

    // Role-based redirect for admin/teacher
    if (userRole === 'admin') {
        window.location.href = 'admin/dashboard.html';
        return;
    }
    if (userRole === 'teacher') {
        window.location.href = 'teacher/dashboard.html';
        return;
    }

    // Logout button
    const logoutEl = document.querySelector('.logout');
    if (logoutEl) logoutEl.onclick = (e) => { e.preventDefault(); logout(); };

    // Loading state
    document.querySelector('.welcome-text h1').innerText = `Загрузка... 👋`;
    document.querySelector('.welcome-text p').innerText = 'Загружаем данные вашего профиля...';
    
    try {
        const response = await fetch(`${API}/api/dashboard/${userId}`, { headers: authHeaders() });
        if (response.status === 401 || response.status === 403) {
            logout();
            return;
        }
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        document.querySelector('.welcome-text h1').innerText = `Привет, ${userName || 'Студент'}! 👋`;
        document.querySelector('.welcome-text p').innerText = 'Не удалось загрузить данные. Проверьте подключение к серверу.';
    }

    initHomeworkModal();
    initVocabModal();
    initNotifications();
});

// ── Render Dashboard ────────────────────────────────────
function renderDashboard(data) {
    const { user, stats, enrollments, upcoming_lesson, homeworks, vocabulary, schedule, notifications_count } = data;

    // Header
    document.querySelector('.welcome-text h1').innerText = `С возвращением, ${user.name}! 👋`;

    // Notification badge
    const badge = document.querySelector('.badge');
    if (badge) badge.innerText = notifications_count > 0 ? notifications_count : '';

    // Stats
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards[0]) statCards[0].querySelector('p').innerText = stats.level || '—';
    if (statCards[1]) {
        statCards[1].querySelector('p').innerText = `${stats.lessons_completed} из ${stats.lessons_total}`;
        const pct = Math.round((stats.lessons_completed / Math.max(stats.lessons_total, 1)) * 100);
        const fill = statCards[1].querySelector('.progress-fill');
        if (fill) fill.style.width = `${pct}%`;
    }
    if (statCards[2]) statCards[2].querySelector('p').innerText = `${(stats.xp || 0).toLocaleString()} XP`;

    // Courses
    const coursesList = document.querySelector('.courses-list');
    if (coursesList) {
        if (!enrollments || !enrollments.length) {
            coursesList.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center;">Нет записей на курсы</p>';
        } else {
            const flags = { 'японский': '🇯🇵', 'английский': '🇬🇧', 'корейский': '🇰🇷', 'русский': '🇷🇺' };
            const getFlag = (title) => { const t = (title || '').toLowerCase(); for (const [k, f] of Object.entries(flags)) if (t.includes(k)) return f; return '📚'; };
            const colors = ['#ffcb05', '#3b82f6', '#f59e0b', '#10b981'];

            coursesList.innerHTML = enrollments.map((enrollment, i) => {
                const course = enrollment.course;
                if (!course) return '';
                const flag = getFlag(course.title);
                const color = colors[i % colors.length];
                return `
                    <div class="course-dashboard-card">
                        <div class="course-btn-header" style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;color:var(--primary);">
                            <span class="course-flag" style="font-size:26px;">${flag}</span>
                            <span class="course-name">${course.title}</span>
                        </div>
                        <div class="course-btn-details" style="color:var(--text-muted);font-size:15px;margin-bottom:15px;display:flex;flex-direction:column;gap:8px;">
                            <p style="display:flex;justify-content:space-between;"><span><span class="icon">📈</span> Прогресс:</span> <strong>${enrollment.progress}%</strong></p>
                            <p style="display:flex;justify-content:space-between;"><span><span class="icon">⚡</span> XP:</span> <strong>${enrollment.xp || 0}</strong></p>
                        </div>
                        <div class="progress-bar-mini" style="position:relative;left:0;bottom:0;margin-top:auto;background:rgba(4,30,66,0.05);border-radius:6px;height:6px;width:100%;">
                            <div class="progress-fill" style="width:${enrollment.progress}%;background:${color};position:relative;border-radius:6px;height:100%;"></div>
                        </div>
                    </div>`;
            }).join('') + `<a href="courses.html" class="course-dashboard-card add-course" style="text-decoration:none;display:flex;align-items:center;gap:10px;justify-content:center;border-style:dashed;color:var(--text-muted);cursor:pointer;background:transparent;">
                <span style="font-size:32px;">+</span><span style="font-size:16px;font-weight:600;">Все курсы</span>
            </a>`;
        }
    }

    // Next Lesson
    if (upcoming_lesson) {
        const timeEl = document.querySelector('.lesson-time .time');
        const dateEl = document.querySelector('.lesson-time .date');
        const titleEl = document.querySelector('.lesson-info h3');
        const teacherEl = document.querySelector('.lesson-info p');
        const zoomBtn = document.querySelector('.zoom-btn');

        if (timeEl) timeEl.innerText = upcoming_lesson.time || '--:--';
        if (dateEl) dateEl.innerText = upcoming_lesson.date || '—';
        if (titleEl) titleEl.innerText = upcoming_lesson.title || '—';
        if (teacherEl) teacherEl.innerText = `Преподаватель: ${upcoming_lesson.teacher || '—'}`;
        if (zoomBtn && upcoming_lesson.zoom_link) {
            zoomBtn.onclick = () => window.open(upcoming_lesson.zoom_link, '_blank');
        }
    }

    // Homeworks
    const hwList = document.querySelector('.hw-list');
    if (hwList) {
        if (!homeworks || !homeworks.length) {
            hwList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:30px;font-size:15px;">🎉 Нет активных заданий!</p>';
        } else {
            const statusMap = {
                graded:    { icon: '✅', label: 'Оценено', cls: 'success' },
                submitted: { icon: '📤', label: 'На проверке', cls: 'info' },
                overdue:   { icon: '🔴', label: 'Просрочено', cls: 'urgent' },
                pending:   { icon: '⚠️', label: 'Сдать', cls: '' }
            };
            hwList.innerHTML = homeworks.slice(0, 5).map(hw => {
                const s = statusMap[hw.status] || statusMap.pending;
                const btnDisabled = hw.is_submitted ? 'disabled' : '';
                const gradeInfo = hw.grade ? ` · Оценка: <strong>${hw.grade}</strong>` : '';
                const feedbackTip = hw.feedback ? ` title="${hw.feedback}"` : '';
                return `
                <div class="hw-item ${hw.is_overdue ? 'urgent' : ''}">
                    <div class="hw-icon">${s.icon}</div>
                    <div class="hw-text">
                        <h4>${hw.title}</h4>
                        <p${feedbackTip}>${hw.is_submitted ? `${hw.status === 'graded' ? 'Проверено' : 'На проверке'}${gradeInfo}` : `Срок: ${hw.due_date || '—'}`}</p>
                    </div>
                    <button class="btn-outline-sm submit-hw-btn ${hw.is_submitted ? 'success' : ''}"
                            style="padding:8px 16px;border-radius:12px;background:var(--surface);border:1px solid ${hw.is_submitted ? 'var(--success)' : 'var(--primary)'};color:${hw.is_submitted ? 'var(--success)' : 'var(--primary)'};cursor:pointer;font-weight:600;transition:0.3s;"
                            ${btnDisabled}
                            onmouseover="if(!this.disabled){this.style.background='var(--primary)';this.style.color='white';}"
                            onmouseout="if(!this.disabled){this.style.background='var(--surface)';this.style.color='var(--primary)';}"
                            data-id="${hw.id}" data-title="${hw.title}">
                        ${s.label}
                    </button>
                </div>`;
            }).join('');

            document.querySelectorAll('.submit-hw-btn:not([disabled])').forEach(btn => {
                btn.onclick = () => openHomeworkModal(btn.dataset.id, btn.dataset.title);
            });
        }
    }

    // Vocabulary
    const vocabGrid = document.querySelector('.vocab-grid');
    if (vocabGrid) {
        if (!vocabulary || !vocabulary.length) {
            vocabGrid.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">📭 Словарь пуст. Добавьте слова в боте!</p>';
        } else {
            vocabGrid.innerHTML = vocabulary.map(word => `
                <div class="vocab-card ${word.needs_repeat ? 'highlight' : ''}">
                    <div class="word">${word.word}</div>
                    <div class="translation" style="color:var(--text-muted);font-size:14px;margin-bottom:12px;">${word.translation}</div>
                    ${word.needs_repeat
                        ? `<button class="btn-outline-sm w-100 repeat-btn" style="padding:8px;border-radius:8px;background:white;border:1px solid var(--border);cursor:pointer;font-weight:600;width:100%;" data-word="${word.word}" data-trans="${word.translation}">Повторить</button>`
                        : `<div class="progress-mini" style="height:4px;background:rgba(4,30,66,0.05);border-radius:4px;"><div class="fill" style="width:${word.progress || 0}%;background:var(--success);height:100%;border-radius:4px;"></div></div>`
                    }
                </div>
            `).join('');

            document.querySelectorAll('.repeat-btn').forEach(btn => {
                btn.onclick = () => openVocabModal(btn.dataset.word, btn.dataset.trans);
            });
        }
    }

    // Schedule
    const calWidget = document.querySelector('.calendar-widget');
    if (calWidget) {
        if (!schedule || !schedule.length) {
            calWidget.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">📅 Нет занятий на этой неделе</p>';
        } else {
            calWidget.innerHTML = schedule.map(day => `
                <div class="cal-day ${day.active ? 'active' : ''} ${day.has_lesson ? 'has-lesson' : ''}">
                    <span>${day.day}</span>
                    <strong>${day.date}</strong>
                    ${day.has_lesson ? '<div class="cal-dot"></div>' : ''}
                </div>
            `).join('');
        }
    }

    // Upcoming alert
    const upcomingAlert = document.querySelector('.upcoming-alert');
    if (upcomingAlert) {
        if (upcoming_lesson) {
            const lessonDays = schedule ? schedule.filter(d => d.has_lesson).length : 0;
            upcomingAlert.innerHTML = `⚡ След. урок: <strong>${upcoming_lesson.title}</strong> — ${upcoming_lesson.date} в ${upcoming_lesson.time}`;
        } else {
            upcomingAlert.innerHTML = '📭 Ближайших уроков нет';
        }
    }

    // Update sidebar homework badge
    const hwBadge = document.querySelector('.sidebar-nav .badge');
    if (hwBadge) {
        const pending = homeworks ? homeworks.filter(h => !h.is_submitted).length : 0;
        hwBadge.innerText = pending > 0 ? pending : '';
        hwBadge.style.display = pending > 0 ? 'inline' : 'none';
    }

    // Update avatar in header if stored
    const avatarEl = document.querySelector('.avatar');
    const storedAvatar = localStorage.getItem('user_avatar');
    if (avatarEl && storedAvatar) avatarEl.src = storedAvatar;

    // Update profile dropdown name/email
    const headerName = document.getElementById('headerUserName');
    if (headerName) headerName.textContent = user.name || localStorage.getItem('user_name') || 'Студент';
    const headerEmail = headerName?.nextElementSibling?.nextElementSibling;
    if (headerEmail) headerEmail.textContent = user.email || localStorage.getItem('user_email') || '';

// ── Homework Modal ──────────────────────────────────────
function initHomeworkModal() {
    const modal = document.getElementById('hwModal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('hwForm');
    const successMsg = document.getElementById('hwSuccessMsg');

    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const hwId = document.getElementById('hwId').value;
            const answer = document.getElementById('hwAnswer').value;
            const submitBtn = document.getElementById('hwSubmitBtn');
            submitBtn.innerText = 'Отправка...';
            submitBtn.disabled = true;

            try {
                const userId = parseInt(localStorage.getItem('user_id')) || 1;
                const response = await fetch(`${API}/api/homework/submit`, {
                    method: 'POST',
                    headers: authHeaders(),
                    body: JSON.stringify({ homework_id: parseInt(hwId), student_id: userId, content: answer })
                });
                if (response.ok) {
                    form.style.display = 'none';
                    successMsg.style.display = 'block';
                    setTimeout(() => location.reload(), 1800);
                } else {
                    showToast('Ошибка отправки задания');
                }
            } catch (e) {
                showToast('Нет соединения с сервером');
            } finally {
                submitBtn.innerText = 'Отправить на проверку';
                submitBtn.disabled = false;
            }
        };
    }
}

function openHomeworkModal(id, title) {
    const modal = document.getElementById('hwModal');
    if (!modal) return;
    const titleEl = document.getElementById('modalHwTitle');
    const idEl = document.getElementById('hwId');
    const form = document.getElementById('hwForm');
    const successMsg = document.getElementById('hwSuccessMsg');
    if (titleEl) titleEl.innerText = title;
    if (idEl) idEl.value = id;
    if (form) form.style.display = 'block';
    if (successMsg) successMsg.style.display = 'none';
    modal.classList.add('active');
}

// ── Vocab Modal ─────────────────────────────────────────
function initVocabModal() {
    const modal = document.getElementById('vocabModal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close-modal');
    const flipBtn = document.getElementById('flipBtn');
    const flashcard = document.getElementById('flashcard');
    const vocabActions = document.getElementById('vocabActions');

    const reset = () => {
        modal.classList.remove('active');
        if (flashcard) flashcard.classList.remove('flipped');
        if (flipBtn) flipBtn.style.display = 'block';
        if (vocabActions) vocabActions.style.display = 'none';
    };

    if (closeBtn) closeBtn.onclick = reset;
    modal.onclick = (e) => { if (e.target === modal) reset(); };
    if (flipBtn) flipBtn.onclick = () => {
        if (flashcard) flashcard.classList.add('flipped');
        flipBtn.style.display = 'none';
        if (vocabActions) vocabActions.style.display = 'flex';
    };

    const knowBtn = document.getElementById('knowBtn');
    const dontKnowBtn = document.getElementById('dontKnowBtn');
    if (knowBtn) knowBtn.onclick = () => { reset(); };
    if (dontKnowBtn) dontKnowBtn.onclick = () => { reset(); };
}

function openVocabModal(word, trans) {
    const modal = document.getElementById('vocabModal');
    if (!modal) return;
    const wordEl = document.getElementById('vocabWord');
    const transEl = document.getElementById('vocabTrans');
    if (wordEl) wordEl.innerText = word;
    if (transEl) transEl.innerText = trans;
    modal.classList.add('active');
}

// ── Notifications ───────────────────────────────────────
function initNotifications() {
    const btn = document.getElementById('notifBtn');
    const dropdown = document.getElementById('notifDropdown');
    if (!btn || !dropdown) return;

    btn.onclick = async (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');

        // Load real notifications on open
        if (dropdown.classList.contains('active')) {
            try {
                const res = await fetch(`${API}/api/notifications`, { headers: authHeaders() });
                if (res.ok) {
                    const notifs = await res.json();
                    const list = document.getElementById('notifList');
                    if (list) {
                        list.innerHTML = notifs.length
                            ? notifs.map(n => `
                                <div class="notification-item">
                                    <h4>${n.title}</h4>
                                    <p>${n.message}</p>
                                </div>`).join('')
                            : '<div class="notification-item"><p>Нет новых уведомлений</p></div>';
                    }
                }
            } catch (e) { /* silent */ }
        }
    };

    document.onclick = () => dropdown.classList.remove('active');
}
