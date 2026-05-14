css_final = """
/* ===================================== */
/* === FINAL UI POLISH & KPI UPGRADE === */
/* ===================================== */

/* KPI Grid — 3 в ряд на маленьких, 6 на большом */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.kpi-card {
    border-radius: 20px !important;
    padding: 24px !important;
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: default;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.kpi-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
}

.kpi-icon.blue   { background: rgba(59, 130, 246, 0.15); }
.kpi-icon.green  { background: rgba(16, 185, 129, 0.15); }
.kpi-icon.yellow { background: rgba(245, 158, 11, 0.15); }
.kpi-icon.red    { background: rgba(239, 68, 68, 0.15);  }
.kpi-icon.purple { background: rgba(139, 92, 246, 0.15); }
.kpi-icon.orange { background: rgba(249, 115, 22, 0.15); }

.kpi-info h3 {
    font-size: 13px !important;
    font-weight: 500 !important;
    color: var(--muted) !important;
    margin-bottom: 4px;
    background: none !important;
    -webkit-background-clip: unset !important;
    -webkit-text-fill-color: unset !important;
}

.kpi-value {
    font-size: 28px !important;
    font-weight: 800 !important;
    color: var(--text-main) !important;
    line-height: 1.1;
    background: none !important;
    -webkit-background-clip: unset !important;
    -webkit-text-fill-color: var(--text-main) !important;
}

.kpi-trend {
    font-size: 12px;
    color: var(--muted);
    margin-top: 3px;
}

.kpi-trend.up { color: var(--success); }

/* Charts grid */
.charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

/* Panel */
.panel {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(16px);
    border: 1px solid var(--glass-border) !important;
    border-radius: 20px !important;
    overflow: hidden;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
}

.panel-header h2 {
    font-size: 16px !important;
    font-weight: 700 !important;
    background: none !important;
    -webkit-background-clip: unset !important;
    -webkit-text-fill-color: var(--text-main) !important;
    color: var(--text-main) !important;
}

.panel-body {
    padding: 20px 24px;
}

.chart-container {
    height: 240px;
    position: relative;
}

/* Data Table */
.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    text-align: left;
    padding: 8px 16px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--muted);
    background: transparent !important;
    border-bottom: 1px solid var(--border) !important;
}

.data-table td {
    padding: 14px 16px !important;
    font-size: 14px;
    border-bottom: 1px solid var(--border);
    background: transparent !important;
    border-left: none !important;
    border-right: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
}

.data-table td:first-child { border-radius: 0 !important; }
.data-table td:last-child  { border-radius: 0 !important; }

.data-table tbody tr:hover td {
    background: rgba(79, 70, 229, 0.04) !important;
}

/* Badges */
.badge-status {
    display: inline-block;
    padding: 4px 10px !important;
    border-radius: 20px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
}

.badge-status.new, .badge-status.Новый {
    background: rgba(59,130,246,0.1); color: #3B82F6;
}
.badge-status.contacted {
    background: rgba(245,158,11,0.1); color: #F59E0B;
}
.badge-status.enrolled, .badge-status.Enrolled {
    background: rgba(16,185,129,0.1); color: #10B981;
}
.badge-status.lost {
    background: rgba(239,68,68,0.1); color: #EF4444;
}

/* Buttons in admin panel */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.25s ease;
    text-decoration: none;
    font-family: inherit;
}

.btn-primary {
    background: linear-gradient(135deg, #4F46E5, #7C3AED) !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(79,70,229,0.35) !important;
}

.btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 20px rgba(79,70,229,0.45) !important;
}

.btn-accent {
    background: linear-gradient(135deg, #F59E0B, #EF4444) !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(245,158,11,0.3) !important;
}

.btn-success {
    background: linear-gradient(135deg, #10B981, #059669) !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(16,185,129,0.3) !important;
}

.btn-outline {
    background: transparent !important;
    border: 1.5px solid var(--border) !important;
    color: var(--text-main) !important;
}

.btn-outline:hover {
    border-color: #4F46E5 !important;
    color: #4F46E5 !important;
    background: rgba(79,70,229,0.05) !important;
    transform: translateY(-1px) !important;
    box-shadow: none !important;
}

/* Page content padding */
.page-content {
    padding: 28px 32px;
}

/* Top bar improved */
.top-bar {
    background: var(--surface) !important;
    border-radius: 0 !important;
    margin-bottom: 0 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    border: none !important;
    border-bottom: 1px solid var(--border) !important;
}

.top-bar h1 {
    background: none !important;
    -webkit-background-clip: unset !important;
    -webkit-text-fill-color: var(--text-main) !important;
    color: var(--text-main) !important;
    font-size: 20px !important;
    font-weight: 700 !important;
}

/* Active sidebar link highlight */
.sidebar-nav a.active {
    background: var(--accent) !important;
    color: #1A1A2E !important;
    font-weight: 700 !important;
}

[data-theme="dark"] .sidebar-nav a.active {
    background: rgba(212, 175, 55, 0.9) !important;
    color: #0F172A !important;
}
"""

with open(r"c:\Users\Samad\Desktop\TIL USER BOT\web\frontend\app.css", "a", encoding="utf-8") as f:
    f.write("\n" + css_final)
print("Final CSS polish appended!")
