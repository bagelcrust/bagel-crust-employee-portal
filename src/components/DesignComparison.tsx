import { Link } from 'react-router-dom'

/**
 * DESIGN COMPARISON PAGE
 *
 * Allows easy navigation between three design options:
 * - Option A: Professional/Enterprise
 * - Option B: Refined Glassmorphism
 * - Option C: Flat Minimal
 */

export default function DesignComparison() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '900px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '48px'
        }}>
          <h1 style={{
            fontSize: '42px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '12px',
            letterSpacing: '-1px'
          }}>
            Design Comparison
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.9)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Compare three different design approaches for the Bagel Crust Employee Portal
          </p>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '600px',
            margin: '12px auto 0',
            fontStyle: 'italic'
          }}>
            Login with PIN: 0000 to test each design
          </p>
        </div>

        {/* Design Options Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Option A */}
          <Link to="/design-a" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.borderColor = '#2C5282'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
              e.currentTarget.style.borderColor = 'transparent'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#2C5282',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                fontSize: '24px'
              }}>
                A
              </div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1A202C',
                marginBottom: '8px'
              }}>
                Professional
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '12px'
              }}>
                Clean corporate design with muted colors and minimal effects. Professional interface for employee self-service.
              </p>
              <ul style={{
                fontSize: '13px',
                color: '#A0AEC0',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>4-6px border radius</li>
                <li>Desaturated palette</li>
                <li>No glass effects</li>
                <li>Enterprise feel</li>
              </ul>
            </div>
          </Link>

          {/* Option B */}
          <Link to="/design-b" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.borderColor = '#2563EB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
              e.currentTarget.style.borderColor = 'transparent'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                fontSize: '24px',
                color: 'white'
              }}>
                B
              </div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1A202C',
                marginBottom: '8px'
              }}>
                Refined Glass
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '12px'
              }}>
                Refined glassmorphism with subtle blur effects. Modern portal design that feels premium and polished.
              </p>
              <ul style={{
                fontSize: '13px',
                color: '#A0AEC0',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>8-10px border radius</li>
                <li>10px blur effects</li>
                <li>90% opacity glass</li>
                <li>Premium modern feel</li>
              </ul>
            </div>
          </Link>

          {/* Option C */}
          <Link to="/design-c" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: '3px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)'
              e.currentTarget.style.borderColor = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)'
              e.currentTarget.style.borderColor = 'transparent'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#000000',
                borderRadius: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                fontSize: '24px',
                color: 'white'
              }}>
                C
              </div>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: '#1A202C',
                marginBottom: '8px'
              }}>
                Flat Minimal
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                lineHeight: '1.6',
                marginBottom: '12px'
              }}>
                Bold flat design with sharp edges and high contrast. Material Design aesthetic for maximum clarity.
              </p>
              <ul style={{
                fontSize: '13px',
                color: '#A0AEC0',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li>0px border radius</li>
                <li>No blur or glass</li>
                <li>High contrast</li>
                <li>Ultra-minimal</li>
              </ul>
            </div>
          </Link>
        </div>

        {/* Back to Original */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/employee-portal"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '500',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            ← Back to Original Employee Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
