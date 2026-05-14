"""
start.py — единая точка запуска SmartEdu
Запускает: веб-сервер (FastAPI) + Telegram-бот одновременно.

Использование:
    .venv\Scripts\python.exe start.py            # оба сервиса
    .venv\Scripts\python.exe start.py --web      # только веб
    .venv\Scripts\python.exe start.py --bot      # только бот
    .venv\Scripts\python.exe start.py --sync     # только синхронизация БД
"""

import subprocess
import sys
import os
import time
import threading
import signal
from pathlib import Path

ROOT = Path(__file__).parent
VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"
WEB_VENV_PYTHON = ROOT / "web" / "venv" / "Scripts" / "python.exe"

# Используем venv веба для uvicorn если есть, иначе общий
WEB_PYTHON = str(WEB_VENV_PYTHON) if WEB_VENV_PYTHON.exists() else str(VENV_PYTHON)
BOT_PYTHON  = str(VENV_PYTHON)


def sync_databases():
    """Синхронизирует данные бот↔веб перед стартом."""
    print("🔄 Синхронизация баз данных...")
    result = subprocess.run(
        [str(VENV_PYTHON), "sync_dbs.py", "--both"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if result.returncode == 0:
        # Выведем только итоговую строку с кол-вом записей
        for line in result.stdout.splitlines():
            if any(x in line for x in ["👤", "💳", "✅", "📋", "👤"]):
                print(" ", line.strip())
        print("✅ Синхронизация завершена\n")
    else:
        print(f"⚠️  Синхронизация завершилась с ошибкой:\n{result.stderr[:500]}\n")


def stream_output(proc: subprocess.Popen, prefix: str, color_code: str):
    """Читает stdout процесса и печатает с префиксом."""
    RESET = "\033[0m"
    COLOR = f"\033[{color_code}m"
    try:
        for line in iter(proc.stdout.readline, ""):
            line = line.rstrip()
            if line:
                print(f"{COLOR}[{prefix}]{RESET} {line}", flush=True)
    except Exception:
        pass


def run_web():
    """Запускает FastAPI-сервер через uvicorn."""
    print("🌐 Запуск веб-сервера на http://localhost:8000 ...")
    proc = subprocess.Popen(
        [
            WEB_PYTHON, "-m", "uvicorn",
            "main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--log-level", "warning",
        ],
        cwd=ROOT / "web",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    t = threading.Thread(target=stream_output, args=(proc, "WEB", "34"), daemon=True)
    t.start()
    return proc


def run_bot():
    """Запускает Telegram-бот."""
    print("🤖 Запуск Telegram-бота...")
    proc = subprocess.Popen(
        [BOT_PYTHON, "-m", "bot.main"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    t = threading.Thread(target=stream_output, args=(proc, "BOT", "32"), daemon=True)
    t.start()
    return proc


def main():
    args = sys.argv[1:]
    only_web = "--web" in args
    only_bot = "--bot" in args
    only_sync = "--sync" in args

    print("=" * 55)
    print("  🎓 SmartEdu CRM — Система управления учёбой")
    print("=" * 55)

    # Синхронизация БД (пропускаем только если запускаем 1 сервис без флага)
    if not only_bot:
        sync_databases()

    processes = []

    if only_sync:
        print("✅ Только синхронизация. Выход.")
        return

    if only_web or (not only_bot and not only_web):
        proc_web = run_web()
        processes.append(("WEB", proc_web))
        time.sleep(2)  # дать веб-серверу запуститься

    if only_bot or (not only_web and not only_bot):
        proc_bot = run_bot()
        processes.append(("BOT", proc_bot))

    if not processes:
        print("❌ Нет запущенных процессов.")
        return

    print("\n✅ Все сервисы запущены. Нажмите Ctrl+C для остановки.\n")

    def shutdown(sig, frame):
        print("\n⏹️  Остановка сервисов...")
        for name, proc in processes:
            try:
                proc.terminate()
                print(f"  [{name}] остановлен")
            except Exception:
                pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Ждём пока все процессы живы
    while True:
        time.sleep(5)
        for name, proc in processes:
            ret = proc.poll()
            if ret is not None:
                print(f"⚠️  [{name}] завершился с кодом {ret}. Перезапуск...")
                if name == "WEB":
                    proc_new = run_web()
                    processes[:] = [(n, p if n != "WEB" else proc_new) for n, p in processes]
                elif name == "BOT":
                    proc_new = run_bot()
                    processes[:] = [(n, p if n != "BOT" else proc_new) for n, p in processes]


if __name__ == "__main__":
    main()
