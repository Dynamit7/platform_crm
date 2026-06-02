#!/usr/bin/env bash
#
# deploy.sh — деплой SmartEdu CRM на сервер (Linux / macOS).
#
# Делает всё по порядку и идемпотентно (можно запускать сколько угодно раз):
#   1. подтягивает свежий код из git        (--no-pull чтобы пропустить)
#   2. создаёт venv, если его нет
#   3. ставит Python-зависимости (bot + web)
#   4. применяет миграции БД (alembic)
#   5. собирает React-фронтенд (npm install + build)  (--no-front чтобы пропустить)
#   6. перезапускает процесс в pm2 (имя: crm)
#
# Запуск на сервере:
#   bash deploy.sh
#   bash deploy.sh --no-pull          # не делать git pull
#   bash deploy.sh --no-front         # не пересобирать фронт
#   PM2_NAME=crm bash deploy.sh       # своё имя pm2-процесса
#
set -euo pipefail

# ── Папка проекта = папка, где лежит этот скрипт ────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

PM2_NAME="${PM2_NAME:-crm}"
DO_PULL=1
DO_FRONT=1
for arg in "$@"; do
  case "$arg" in
    --no-pull)  DO_PULL=0 ;;
    --no-front) DO_FRONT=0 ;;
    *) echo "Неизвестный аргумент: $arg"; exit 1 ;;
  esac
done

# ── Цветной вывод ───────────────────────────────────────────────
BLUE="\033[34m"; GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; RESET="\033[0m"
step() { echo -e "\n${BLUE}▶ $1${RESET}"; }
ok()   { echo -e "${GREEN}✔ $1${RESET}"; }
warn() { echo -e "${YELLOW}⚠ $1${RESET}"; }
die()  { echo -e "${RED}✗ $1${RESET}"; exit 1; }

echo -e "${GREEN}=== Деплой SmartEdu CRM ===${RESET}"
echo "Папка: $ROOT"

# ── Поиск python3 ───────────────────────────────────────────────
PY_BIN="$(command -v python3 || command -v python || true)"
[ -n "$PY_BIN" ] || die "Python не найден. Установи python3 (например: sudo apt install python3 python3-venv)."

# ── 1. git pull ─────────────────────────────────────────────────
if [ "$DO_PULL" -eq 1 ]; then
  if [ -d .git ]; then
    step "Подтягиваю свежий код (git pull)"
    git pull --ff-only && ok "Код обновлён" || warn "git pull пропущен (нет remote / локальные изменения)"
  else
    warn "Это не git-репозиторий — пропускаю git pull"
  fi
else
  warn "git pull пропущен (--no-pull)"
fi

# ── 2. venv ─────────────────────────────────────────────────────
if [ ! -d .venv ]; then
  step "Создаю виртуальное окружение .venv"
  "$PY_BIN" -m venv .venv || die "Не удалось создать venv. На Debian/Ubuntu нужен пакет python3-venv."
  ok "venv создан"
fi
# python внутри venv (Linux/macOS)
VENV_PY=".venv/bin/python"
[ -x "$VENV_PY" ] || die "Не найден $VENV_PY — venv повреждён. Удали .venv и запусти скрипт снова."

# ── 3. Python-зависимости ───────────────────────────────────────
step "Ставлю Python-зависимости (bot + web)"
"$VENV_PY" -m pip install --upgrade pip --quiet
"$VENV_PY" -m pip install -r requirements.txt --quiet
[ -f web/requirements.txt ] && "$VENV_PY" -m pip install -r web/requirements.txt --quiet
ok "Зависимости установлены"

# быстрая проверка, что критичные модули на месте
"$VENV_PY" - <<'PYCHECK' || die "Не все модули установились — смотри вывод pip выше."
import importlib.util, sys
missing = [m for m in ("structlog", "uvicorn", "aiogram", "fastapi") if importlib.util.find_spec(m) is None]
if missing:
    print("Отсутствуют модули:", ", ".join(missing)); sys.exit(1)
PYCHECK
ok "Проверка модулей пройдена (structlog, uvicorn, aiogram, fastapi)"

# ── 4. Миграции БД ──────────────────────────────────────────────
if [ -f alembic.ini ]; then
  step "Применяю миграции БД (alembic upgrade head)"
  "$VENV_PY" -m alembic upgrade head && ok "Миграции применены" \
    || warn "Миграции не применились — проверь подключение к БД (DATABASE_URL в .env)"
fi

# ── 5. Сборка фронтенда ─────────────────────────────────────────
if [ "$DO_FRONT" -eq 1 ] && [ -d react-crm ]; then
  if command -v npm >/dev/null 2>&1; then
    step "Собираю React-фронтенд (npm install + build)"
    ( cd react-crm
      if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi
      npm run build )
    ok "Фронтенд собран (react-crm/dist)"
  else
    warn "npm не найден — пропускаю сборку фронта. Установи Node.js, если фронт нужен."
  fi
else
  [ "$DO_FRONT" -eq 0 ] && warn "Сборка фронта пропущена (--no-front)"
fi

# ── 6. Перезапуск pm2 ───────────────────────────────────────────
step "Перезапуск процесса в pm2 (имя: $PM2_NAME)"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
    pm2 restart "$PM2_NAME" --update-env
    ok "pm2 перезапустил '$PM2_NAME'"
  else
    warn "Процесс '$PM2_NAME' в pm2 не найден — запускаю заново"
    pm2 start "$VENV_PY" --name "$PM2_NAME" -- start.py
    pm2 save
    ok "pm2 запустил '$PM2_NAME'"
  fi
  echo -e "\nЛоги:  ${BLUE}pm2 logs $PM2_NAME${RESET}"
else
  warn "pm2 не установлен. Запусти вручную:  $VENV_PY start.py"
fi

echo -e "\n${GREEN}=== Готово ===${RESET}"
