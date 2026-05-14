import os

style_path = 'frontend/style.css'
dash_path = 'frontend/dashboard.css'
admin_path = 'frontend/admin/admin.css'
out_path = 'frontend/app.css'

with open(style_path, 'r', encoding='utf-8') as f:
    style_content = f.read()

with open(dash_path, 'r', encoding='utf-8') as f:
    dash_content = f.read()

with open(admin_path, 'r', encoding='utf-8') as f:
    admin_content = f.read()

# We want a unified :root.
unified_root = """/* --- Unified Variables --- */
:root {
    --bg-color: #FDF9F1;
    --surface: #FFFFFF;
    --surface-glass: rgba(255, 255, 255, 0.85);
    --primary: #041E42;
    --primary-light: #0A3266;
    --secondary: #1F4A7C;
    --accent: #D4AF37;
    --text-main: #0B132B;
    --text: #1A1A2E;
    --text-muted: #4A5568;
    --muted: #64748B;
    --border: rgba(4, 30, 66, 0.1);
    --danger: #EF4444;
    --success: #10B981;
    --warning: #F59E0B;
    --info: #3B82F6;
    --gradient: linear-gradient(135deg, var(--primary), var(--secondary));
    
    --sidebar-bg: #041E42;
    --sidebar-text: rgba(255,255,255,0.75);
    --sidebar-active: rgba(255,255,255,0.12);
    --sidebar-w: 260px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Outfit', 'Inter', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-main);
    line-height: 1.6;
    overflow-x: hidden;
}

a {
    text-decoration: none;
    color: inherit;
}

ul {
    list-style: none;
}
"""

def strip_base(content):
    import re
    # Remove :root { ... }
    content = re.sub(r':root\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    # Remove * { ... }
    content = re.sub(r'\*\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    # Remove body { ... }
    content = re.sub(r'body\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    # Remove a { ... } and ul { ... } if simple
    content = re.sub(r'^a\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    content = re.sub(r'^ul\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    content = re.sub(r'h1,\s*h2,\s*h3,\s*h4\s*\{[^}]*\}', '', content, flags=re.MULTILINE|re.DOTALL)
    return content

style_clean = strip_base(style_content)
dash_clean = strip_base(dash_content)
admin_clean = strip_base(admin_content)

combined = unified_root + "\n/* === STYLE.CSS === */\n" + style_clean + "\n/* === DASHBOARD.CSS === */\n" + dash_clean + "\n/* === ADMIN.CSS === */\n" + admin_clean

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(combined)

print("Created app.css successfully.")
