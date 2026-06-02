"""
start.py — единая точка запуска SmartEdu
Запускает: веб-сервер (FastAPI) + Telegram-бот одновременно.

Использование:
    Windows:
        .venv\\Scripts\\python.exe start.py          # оба сервиса
        .venv\\Scripts\\python.exe start.py --web    # только веб
        .venv\\Scripts\\python.exe start.py --bot    # только бот
    macOS / Linux:
        .venv/bin/python start.py                    # оба сервиса
        .venv/bin/python start.py --web              # только веб
        .venv/bin/python start.py --bot              # только бот
"""

import subprocess
import sys
import os
import time
import threading
import signal
from pathlib import Path

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).parent


def venv_python(venv_dir: Path) -> Path:
    """Возвращает путь к python внутри venv для текущей ОС.

    Windows: <venv>/Scripts/python.exe
    macOS/Linux: <venv>/bin/python
    """
    if os.name == "nt":
        return venv_dir / "Scripts" / "python.exe"
    return venv_dir / "bin" / "python"


VENV_PYTHON = venv_python(ROOT / ".venv")
WEB_VENV_PYTHON = venv_python(ROOT / "web" / "venv")

# Используем venv веба для uvicorn если есть, иначе общий.
# Если ни одного venv нет — берём текущий интерпретатор (sys.executable).
if WEB_VENV_PYTHON.exists():
    WEB_PYTHON = str(WEB_VENV_PYTHON)
elif VENV_PYTHON.exists():
    WEB_PYTHON = str(VENV_PYTHON)
else:
    WEB_PYTHON = sys.executable

BOT_PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable



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

    print("=" * 55)
    print("  🎓 SmartEdu CRM — Система управления учёбой")
    print("=" * 55)

    processes = []

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
