import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import QRScanner from './components/Attendance/QRScanner'
import QRGenerator from './components/Attendance/QRGenerator'
import FaceRegistration from './components/FaceRecognition/FaceRegistration'
import FaceAttendance from './components/FaceRecognition/FaceAttendance'

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
    setFaceRegistered(false) // Reset to false first
    
    try {
      console.log('🔍 Checking face registration for user ID:', user.id)
      
      const response = await fetch(`${API_BASE_URL}/face/registered/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      console.log('📥 Response status:', response.status)

      if (response.status === 200) {
        const result = await response.json()
        console.log('📥 Response data:', result)
        
        if (result.success && result.data && result.data.faceData && result.data.faceData.length > 0) {
          console.log('✅ Face data found - user is registered')
          setFaceRegistered(true)
        } else {
          console.log('❌ No valid face data found')
          setFaceRegistered(false)
        }
      } else if (response.status === 404) {
        console.log('❌ User not found in face database - not registered')
        setFaceRegistered(false)
      } else {
        console.log('❌ Unexpected response status:', response.status)
        setFaceRegistered(false)
      }
    } catch (error) {
      console.error('❌ Error checking face registration:', error)
      setFaceRegistered(false)
    } finally {
      setCheckingFaceReg(false)
    }
  }

  // ✅ CORRECT FACE BUTTON LOGIC
  const handleFaceButtonClick = () => {
    console.log('👤 Face button clicked')
    console.log('🔍 Current faceRegistered state:', faceRegistered)
    console.log('🔍 Current checking state:', checkingFaceReg)
    
    if (checkingFaceReg) {
      console.log('⏳ Still checking registration status, please wait...')
      return
    }
    
    if (faceRegistered) {
      console.log('✅ User is registered → Opening Face Attendance')
      setShowFaceAttendance(true)
    } else {
      console.log('📝 User is NOT registered → Opening Face Registration')
      setShowFaceRegistration(true)
    }
  }

  // Force registration (for debugging)
  const forceRegistration = () => {
    console.log('🔧 Force opening registration')
    setFaceRegistered(false)
    setShowFaceAttendance(false) // Make sure attendance modal is closed
    setShowFaceRegistration(true) // Force open registration
  }

  const handleFaceRegistrationComplete = (data) => {
    console.log('✅ Face registration completed:', data)
    setFaceRegistered(true)
    setShowFaceRegistration(false)
    setAttendanceMessage('✅ Face registration completed successfully! You can now use face recognition.')
  }

  const handleFaceAttendanceSuccess = (result) => {
    console.log('✅ Face attendance success:', result)
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
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Navigation */}
      <nav style={{
        background: 'white',
        padding: '1rem 2rem',
        borderBottom: '2px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ color: '#2563eb', margin: 0 }}>🎓 Smart Attendance System</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b' }}>
            Welcome, <strong>{user.name}</strong> ({user.role})
          </span>
          <button onClick={onLogout} style={{
            background: '#ef4444', color: 'white', border: 'none',
            padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer'
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Attendance Message */}
      {attendanceMessage && (
        <div style={{
          padding: '1rem 2rem',
          background: attendanceMessage.includes('✅') ? '#dcfce7' : '#fee2e2',
          borderBottom: attendanceMessage.includes('✅') ? '2px solid #16a34a' : '2px solid #dc2626'
        }}>
          <div style={{
            maxWidth: '1200px', margin: '0 auto', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{attendanceMessage}</span>
            <button onClick={() => setAttendanceMessage('')} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem'
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* System Status */}
        <div style={{
          background: 'white', padding: '1.5rem', borderRadius: '12px',
          border: '2px solid #bfdbfe', marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#1e40af', marginTop: 0 }}>🔄 System Status</h3>
          <p><strong>Backend:</strong> {backendStatus}</p>
          <p><strong>User:</strong> ✅ Authenticated as {user.role}</p>
          {user.role === 'student' && (
            <div>
              <p><strong>Face Recognition:</strong> {
                checkingFaceReg ? '🔄 Checking...' : 
                faceRegistered ? '✅ Registered' : '❌ Not Registered'
              }</p>
              
              {/* Debug Info */}
              <div style={{
                background: '#f8fafc', padding: '0.5rem', borderRadius: '4px',
                fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem'
              }}>
                <strong>Debug:</strong> faceRegistered={faceRegistered.toString()}, 
                checking={checkingFaceReg.toString()}
              </div>
            </div>
          )}
        </div>

        {/* TEACHER DASHBOARD */}
        {user.role === 'teacher' && (
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            border: '2px solid #a78bfa'
          }}>
            <h2 style={{ color: '#7c3aed', marginTop: 0 }}>👨‍🏫 Teacher Dashboard</h2>
            
            <button onClick={() => setShowQRGenerator(true)} style={{
              background: '#8b5cf6', color: 'white', border: 'none',
              padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer',
              fontSize: '1.1rem', fontWeight: 'bold'
            }}>
              📱 Generate QR Code for Class
            </button>
          </div>
        )}

        {/* STUDENT DASHBOARD */}
        {user.role === 'student' && (
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '12px',
            border: '2px solid #fbbf24'
          }}>
            <h2 style={{ color: '#92400e', marginTop: 0 }}>👨‍🎓 Student Dashboard</h2>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={() => setShowQRScanner(true)} style={{
                background: '#3b82f6', color: 'white', border: 'none',
                padding: '1rem 2rem', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '1rem'
              }}>
                📱 Scan Teacher's QR Code
              </button>
              
              <button 
                onClick={handleFaceButtonClick}
                disabled={checkingFaceReg}
                style={{
                  background: checkingFaceReg ? '#9ca3af' : 
                            faceRegistered ? '#10b981' : '#f59e0b',
                  color: 'white', border: 'none',
                  padding: '1rem 2rem', borderRadius: '8px',
                  cursor: checkingFaceReg ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold', fontSize: '1rem'
                }}
              >
                {checkingFaceReg ? '🔄 Checking...' :
                 faceRegistered ? '📷 Face Check-in' : '👤 Register Face'}
              </button>
              
              {/* Debug/Force button */}
              <button onClick={forceRegistration} style={{
                background: '#ef4444', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.8rem'
              }}>
                🔧 Force Register
              </button>
            </div>

            {/* Clear buttons for debugging */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => {
                console.log('🧹 Clearing all face data')
                fetch(`${API_BASE_URL}/face/clear-all`, { method: 'DELETE' })
                  .then(() => {
                    setFaceRegistered(false)
                    alert('All face data cleared')
                  })
              }} style={{
                background: '#dc2626', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                fontSize: '0.8rem'
              }}>
                🗑️ Clear All Face Data
              </button>
              
              <button onClick={checkFaceRegistrationStatus} style={{
                background: '#0ea5e9', color: 'white', border: 'none',
                padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                fontSize: '0.8rem'
              }}>
                🔄 Recheck Registration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS - CORRECT CONDITIONAL RENDERING */}
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

      {/* ✅ FACE REGISTRATION MODAL */}
      {showFaceRegistration && (
        <FaceRegistration
          user={user}
          onComplete={handleFaceRegistrationComplete}
          onClose={() => setShowFaceRegistration(false)}
        />
      )}

      {/* ✅ FACE ATTENDANCE MODAL */}
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

// Rest of App component remains the same...
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
      <div style={{ 
        display: 'flex', justifyContent: 'center', alignItems: 'center', 
        height: '100vh', fontSize: '1.2rem'
      }}>
        Loading...
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
