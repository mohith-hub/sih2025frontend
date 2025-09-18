import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import QRScanner from './components/Attendance/QRScanner'
import QRGenerator from './components/Attendance/QRGenerator'
import FaceRegistration from './components/FaceRecognition/FaceRegistration'
import FaceAttendance from './components/FaceRecognition/FaceAttendance'
import './styles/responsive.css' // Import our universal CSS

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
    <div className="animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'var(--background)' }}>
      {/* Universal Responsive Navigation */}
      <nav className="bg-surface shadow" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="container">
          <div className="flex items-center justify-between" style={{ minHeight: '64px' }}>
            {/* Logo/Title - Responsive */}
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎓</div>
              <h1 className="font-bold text-primary m-0" style={{
                fontSize: 'clamp(1.1rem, 4vw, 1.5rem)'
              }}>
                <span className="hidden-mobile">Smart Attendance System</span>
                <span className="block-mobile hidden-desktop">Smart Attendance</span>
              </h1>
            </div>

            {/* User Info - Responsive */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden-mobile">
                <div className="font-medium text-sm">{user.name}</div>
                <div className="text-xs text-secondary">({user.role})</div>
              </div>
              <div className="block-mobile hidden-desktop">
                <div className="font-medium text-xs">{user.name}</div>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-danger btn-sm"
              >
                <span className="hidden-mobile">Logout</span>
                <span className="block-mobile hidden-desktop">🚪</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Universal Success/Error Messages */}
      {attendanceMessage && (
        <div 
          className="animate-fade-in"
          style={{
            padding: 'var(--space-4)',
            backgroundColor: attendanceMessage.includes('✅') ? '#dcfce7' : '#fee2e2',
            borderBottom: `2px solid ${attendanceMessage.includes('✅') ? '#16a34a' : '#dc2626'}`,
            color: attendanceMessage.includes('✅') ? '#166534' : '#dc2626'
          }}
        >
          <div className="container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{attendanceMessage}</span>
              </div>
              <button
                onClick={() => setAttendanceMessage('')}
                className="btn btn-sm"
                style={{ 
                  background: 'none', 
                  color: 'inherit',
                  minHeight: 'var(--touch-target)',
                  minWidth: 'var(--touch-target)'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Responsive Content */}
      <main className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-6)' }}>
        
        {/* System Status Card - Universal */}
        <div className="card mb-6 animate-fade-in">
          <div className="card-body">
            <h3 className="text-primary mb-4">🔄 System Status</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-2">
                <strong className="text-sm">Backend:</strong>
                <span className="text-sm">{backendStatus}</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-sm">User:</strong>
                <span className="text-sm">✅ Authenticated as {user.role}</span>
              </div>
              {user.role === 'student' && (
                <div className="flex items-center gap-2">
                  <strong className="text-sm">Face Recognition:</strong>
                  <span className="text-sm">
                    {checkingFaceReg ? '🔄 Checking...' : 
                     faceRegistered ? '✅ Registered' : '❌ Not Registered'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TEACHER DASHBOARD - Universal Responsive */}
        {user.role === 'teacher' && (
          <div className="card animate-fade-in" style={{ borderColor: '#a78bfa' }}>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">👨‍🏫</span>
                <h2 className="text-primary m-0">Teacher Dashboard</h2>
              </div>
              
              <div className="card" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                <div className="card-body">
                  <h3 className="text-primary mb-3">🎯 Generate QR Code</h3>
                  <p className="text-secondary mb-4 text-sm">
                    Create a QR code for students to scan and mark their attendance for your class.
                  </p>
                  
                  <button
                    onClick={() => setShowQRGenerator(true)}
                    className="btn btn-primary btn-full btn-lg"
                  >
                    📱 Generate QR Code for Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDENT DASHBOARD - Universal Responsive */}
        {user.role === 'student' && (
          <div className="card animate-fade-in" style={{ borderColor: '#fbbf24' }}>
            <div className="card-body">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">👨‍🎓</span>
                <h2 className="text-warning m-0" style={{ color: '#92400e' }}>Student Dashboard</h2>
              </div>
              
              <div className="card" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bfdbfe' }}>
                <div className="card-body">
                  <h3 className="text-primary mb-3">📱 Mark Your Attendance</h3>
                  <p className="text-secondary mb-4 text-sm">
                    Choose your preferred method to mark attendance for class.
                  </p>
                  
                  {/* Main Action Buttons */}
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <button 
                      onClick={() => setShowQRScanner(true)} 
                      className="btn btn-primary btn-full btn-lg"
                    >
                      📱 Scan Teacher's QR Code
                    </button>
                    
                    <button 
                      onClick={handleFaceButtonClick}
                      disabled={checkingFaceReg}
                      className={`btn btn-full btn-lg ${
                        checkingFaceReg ? '' : 
                        faceRegistered ? 'btn-secondary' : 'btn-warning'
                      }`}
                      style={{
                        backgroundColor: checkingFaceReg ? 'var(--text-secondary)' : undefined,
                        cursor: checkingFaceReg ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {checkingFaceReg ? '🔄 Checking Registration...' :
                       faceRegistered ? '📷 Face Recognition Check-in' : '👤 Register Face First'}
                    </button>
                  </div>
                  
                  {/* Debug/Test Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={forceRegistration} 
                      className="btn btn-danger btn-sm"
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
                      className="btn btn-danger btn-sm"
                    >
                      🗑️ Clear Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied - Universal */}
        {!['teacher', 'student'].includes(user.role) && (
          <div className="card animate-fade-in" style={{ borderColor: '#ef4444' }}>
            <div className="card-body text-center">
              <div className="text-4xl mb-4">❌</div>
              <h2 className="text-danger mb-3">Access Denied</h2>
              <p className="text-secondary">
                Your role ({user.role}) does not have access to this dashboard.
              </p>
              <p className="text-secondary text-sm">
                Please contact your administrator for proper role assignment.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Universal Modals - Will be styled responsively */}
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

// Universal Responsive App Component
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
      <div className="flex items-center justify-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div 
            className="animate-spin rounded-full border-4 border-primary mb-4"
            style={{ 
              width: '60px', 
              height: '60px',
              borderTopColor: 'transparent',
              margin: '0 auto'
            }}
          />
          <p className="text-lg font-medium">Loading Smart Attendance System...</p>
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
