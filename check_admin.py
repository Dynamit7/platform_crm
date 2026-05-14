import sqlite3
import sys
import os
import urllib.request
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

DB = os.path.join('web', 'education_center_web.db')
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

print("=== Admin users ===")
rows = conn.execute("SELECT id, name, email, role FROM users WHERE role='admin'").fetchall()
for r in rows:
    print(f"  ID={r['id']} | {r['name']} | {r['email']}")

print("\n=== All users (first 5) ===")
rows = conn.execute("SELECT id, name, email, role, is_active FROM users LIMIT 5").fetchall()
for r in rows:
    print(f"  ID={r['id']} | {r['name']} | {r['email']} | {r['role']} | active={r['is_active']}")

conn.close()

# Test login
print("\n=== Testing login ===")
try:
    data = json.dumps({"email": "admin@tiluseracademy.com", "password": "REDACTED_PASSWORD"}).encode()
    req = urllib.request.Request(
        "http://localhost:8000/auth/login",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        body = json.loads(resp.read())
        token = body.get("access_token", "")
        print(f"  Login OK. Token: {token[:20]}...")
        
        # Test freeze endpoint
        print("\n=== Testing /api/admin/users/2/freeze ===")
        freeze_data = json.dumps({"days": 7}).encode()
        freq = urllib.request.Request(
            "http://localhost:8000/api/admin/users/2/freeze",
            data=freeze_data,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(freq) as fr:
                print(f"  Freeze OK: {fr.read().decode()}")
        except Exception as e:
            print(f"  Freeze result: {e}")
            
        # Test reviews
        print("\n=== Testing /api/reviews ===")
        rreq = urllib.request.Request(
            "http://localhost:8000/api/reviews",
            headers={"Authorization": f"Bearer {token}"},
        )
        with urllib.request.urlopen(rreq) as rr:
            reviews = json.loads(rr.read())
            print(f"  Reviews count: {len(reviews)}")

except Exception as e:
    print(f"  Login failed: {e}")
