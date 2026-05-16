export default function Placeholder({ title }) {
  return (
    <div className="page-content">
      <h1>{title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Страница в разработке</p>
    </div>
  );
}
