import { useState } from 'react'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Demo login logic
      if (email === 'student@sih.edu' && password === 'password123') {
        const userData = {
          id: 1,
          name: 'John Doe',
          email: email,
          role: role
        }
        localStorage.setItem('token', 'demo-token-123')
        localStorage.setItem('user', JSON.stringify(userData))
        onLogin(userData)
      } else {
        setError('Invalid credentials. Use demo credentials.')
      }
    } catch (error) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1F2127 0%, #181B21 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2A2D35, #33373F)',
        borderRadius: '20px',
        padding: '3rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(64, 70, 81, 0.3)',
        border: '1px solid #404651',
        position: 'relative',
        animation: 'fadeInUp 0.6s ease'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #017E6E, #00A693)',
          borderRadius: '20px 20px 0 0'
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #017E6E, #00A693)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
            boxShadow: '0 0 20px rgba(1, 126, 110, 0.3)'
          }}>
            🎓
          </div>
          <h1 style={{
            color: '#FFFFFF',
            fontSize: '1.75rem',
            fontWeight: '700',
            margin: '0 0 0.5rem 0'
          }}>
            Smart Attendance
          </h1>
          <p style={{
            color: '#B8BCC8',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#EF4444',
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: '2px solid #404651',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#017E6E'
                e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#404651'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: '2px solid #404651',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#017E6E'
                e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#404651'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: '2px solid #404651',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#017E6E'
                e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#404651'
                e.target.style.boxShadow = 'none'
              }}
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '1rem',
              background: isLoading ? '#567274' : 'linear-gradient(135deg, #017E6E, #00A693)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '48px',
              boxShadow: isLoading ? 'none' : '0 4px 15px rgba(1, 126, 110, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(1, 126, 110, 0.6)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(1, 126, 110, 0.4)'
              }
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #FFFFFF',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>🔐</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(1, 126, 110, 0.1)',
          border: '1px solid rgba(1, 126, 110, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h4 style={{
            color: '#00A693',
            fontSize: '0.875rem',
            fontWeight: '600',
            margin: '0 0 0.5rem 0'
          }}>
            🧪 Demo Credentials:
          </h4>
          <p style={{
            color: '#B8BCC8',
            fontSize: '0.8rem',
            margin: '0',
            fontFamily: 'monospace'
          }}>
            <strong style={{ color: '#FFFFFF' }}>student@sih.edu</strong> / <strong style={{ color: '#FFFFFF' }}>password123</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem 0',
          borderTop: '1px solid #404651'
        }}>
          <p style={{
            color: '#8B92A9',
            fontSize: '0.8rem',
            margin: 0
          }}>
            Secure • Professional • Reliable
          </p>
        </div>
      </div>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          input::placeholder,
          select option {
            color: #8B92A9 !important;
          }

          select option {
            background: #33373F !important;
            color: #FFFFFF !important;
          }

          @media (max-width: 480px) {
            div[style*="padding: 3rem"] {
              padding: 2rem !important;
            }
          }
        `
      }} />
    </div>
  )
}

export default Login
