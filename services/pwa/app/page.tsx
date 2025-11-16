export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F3F4F6'
    }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1F2937', marginBottom: '1rem' }}>
          School Safety Kiosk
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6B7280', marginBottom: '2rem' }}>
          Navigate to /kiosk/[school-slug] to access a school's reporting kiosk
        </p>
        <a
          href="/kiosk/demo-school"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            fontWeight: '500',
            color: 'white',
            backgroundColor: '#3B82F6',
            textDecoration: 'none',
            borderRadius: '0.5rem'
          }}
        >
          View Demo Kiosk
        </a>
      </div>
    </div>
  );
}
