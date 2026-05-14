css_overrides2 = """
/* Extra animations for Student and Teacher grids */
.content-grid > *, .stats-grid > *, .my-courses-section, .kpi-grid > * {
    animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
}
.content-grid > *:nth-child(1), .stats-grid > *:nth-child(1), .kpi-grid > *:nth-child(1) { animation-delay: 0.1s; }
.content-grid > *:nth-child(2), .stats-grid > *:nth-child(2), .kpi-grid > *:nth-child(2) { animation-delay: 0.2s; }
.content-grid > *:nth-child(3), .stats-grid > *:nth-child(3), .kpi-grid > *:nth-child(3) { animation-delay: 0.3s; }
.content-grid > *:nth-child(4), .stats-grid > *:nth-child(4), .kpi-grid > *:nth-child(4) { animation-delay: 0.4s; }
.content-grid > *:nth-child(5), .stats-grid > *:nth-child(5), .kpi-grid > *:nth-child(5) { animation-delay: 0.5s; }
.content-grid > *:nth-child(6), .stats-grid > *:nth-child(6), .kpi-grid > *:nth-child(6) { animation-delay: 0.6s; }

/* Modal Enchancement */
.modal-content {
    background: var(--glass-bg) !important;
    backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    border-radius: 24px;
}
"""

with open(r"c:\Users\Samad\Desktop\TIL USER BOT\web\frontend\app.css", "a", encoding="utf-8") as f:
    f.write("\n" + css_overrides2)
print("CSS overrides 2 appended successfully!")
