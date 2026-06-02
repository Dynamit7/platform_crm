import paramiko, time, sys, os

HOST = "tiluser.org"
USER = "samad"
PASS = 'YgWP2a3q9Y"_'
BASE = "/home/samad/TIL_USER_BOT"

t = paramiko.Transport((HOST, 22))
t.connect(username=USER, password=PASS)
sftp = paramiko.SFTPClient.from_transport(t)

def run(cmd, timeout=15):
    chan = t.open_session()
    chan.get_pty()
    chan.exec_command(cmd)
    out = b""
    start = time.time()
    while time.time() - start < timeout:
        if chan.recv_ready(): out += chan.recv(4096)
        if chan.exit_status_ready(): break
        time.sleep(0.1)
    while chan.recv_ready(): out += chan.recv(4096)
    code = chan.recv_exit_status()
    chan.close()
    return out.decode("utf-8", errors="replace"), code

backend_files = [
    "web/routers/admin.py",
    "web/routers/groups.py",
    "web/routers/students.py",
    "bot/handlers/admin/teachers.py",
    "bot/handlers/admin/students.py",
    "bot/handlers/admin/reports.py",
]
for f in backend_files:
    sftp.put(f, "%s/%s" % (BASE, f))
    print("Uploaded %s" % f)

dist = os.path.join("react-crm", "dist")
for root, dirs, files in os.walk(dist):
    for fn in files:
        local = os.path.join(root, fn)
        rel = os.path.relpath(local, "react-crm")
        remote = BASE + "/react-crm/" + rel.replace("\\", "/")
        sftp.put(local, remote)
        print("Uploaded react-crm/" + rel)

out, _ = run("systemctl --user restart smartedu-web.service", 5)
print("Web:", out[:200])
out, _ = run("systemctl --user restart smartedu-bot.service", 5)
print("Bot:", out[:200])
time.sleep(5)

test = """import json, urllib.request, ssl
ctx = ssl._create_unverified_context()
B = "https://tiluser.org:8443"
r = urllib.request.Request(B+"/auth/login", data=json.dumps({"email":"admin@tiluser.com","password":"admin123"}).encode(), headers={"Content-Type":"application/json"})
tok = json.loads(urllib.request.urlopen(r, context=ctx).read())["access_token"]
h = {"Authorization":"Bearer "+tok}
eps = ["/api/courses","/api/teachers","/api/students","/api/leads","/api/groups","/api/payments","/api/admin/stats"]
for ep in eps:
    r = urllib.request.Request(B+ep, headers=h)
    d = json.loads(urllib.request.urlopen(r, context=ctx).read())
    n = len(d) if isinstance(d, list) else len(d)
    print(f"{ep}: OK ({n})")

# Test new status field
r = urllib.request.Request(B+"/api/admin/students", headers=h)
d = json.loads(urllib.request.urlopen(r, context=ctx).read())
if d:
    print(f"Student has status field: {'status' in d[0]}, value={d[0].get('status')}")
print("ALL OK")
"""

with sftp.open("/tmp/test_final2.py", "w") as f:
    f.write(test)

out, _ = run("/home/samad/TIL_USER_BOT/.venv/bin/python3 /tmp/test_final2.py", 15)
sys.stdout.buffer.write(out.encode("utf-8", errors="replace"))

sftp.close()
t.close()
