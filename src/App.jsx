import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import QRScanner from './components/Attendance/QRScanner'
import QRGenerator from './components/Attendance/QRGenerator'
import FaceRegistration from './components/FaceRecognition/FaceRegistration'
import FaceAttendance from './components/FaceRecognition/FaceAttendance'

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function Dashboard({ user, onLogout }) {
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showQRGenerator, setShowQRGenerator] = useState(false)
  const [attendanceMessage, setAttendanceMessage] = useState('')

  // Face Recognition States
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)
  const [showFaceAttendance, setShowFaceAttendance] = useState(false)
  const [faceRegistered, setFaceRegistered] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(res => res.json())
      .then(data => setBackendStatus(`✅ ${data.message}`))
      .catch(() => setBackendStatus('❌ Backend not connected'))
  }, [])

  useEffect(() => {
    if (user) {
      checkFaceRegistration()
    }
  }, [user])

  const checkFaceRegistration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/face/registered`)
      const result = await response.json()
      
      if (result.success) {
        const userRegistered = result.data.some(student => student.studentId === user.id)
        setFaceRegistered(userRegistered)
      }
    } catch (error) {
      console.error('Error checking face registration:', error)
    }
  }

  const handleFaceRegistrationComplete = (data) => {
    setFaceRegistered(true)
    setShowFaceRegistration(false)
    setAttendanceMessage('✅ Face registration completed! You can now use face recognition for attendance.')
  }

  const handleFaceAttendanceSuccess = (result) => {
    setShowFaceAttendance(false)
    setAttendanceMessage(`✅ Attendance marked via face recognition! ${result.classInfo ? `(${result.classInfo.presentCount}/${result.classInfo.totalCount} present)` : ''}`)
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
        setAttendanceMessage(`✅ Attendance marked for ${result.classInfo.name}! (${result.classInfo.presentCount}/${result.classInfo.totalCount} present)`)
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
        <h1 style={{ color: '#2563eb', margin: 0 }}>
          🎓 Smart Attendance System
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b' }}>
            Welcome, <strong>{user.name}</strong> ({user.role})
          </span>
          <button
            onClick={onLogout}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
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
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{attendanceMessage}</span>
            <button
              onClick={() => setAttendanceMessage('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #bfdbfe'
          }}>
            <h3 style={{ color: '#1e40af', marginTop: 0 }}>🔄 System Status</h3>
            <p><strong>Backend:</strong> {backendStatus}</p>
            <p><strong>User:</strong> ✅ Authenticated as {user.role}</p>
            <p><strong>Face Recognition:</strong> {faceRegistered ? '✅ Registered' : '⏳ Not Registered'}</p>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '2px solid #bbf7d0'
          }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>📊 Today's Stats</h3>
            <p><strong>Classes:</strong> 4 scheduled</p>
            <p><strong>Attendance:</strong> 85% average</p>
            <p><strong>Methods:</strong> QR Code + Face Recognition</p>
          </div>
        </div>

        {/* Student Dashboard */}
        {user.role === 'student' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #fbbf24'
          }}>
            <h3 style={{ color: '#92400e', marginTop: 0 }}>🎯 Student Dashboard</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                <h4>📅 Today's Schedule</h4>
                <ul>
                  <li>9:00 AM - Mathematics</li>
                  <li>11:00 AM - Physics</li>
                  <li>2:00 PM - <span style={{color: '#059669'}}>Free Period</span></li>
                  <li>3:00 PM - Computer Science</li>
                </ul>
              </div>

              <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px' }}>
                <h4>✨ Personalized Tasks</h4>
                <ul>
                  <li>📚 Practice DSA problems (30 min)</li>
                  <li>🤖 Watch ML tutorial (25 min)</li>
                  <li>💻 Build React component (35 min)</li>
                </ul>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setShowQRScanner(true)}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📱 Scan QR Code
              </button>
              
              <button 
                onClick={() => {
                  if (faceRegistered) {
                    setShowFaceAttendance(true)
                  } else {
                    setShowFaceRegistration(true)
                  }
                }}
                style={{
                  background: faceRegistered ? '#10b981' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {faceRegistered ? '📷 Face Check-in' : '👤 Register Face'}
              </button>
            </div>
          </div>
        )}

        {/* Teacher Dashboard */}
        {user.role === 'teacher' && (
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            border: '2px solid #a78bfa'
          }}>
            <h3 style={{ color: '#7c3aed', marginTop: 0 }}>👨‍🏫 Teacher Dashboard</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#f3e8ff', borderRadius: '8px' }}>
                <h4>📋 Current Class</h4>
                <p><strong>Subject:</strong> Computer Science</p>
                <p><strong>Students:</strong> 45 enrolled</p>
                <p><strong>Present:</strong> 38 (84%)</p>
              </div>

              <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '8px' }}>
                <h4>⏰ Real-time Attendance</h4>
                <p>✅ 38 students marked present</p>
                <p>⏳ 7 students not yet marked</p>
                <p>🕐 Class started 15 min ago</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowQRGenerator(true)}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🔍 Generate QR Code
              </button>
              
              <button style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
                📊 View Reports
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQRScanner && (
        <QRScanner 
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showQRGenerator && (
        <QRGenerator 
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
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
