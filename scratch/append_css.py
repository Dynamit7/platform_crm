import os

css_overrides = """
/* ============================================================== */
/* === PREMIUM DASHBOARD REDESIGN OVERRIDES (GLASSMORPHISM) === */
/* ============================================================== */

/* Enhanced Variables */
:root {
    --glass-bg: rgba(255, 255, 255, 0.4);
    --glass-border: rgba(255, 255, 255, 0.5);
    --glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
    --primary-gradient: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    --accent-gradient: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%);
}

[data-theme="dark"] {
    --glass-bg: rgba(15, 23, 42, 0.6);
    --glass-border: rgba(255, 255, 255, 0.05);
    --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

/* Base Body Update for Dashboard */
body {
    background: var(--bg-color);
    background-image: 
        radial-gradient(circle at 15% 50%, rgba(79, 70, 229, 0.08), transparent 25%),
        radial-gradient(circle at 85% 30%, rgba(124, 58, 237, 0.08), transparent 25%);
    background-attachment: fixed;
}

/* Sidebar Enchancement */
.sidebar {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid var(--glass-border) !important;
    box-shadow: var(--glass-shadow);
    z-index: 100;
}

.sidebar a {
    margin-bottom: 5px;
    border: 1px solid transparent;
    overflow: hidden;
}

.sidebar a:hover, .sidebar a.active {
    background: rgba(255, 255, 255, 0.3) !important;
    border: 1px solid var(--glass-border);
    transform: translateX(8px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
[data-theme="dark"] .sidebar a:hover, [data-theme="dark"] .sidebar a.active {
    background: rgba(255, 255, 255, 0.1) !important;
}

/* Main Content area */
.main-content {
    background: transparent !important;
}

/* Cards & Panels (KPI, Charts, Stats) */
.kpi-card, .stat-card, .panel, .card {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border) !important;
    border-radius: 24px !important;
    box-shadow: var(--glass-shadow) !important;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    position: relative;
    overflow: hidden;
}

.kpi-card::before, .stat-card::before, .panel::before, .card::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 50%; height: 100%;
    background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
    transform: skewX(-25deg);
    transition: all 0.7s ease;
    z-index: 1;
    pointer-events: none;
}

.kpi-card:hover::before, .stat-card:hover::before, .panel:hover::before, .card:hover::before {
    left: 150%;
}

.kpi-card:hover, .stat-card:hover, .panel:hover, .card:hover {
    transform: translateY(-8px) scale(1.02) !important;
    box-shadow: 0 20px 40px rgba(31, 38, 135, 0.15) !important;
}

/* Typography Enhancements */
h1, h2, h3, .panel-header h2 {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800 !important;
    letter-spacing: -0.5px;
}

/* KPI Values specifically */
.kpi-value {
    font-size: 36px !important;
    font-weight: 800 !important;
    background: var(--text-main);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
[data-theme="dark"] .kpi-value, [data-theme="dark"] h1, [data-theme="dark"] h2, [data-theme="dark"] h3 {
    background: #fff;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Buttons */
.btn-primary, .btn-accent, .btn-success, .zoom-btn {
    background: var(--primary-gradient) !important;
    border: none !important;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4) !important;
    border-radius: 14px !important;
    color: #fff !important;
    font-weight: 600 !important;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease !important;
}

.btn-primary:hover, .btn-accent:hover, .btn-success:hover, .zoom-btn:hover {
    transform: translateY(-3px) !important;
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.6) !important;
}

.btn-outline {
    background: var(--glass-bg) !important;
    border: 1px solid var(--primary) !important;
    backdrop-filter: blur(10px);
    border-radius: 14px !important;
    transition: all 0.3s ease !important;
}
.btn-outline:hover {
    background: var(--primary-gradient) !important;
    color: #fff !important;
    border-color: transparent !important;
    transform: translateY(-3px) !important;
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4) !important;
}

/* Table Enhancements */
.data-table {
    border-collapse: separate;
    border-spacing: 0 8px;
    width: 100%;
}
.data-table th {
    background: transparent !important;
    border-bottom: 2px solid var(--border) !important;
    color: var(--muted);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 1px;
}
.data-table td {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-width: 1px 0;
    padding: 16px !important;
}
.data-table td:first-child {
    border-left-width: 1px;
    border-radius: 12px 0 0 12px;
}
.data-table td:last-child {
    border-right-width: 1px;
    border-radius: 0 12px 12px 0;
}
.data-table tr {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.data-table tbody tr:hover td {
    background: rgba(255,255,255,0.6);
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}
[data-theme="dark"] .data-table tbody tr:hover td {
    background: rgba(255,255,255,0.05);
}

/* Badges */
.badge-status {
    padding: 6px 12px !important;
    border-radius: 20px !important;
    font-weight: 600 !important;
    font-size: 12px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: var(--bg-color);
}
::-webkit-scrollbar-thumb {
    background: var(--primary-light);
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: var(--primary);
}

/* Animations */
@keyframes slideInRight {
    from { transform: translateX(30px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
.page-content > * {
    animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}
.page-content > *:nth-child(1) { animation-delay: 0.1s; }
.page-content > *:nth-child(2) { animation-delay: 0.2s; }
.page-content > *:nth-child(3) { animation-delay: 0.3s; }
.page-content > *:nth-child(4) { animation-delay: 0.4s; }

/* Top Bar Enhancements */
.top-bar {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border) !important;
    border-radius: 20px;
    margin-bottom: 30px;
    padding: 20px 30px !important;
    box-shadow: var(--glass-shadow);
}
.top-header {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border) !important;
    border-radius: 20px;
    padding: 20px 30px;
    box-shadow: var(--glass-shadow);
}
"""

with open(r"c:\Users\Samad\Desktop\TIL USER BOT\web\frontend\app.css", "a", encoding="utf-8") as f:
    f.write("\n" + css_overrides)
print("CSS overrides appended successfully!")
