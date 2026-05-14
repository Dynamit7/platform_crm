sidebar_fixes = """
/* ========================================= */
/* === SIDEBAR REFINEMENT & STYLING FIXES === */
/* ========================================= */

.sidebar {
    padding: 20px 15px !important;
}

.sidebar-logo {
    display: flex;
    align-items: center;
    margin-bottom: 25px !important;
    padding-left: 10px;
    font-size: 20px !important;
}

.sidebar-logo img {
    height: 28px !important;
}

.sidebar-logo small {
    font-size: 9px;
    background: var(--primary-gradient);
    color: white;
    padding: 2px 5px;
    border-radius: 6px;
    margin-left: 5px;
    vertical-align: middle;
}

.sidebar-nav {
    gap: 2px !important;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 5px;
}

.section-label {
    display: block !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    color: var(--muted) !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
    margin-top: 15px !important;
    margin-bottom: 5px !important;
    padding-left: 15px !important;
    opacity: 0.8 !important;
}

.sidebar a {
    padding: 10px 15px !important;
    margin-bottom: 2px !important;
    border-radius: 12px !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    display: flex !important;
    align-items: center !important;
    white-space: nowrap !important;
    line-height: 1.2 !important;
}

.sidebar a.active {
    font-weight: 700 !important;
}

.sidebar a .icon {
    font-size: 18px !important;
    width: 24px !important;
    text-align: center !important;
    margin-right: 12px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.sidebar-nav::-webkit-scrollbar {
    width: 4px;
}
.sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
}
[data-theme="dark"] .sidebar-nav::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
}
"""

with open(r"c:\Users\Samad\Desktop\TIL USER BOT\web\frontend\app.css", "a", encoding="utf-8") as f:
    f.write("\n" + sidebar_fixes)
print("Sidebar fixes appended successfully!")
