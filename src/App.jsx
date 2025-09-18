import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import QRScanner from './components/Attendance/QRScanner'
import QRGenerator from './components/Attendance/QRGenerator'
import FaceRegistration from './components/FaceRecognition/FaceRegistration'
import FaceAttendance from './components/FaceRecognition/FaceAttendance'
import './styles/responsive.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function Dashboard({ user, onLogout }) {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [attendanceMessage, setAttendanceMessage] = useState('')
  
  // Modal states
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)
  const [showFaceAttendance, setShowFaceAttendance] = useState(false)
  
  // Face registration states
  const [faceRegistered, setFaceRegistered] = useState(false)
  const [checkingFaceReg, setCheckingFaceReg] = useState(false)

  // Updated styles with new color scheme
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text-primary)'
    },
    nav: {
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow)'
    },
    title: {
      color: 'var(--secondary)',
      margin: 0,
      fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
      fontWeight: 'bold'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      color: 'var(--text-secondary)'
    },
    logoutBtn: {
      backgroundColor: 'var(--danger)',
      color: 'var(--text-primary)',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    },
    content: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: 'var(--shadow)'
    },
    cardHeader: {
      color: 'var(--secondary)',
      marginTop: 0,
      marginBottom: '1.5rem',
      fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)'
    },
    statusItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.95rem'
    },
    button: {
      padding: '1rem 2rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '1rem',
      minHeight: '48px',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    primaryBtn: {
      backgroundColor: 'var(--secondary)',
      color: 'var(--text-primary)'
    },
    secondaryBtn: {
      backgroundColor: 'var(--accent)',
      color: 'var(--text-primary)'
    },
    warningBtn: {
      backgroundColor: 'var(--warning)',
      color: 'var(--text-primary)'
    },
    dangerBtn: {
      backgroundColor: 'var(--danger)',
      color: 'var(--text-primary)'
    },
    disabledBtn: {
      backgroundColor: 'var(--button-disabled)',
      color: 'var(--button-disabled-text)',
      cursor: 'not-allowed'
    },
    infoCard: {
      backgroundColor: 'rgba(1, 126, 110, 0.1)',
      border: '1px solid var(--secondary)',
      borderRadius: '8px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }
  }

  // ... (keep all your existing useEffect and function implementations)
  
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(`✅ ${data.message}`))
      .catch(() => setBackendStatus('❌ Backend not connected'))
  }, [])

  useEffect(() => {
    if (user && user.role === 'student') {
      checkFaceRegistrationStatus()
    }
  }, [user])

  const checkFaceRegistrationStatus = async () => {
    setCheckingFaceReg(true)
    setFaceRegistered(false)
    
    try {
      const response = await fetch(`${API_BASE_URL}/face/registered/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.status === 200) {
        const result = await response.json()
        if (result.success && result.data && result.data.faceData && result.data.faceData.length > 0) {
          setFaceRegistered(true)
        } else {
          setFaceRegistered(false)
        }
      } else {
        setFaceRegistered(false)
      }
    } catch (error) {
      setFaceRegistered(false)
    } finally {
      setCheckingFaceReg(false)
    }
  }

  const handleFaceButtonClick = () => {
    if (checkingFaceReg) return
    
    if (faceRegistered) {
      setShowFaceAttendance(true)
    } else {
      setShowFaceRegistration(true)
    }
  }

  const forceRegistration = () => {
    setFaceRegistered(false)
    setShowFaceAttendance(false)
    setShowFaceRegistration(true)
  }

  const handleFaceRegistrationComplete = (data) => {
    setFaceRegistered(true)
    setShowFaceRegistration(false)
    setAttendanceMessage('✅ Face registration completed successfully!')
  }

  const handleFaceAttendanceSuccess = (result) => {
    setShowFaceAttendance(false)
    setAttendanceMessage('✅ Attendance marked via face recognition!')
  }

  const handleQRScanSuccess = async (qrData) => {
    setShowQRScanner(false)
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          qrData,
          studentId: user.id,
          method: 'qr'
        })
      })

      const result = await response.json()
      if (result.success) {
        setAttendanceMessage(`✅ Attendance marked for ${qrData.className}!`)
      } else {
        setAttendanceMessage(`❌ ${result.message}`)
      }
    } catch (error) {
      setAttendanceMessage(`❌ Failed to mark attendance: ${error.message}`)
    }
  }

  return (
    <div style={styles.container}>
      {/* Dark Theme Navigation */}
      <nav style={styles.nav}>
        <h1 style={styles.title}>
          🎓 Smart Attendance System
        </h1>
        <div style={styles.userInfo}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({user.role})</span>
          </div>
          <button 
            onClick={onLogout}
            style={styles.logoutBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--danger)'}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Success/Error Messages with Dark Theme */}
      {attendanceMessage && (
        <div style={{
          padding: '1rem 2rem',
          backgroundColor: attendanceMessage.includes('✅') ? 'rgba(1, 126, 110, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          borderBottom: `2px solid ${attendanceMessage.includes('✅') ? 'var(--secondary)' : 'var(--danger)'}`,
          color: attendanceMessage.includes('✅') ? 'var(--secondary)' : 'var(--danger)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{attendanceMessage}</span>
            <button
              onClick={() => setAttendanceMessage('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '1.2rem',
                color: 'inherit',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content with Dark Theme */}
      <div style={styles.content}>
        
        {/* System Status Card */}
        <div style={styles.card}>
          <h3 style={styles.cardHeader}>🔄 System Status</h3>
          <div style={styles.statusItem}>
            <strong>Backend:</strong>
            <span>{backendStatus}</span>
          </div>
          <div style={styles.statusItem}>
            <strong>User:</strong>
            <span>✅ Authenticated as {user.role}</span>
          </div>
          {user.role === 'student' && (
            <div style={styles.statusItem}>
              <strong>Face Recognition:</strong>
              <span>
                {checkingFaceReg ? '🔄 Checking...' : 
                 faceRegistered ? '✅ Registered' : '❌ Not Registered'}
              </span>
            </div>
          )}
        </div>

        {/* TEACHER DASHBOARD - Dark Theme */}
        {user.role === 'teacher' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>👨‍🏫</span>
              <h2 style={{ ...styles.cardHeader, margin: 0 }}>Teacher Dashboard</h2>
            </div>
            
            <div style={styles.infoCard}>
              <h3 style={{ color: 'var(--secondary)', margin: '0 0 1rem 0' }}>🎯 Generate QR Code</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Create a QR code for students to scan and mark their attendance for your class.
              </p>
              
              <button
                onClick={() => setShowQRGenerator(true)}
                style={{
                  ...styles.button,
                  ...styles.primaryBtn,
                  width: '100%'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
              >
                📱 Generate QR Code for Class
              </button>
            </div>
          </div>
        )}

        {/* STUDENT DASHBOARD - Dark Theme */}
        {user.role === 'student' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '2rem' }}>👨‍🎓</span>
              <h2 style={{ ...styles.cardHeader, margin: 0 }}>Student Dashboard</h2>
            </div>
            
            <div style={styles.infoCard}>
              <h3 style={{ color: 'var(--secondary)', margin: '0 0 1rem 0' }}>📱 Mark Your Attendance</h3>
              <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Choose your preferred method to mark attendance for class.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                  onClick={() => setShowQRScanner(true)} 
                  style={{
                    ...styles.button,
                    ...styles.primaryBtn
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--secondary-hover)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--secondary)'}
                >
                  📱 Scan Teacher's QR Code
                </button>
                
                <button 
                  onClick={handleFaceButtonClick}
                  disabled={checkingFaceReg}
                  style={{
                    ...styles.button,
                    ...(checkingFaceReg ? styles.disabledBtn : 
                        faceRegistered ? styles.secondaryBtn : styles.warningBtn)
                  }}
                >
                  {checkingFaceReg ? '🔄 Checking...' :
                   faceRegistered ? '📷 Face Recognition Check-in' : '👤 Register Face First'}
                </button>
              </div>
              
              {/* Debug Controls */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                  onClick={forceRegistration} 
                  style={{
                    ...styles.button,
                    ...styles.dangerBtn,
                    fontSize: '0.875rem',
                    padding: '0.75rem 1rem'
                  }}
                >
                  🔧 Force Register
                </button>
                
                <button 
                  onClick={() => {
                    fetch(`${API_BASE_URL}/face/clear-all`, { method: 'DELETE' })
                      .then(() => {
                        setFaceRegistered(false)
                        alert('All face data cleared')
                      })
                  }} 
                  style={{
                    ...styles.button,
                    ...styles.dangerBtn,
                    fontSize: '0.875rem',
                    padding: '0.75rem 1rem'
                  }}
                >
                  🗑️ Clear Data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals with Dark Theme */}
      {showQRScanner && (
        <QRScanner 
          user={user}
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showQRGenerator && (
        <QRGenerator 
          user={user}
          onClose={() => setShowQRGenerator(false)}
        />
      )}

      {showFaceRegistration && (
        <FaceRegistration
          user={user}
          onComplete={handleFaceRegistrationComplete}
          onClose={() => setShowFaceRegistration(false)}
        />
      )}

      {showFaceAttendance && (
        <FaceAttendance
          user={user}
          onSuccess={handleFaceAttendanceSuccess}
          onClose={() => setShowFaceAttendance(false)}
        />
      )}
    </div>
  )
}

// ... (keep existing App component)
function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeUser('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--background)',
        color: 'var(--text-primary)',
        fontSize: '1.2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--border)',
            borderTop: '4px solid var(--secondary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          Loading Smart Attendance System...
        </div>
      </div>
    )
  }

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <Login onLogin={handleLogin} />
  )
}

export default App
