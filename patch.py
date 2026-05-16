import os
import re

folder = r'web/frontend/admin'
files = [f for f in os.listdir(folder) if f.endswith('.html')]

sidebar_nav_content = '''    <nav class="sidebar-nav">
        <div class="section-label">Главное</div>
        <a href="dashboard.html" {dash_active}><span class="icon">📊</span> Дашборд</a>
        <a href="leads.html" {leads_active}><span class="icon">🎯</span> Заявки (Kanban)</a>

        <div class="section-label">Управление</div>
        <a href="students.html" {students_active}><span class="icon">👨‍🎓</span> Студенты</a>
        <a href="teachers.html" {teachers_active}><span class="icon">👩‍🏫</span> Преподаватели</a>
        <a href="groups.html" {groups_active}><span class="icon">👥</span> Группы</a>
        <a href="courses.html" {courses_active}><span class="icon">📚</span> Курсы</a>

        <div class="section-label">Финансы</div>
        <a href="payments.html" {payments_active}><span class="icon">💳</span> Платежи</a>
        <a href="reports.html" {reports_active}><span class="icon">📈</span> Отчёты</a>

        <div class="section-label">Коммуникация</div>
        <a href="../chat.html"><span class="icon">💬</span> Чат</a>
        <a href="broadcast.html" {broadcast_active}><span class="icon">📢</span> Рассылка</a>
        <a href="pending-users.html" {pending_active}><span class="icon">⏳</span> Новые заявки <span id="pendingBadge" class="chat-badge" style="display:none;"></span></a>
        <a href="reviews.html" {reviews_active}><span class="icon">⭐</span> Отзывы</a>
    </nav>'''

for file in files:
    path = os.path.join(folder, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if we should insert class="active"
    d = {'dash_active':'', 'leads_active':'', 'students_active':'', 'teachers_active':'',
         'groups_active':'', 'courses_active':'', 'payments_active':'', 'reports_active':'',
         'broadcast_active':'', 'pending_active':'', 'reviews_active':''}
    
    if file == 'dashboard.html': d['dash_active'] = 'class="active"'
    elif file == 'leads.html': d['leads_active'] = 'class="active"'
    elif file == 'students.html': d['students_active'] = 'class="active"'
    elif file == 'teachers.html': d['teachers_active'] = 'class="active"'
    elif file == 'groups.html': d['groups_active'] = 'class="active"'
    elif file == 'courses.html': d['courses_active'] = 'class="active"'
    elif file == 'payments.html': d['payments_active'] = 'class="active"'
    elif file == 'reports.html': d['reports_active'] = 'class="active"'
    elif file == 'broadcast.html': d['broadcast_active'] = 'class="active"'
    elif file == 'pending-users.html': d['pending_active'] = 'class="active"'
    elif file == 'reviews.html': d['reviews_active'] = 'class="active"'

    nav_replaced = sidebar_nav_content.format(**d)
    
    new_content = re.sub(r'<nav class="sidebar-nav">.*?</nav>', nav_replaced, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched sidebar in {file}")

print("Done")
