import sqlite3
import requests
import json
import os

print("=" * 60)
print("  SmartEdu CRM — БЫСТРЫЙ АУДИТ СИСТЕМЫ")
print("=" * 60)

# === 1. БД аудит ===
print("\n📋 [1] АУДИТ БАЗ ДАННЫХ")
print("-" * 40)

dbs = {
    "WEB DB": r"web\education_center_web.db",
    "BOT DB": r"education_center_v2.db",
}

for db_name, db_path in dbs.items():
    if not os.path.exists(db_path):
        print(f"❌ {db_name}: файл не найден ({db_path})")
        continue
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall()]
    print(f"\n🗄️  {db_name} ({db_path})")
    for table in sorted(tables):
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        cursor.execute(f"PRAGMA table_info({table})")
        cols = [r[1] for r in cursor.fetchall()]
        print(f"   📊 {table:30s} {count:5d} записей  [{', '.join(cols[:5])}{'...' if len(cols)>5 else ''}]")
    conn.close()

# === 2. API проверка ===
print("\n\n🌐 [2] АУДИТ API ЭНДПОИНТОВ")
print("-" * 40)

BASE = "http://localhost:8000"

# Авторизация
try:
    r = requests.post(f"{BASE}/api/auth/login", 
                      json={"email": "admin@til.uz", "password": "REDACTED_PASSWORD"},
                      timeout=5)
    if r.status_code == 200:
        token = r.json().get("access_token")
        print(f"✅ Авторизация: OK  (токен получен)")
    else:
        print(f"❌ Авторизация: ОШИБКА {r.status_code} — {r.text[:100]}")
        token = None
except Exception as e:
    print(f"❌ Авторизация: НЕДОСТУПНО — {e}")
    token = None

if token:
    h = {"Authorization": f"Bearer {token}"}
    endpoints = [
        ("GET", "/api/admin/stats",         "Статистика"),
        ("GET", "/api/leads",               "Заявки (Kanban)"),
        ("GET", "/api/students",            "Студенты"),
        ("GET", "/api/teachers",            "Преподаватели"),
        ("GET", "/api/groups",              "Группы"),
        ("GET", "/api/courses",             "Курсы"),
        ("GET", "/api/payments",            "Платежи"),
        ("GET", "/api/admin/reviews",       "Отзывы"),
        ("GET", "/api/admin/pending-users", "Новые заявки"),
        ("GET", "/api/payments/monthly-revenue", "Доход по месяцам"),
        ("GET", "/api/admin/export/students", "Экспорт студентов"),
        ("GET", "/api/admin/stats/groups-attendance", "Посещаемость групп"),
        ("GET", "/api/teacher/groups",      "Группы (учитель)"),
        ("GET", "/api/teacher/students",    "Студенты (учитель)"),
        ("GET", "/api/student/schedule",    "Расписание (студент)"),
        ("GET", "/api/student/homeworks",   "ДЗ (студент)"),
    ]

    for method, path, label in endpoints:
        try:
            r = requests.get(f"{BASE}{path}", headers=h, timeout=5)
            if r.status_code == 200:
                data = r.json()
                count = len(data) if isinstance(data, list) else "object"
                print(f"✅ {label:35s} [{r.status_code}]  {count} записей")
            else:
                print(f"⚠️  {label:35s} [{r.status_code}]  {r.text[:80]}")
        except Exception as e:
            print(f"❌ {label:35s} ОШИБКА: {e}")

# === 3. Фронтенд файлы ===
print("\n\n🖥️  [3] АУДИТ ФРОНТЕНД ФАЙЛОВ")
print("-" * 40)

fe_base = r"web\frontend"
pages = {
    "Главная страница":  "index.html",
    "Логин":             "login.html",
    "Регистрация":       "register.html",
    "Студент Дашборд":   "dashboard.html",
    "Студент Курсы":     "courses.html",
    "Студент Расписание":"schedule.html",
    "Студент ДЗ":        "homeworks.html",
    "Студент Чат":       "chat.html",
    "Студент Достижения":"achievements.html",
    "Студент Настройки": "settings.html",
    "Админ Дашборд":     "admin/dashboard.html",
    "Админ Лиды":        "admin/leads.html",
    "Админ Студенты":    "admin/students.html",
    "Админ Учителя":     "admin/teachers.html",
    "Админ Группы":      "admin/groups.html",
    "Админ Курсы":       "admin/courses.html",
    "Админ Платежи":     "admin/payments.html",
    "Админ Отчёты":      "admin/reports.html",
    "Админ Рассылка":    "admin/broadcast.html",
    "Админ Ожидающие":   "admin/pending-users.html",
    "Админ Отзывы":      "admin/reviews.html",
    "Учитель Дашборд":   "teacher/dashboard.html",
    "Учитель Группы":    "teacher/groups.html",
    "Учитель Студенты":  "teacher/students.html",
    "Учитель Уроки":     "teacher/lessons.html",
    "Учитель Посещение": "teacher/attendance.html",
    "Учитель ДЗ":        "teacher/homeworks.html",
}

total_size = 0
for label, path in pages.items():
    full = os.path.join(fe_base, path)
    if os.path.exists(full):
        size = os.path.getsize(full)
        total_size += size
        status = "✅"
        note = f"{size//1024:3d} KB"
    else:
        status = "❌"
        note = "ОТСУТСТВУЕТ"
    print(f"{status} {label:30s} {note}")

print(f"\n📦 Всего фронтенд файлов: {len(pages)}, общий размер: {total_size//1024} KB")

print("\n\n✅ АУДИТ ЗАВЕРШЁН")
print("=" * 60)
