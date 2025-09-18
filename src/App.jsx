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
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)
  const [showFaceAttendance, setShowFaceAttendance] = useState(false)
  const [faceRegistered, setFaceRegistered] = useState(false)
  const [checkingFaceReg, setCheckingFaceReg] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(`Smart Attendance API with Face Recognition is running!`))
      .catch(() => setBackendStatus('Backend not connected'))
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      if (response.status === 200) {
        const result = await response.json()
        if (result.success && result.data && result.data.faceData && result.data.faceData.length > 0) {
          setFaceRegistered(true)
        }
      }
    } catch (error) {
      console.error('Face registration check failed:', error)
    } finally {
      setCheckingFaceReg(false)
    }
  }

  const handleFaceButtonClick = () => {
    if (checkingFaceReg) return
    faceRegistered ? setShowFaceAttendance(true) : setShowFaceRegistration(true)
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
    setTimeout(() => setAttendanceMessage(''), 5000)
  }

  const handleFaceAttendanceSuccess = (result) => {
    setShowFaceAttendance(false)
    setAttendanceMessage('✅ Attendance marked via face recognition!')
    setTimeout(() => setAttendanceMessage(''), 5000)
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
        body: JSON.stringify({ qrData, studentId: user.id, method: 'qr' })
      })

      const result = await response.json()
      if (result.success) {
        setAttendanceMessage(`✅ Attendance marked for ${qrData.className}!`)
      } else {
        setAttendanceMessage(`❌ ${result.message}`)
      }
      setTimeout(() => setAttendanceMessage(''), 5000)
    } catch (error) {
      setAttendanceMessage(`❌ Failed to mark attendance: ${error.message}`)
      setTimeout(() => setAttendanceMessage(''), 5000)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Award-Winning Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="navbar-container">
            <a href="#" className="navbar-brand">
              <span>🎓</span>
              <span>Smart Attendance</span>
            </a>
            
            <div className="navbar-user">
              <div className="navbar-user-info">
                <div className="navbar-user-name">{user.name}</div>
                <div className="navbar-user-role">{user.role}</div>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-danger"
                style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
              >
                <span style={{ display: 'none' }} className="hidden">Logout</span>
                <span style={{ fontSize: '1.2rem' }}>🚪</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Toast Notifications */}
      {attendanceMessage && (
        <div className={`toast ${attendanceMessage.includes('✅') ? 'toast-success' : 'toast-error'} animate-fade-in`}>
          <div className="flex items-center justify-between gap-4">
            <span>{attendanceMessage}</span>
            <button
              onClick={() => setAttendanceMessage('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.2rem',
                minHeight: '32px',
                minWidth: '32px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
        
        {/* System Status Card */}
        <div className="card mb-8 animate-fade-in">
          <div className="card-body">
            <div className="card-header">
              <div className="card-icon">🔄</div>
              <h2 className="card-title">System Status</h2>
            </div>
            
            <div className="grid grid-1 gap-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Backend:</span>
                <div className={`status-indicator ${backendStatus.includes('running') ? 'status-success' : 'status-danger'}`}>
                  {backendStatus.includes('running') ? '✅' : '❌'} {backendStatus}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="font-semibold">Authentication:</span>
                <div className="status-indicator status-success">
                  ✅ Authenticated as {user.role}
                </div>
              </div>
              
              {user.role === 'student' && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Face Recognition:</span>
                  <div className={`status-indicator ${
                    checkingFaceReg ? 'status-info' : 
                    faceRegistered ? 'status-success' : 'status-warning'
                  }`}>
                    {checkingFaceReg ? '🔄 Checking...' : 
                     faceRegistered ? '✅ Registered' : '⚠️ Not Registered'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Teacher Dashboard */}
        {user.role === 'teacher' && (
          <div className="card animate-fade-in">
            <div className="card-body">
              <div className="card-header">
                <div className="card-icon">👨‍🏫</div>
                <h2 className="card-title">Teacher Dashboard</h2>
              </div>
              
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, rgba(1, 126, 110, 0.1), rgba(0, 164, 147, 0.05))',
                border: '1px solid rgba(1, 126, 110, 0.3)',
                marginBottom: 0
              }}>
                <div className="card-body">
                  <h3 style={{ color: 'var(--accent-light)', marginBottom: 'var(--space-4)' }}>
                    🎯 Generate QR Code
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: 'var(--space-6)',
                    lineHeight: 1.6 
                  }}>
                    Create a secure QR code for students to scan and mark their attendance. 
                    Each QR code is unique to your class session.
                  </p>
                  
                  <button
                    onClick={() => setShowQRGenerator(true)}
                    className="btn btn-primary btn-lg btn-full"
                  >
                    <span>📱</span>
                    <span>Generate QR Code for Class</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Dashboard */}
        {user.role === 'student' && (
          <div className="card animate-fade-in">
            <div className="card-body">
              <div className="card-header">
                <div className="card-icon">👨‍🎓</div>
                <h2 className="card-title">Student Dashboard</h2>
              </div>
              
              <div className="card" style={{ 
                background: 'linear-gradient(135deg, rgba(1, 126, 110, 0.1), rgba(0, 164, 147, 0.05))',
                border: '1px solid rgba(1, 126, 110, 0.3)',
                marginBottom: 0
              }}>
                <div className="card-body">
                  <h3 style={{ color: 'var(--accent-light)', marginBottom: 'var(--space-4)' }}>
                    📱 Mark Your Attendance
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    marginBottom: 'var(--space-6)',
                    lineHeight: 1.6 
                  }}>
                    Choose your preferred method to mark attendance. Face recognition provides 
                    a faster, contactless experience.
                  </p>
                  
                  <div className="grid grid-1 gap-4 mb-6">
                    <button 
                      onClick={() => setShowQRScanner(true)} 
                      className="btn btn-primary btn-lg"
                    >
                      <span>📱</span>
                      <span>Scan Teacher's QR Code</span>
                    </button>
                    
                    <button 
                      onClick={handleFaceButtonClick}
                      disabled={checkingFaceReg}
                      className={`btn btn-lg ${
                        checkingFaceReg ? 'btn-secondary' : 
                        faceRegistered ? 'btn-success' : 'btn-warning'
                      }`}
                    >
                      <span>
                        {checkingFaceReg ? '🔄' :
                         faceRegistered ? '📷' : '👤'}
                      </span>
                      <span>
                        {checkingFaceReg ? 'Checking Registration...' :
                         faceRegistered ? 'Face Recognition Check-in' : 'Register Face First'}
                      </span>
                    </button>
                  </div>
                  
                  {/* Debug Controls */}
                  <div className="grid grid-2 gap-2">
                    <button 
                      onClick={forceRegistration} 
                      className="btn btn-secondary"
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      <span>🔧</span>
                      <span>Force Register</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        fetch(`${API_BASE_URL}/face/clear-all`, { method: 'DELETE' })
                          .then(() => {
                            setFaceRegistered(false)
                            setAttendanceMessage('🗑️ All face data cleared successfully')
                          })
                      }} 
                      className="btn btn-danger"
                      style={{ fontSize: 'var(--text-sm)' }}
                    >
                      <span>🗑️</span>
                      <span>Clear Data</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied */}
        {!['teacher', 'student'].includes(user.role) && (
          <div className="card animate-fade-in" style={{ borderColor: 'var(--danger)' }}>
            <div className="card-body text-center">
              <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-6)' }}>❌</div>
              <h2 style={{ color: 'var(--danger)', marginBottom: 'var(--space-4)' }}>Access Denied</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                Your role ({user.role}) does not have access to this dashboard.
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                Please contact your administrator for proper role assignment.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
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
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ 
        height: '100vh',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
      }}>
        <div className="text-center animate-fade-in">
          <div className="loading" style={{ 
            width: '80px', 
            height: '80px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            borderRadius: 'var(--radius-xl)',
            margin: '0 auto var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
            animation: 'pulse 2s infinite'
          }}>
            🎓
          </div>
          <h2 style={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--space-2)',
            fontSize: 'var(--text-2xl)'
          }}>
            Loading Smart Attendance System
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Please wait while we initialize the application...
          </p>
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
