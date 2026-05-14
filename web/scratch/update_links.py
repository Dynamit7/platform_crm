import os
import re

frontend_dir = 'frontend'

def replace_in_file(filepath, pattern, repl):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = re.sub(pattern, repl, content)
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

# Update index.html
replace_in_file(f'{frontend_dir}/index.html', r'href="style\.css"', 'href="app.css"')

# Student pages
student_pages = ['dashboard.html', 'courses.html', 'schedule.html', 'homeworks.html', 'achievements.html', 'settings.html']
for page in student_pages:
    path = f'{frontend_dir}/{page}'
    replace_in_file(path, r'href="dashboard\.css"', 'href="app.css"')
    replace_in_file(path, r'href="style\.css"', 'href="app.css"')
    
    # Inject auth-utils.js before </body>
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        if 'auth-utils.js' not in content:
            new_content = content.replace('</body>', '<script src="auth-utils.js"></script>\n</body>')
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Injected auth-utils.js to {path}")

# Admin and Teacher pages
for sub in ['admin', 'teacher']:
    subdir = os.path.join(frontend_dir, sub)
    if not os.path.exists(subdir): continue
    for filename in os.listdir(subdir):
        if filename.endswith('.html'):
            path = os.path.join(subdir, filename)
            # They might reference admin.css, dashboard.css, style.css
            replace_in_file(path, r'href="admin\.css"', 'href="../app.css"')
            replace_in_file(path, r'href="\.\./admin\.css"', 'href="../app.css"')
            replace_in_file(path, r'href="\.\./style\.css"', 'href="../app.css"')
            replace_in_file(path, r'href="\.\./dashboard\.css"', 'href="../app.css"')
            replace_in_file(path, r'href="dashboard\.css"', 'href="../app.css"')
            
            # Inject auth-utils.js
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if 'auth-utils.js' not in content:
                new_content = content.replace('</body>', '<script src="../auth-utils.js"></script>\n</body>')
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Injected auth-utils.js to {path}")
