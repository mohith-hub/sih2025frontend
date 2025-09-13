import { useState } from 'react'
import QRCode from 'react-qr-code'

function QRCodeGenerator({ user, onClose }) {
  const [qrData, setQrData] = useState('')
  const [classInfo, setClassInfo] = useState({
    classId: '',
    className: '',
    location: '',
    duration: 30 // minutes
  })

  const generateQRCode = () => {
    const attendanceData = {
      classId: classInfo.classId,
      className: classInfo.className,
      teacherId: user.id,
      teacherName: user.name,
      timestamp: Date.now(),
      expiresAt: Date.now() + (classInfo.duration * 60 * 1000), // expires after duration
      location: classInfo.location
    }
    
    const qrString = JSON.stringify(attendanceData)
    setQrData(qrString)
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      
      const link = document.createElement('a')
      link.download = `attendance-qr-${classInfo.classId}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>👨‍🏫</span>
            Generate Attendance QR Code
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: qrData ? '1fr 1fr' : '1fr', 
          gap: '2rem' 
        }}>
          
          {/* Left Side - Form */}
          <div>
            <h3 style={{ marginTop: 0, color: '#374151' }}>📝 Class Information:</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Class ID:
              </label>
              <input
                type="text"
                value={classInfo.classId}
                onChange={(e) => setClassInfo({...classInfo, classId: e.target.value})}
                placeholder="e.g. CS101-2025"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Class Name:
              </label>
              <input
                type="text"
                value={classInfo.className}
                onChange={(e) => setClassInfo({...classInfo, className: e.target.value})}
                placeholder="e.g. Computer Science"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Location:
              </label>
              <input
                type="text"
                value={classInfo.location}
                onChange={(e) => setClassInfo({...classInfo, location: e.target.value})}
                placeholder="e.g. Room A101"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                QR Code Valid For (minutes):
              </label>
              <select
                value={classInfo.duration}
                onChange={(e) => setClassInfo({...classInfo, duration: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px'
                }}
              >
                <option value={10}>10 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <button
              onClick={generateQRCode}
              disabled={!classInfo.classId || !classInfo.className}
              style={{
                background: (!classInfo.classId || !classInfo.className) ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                cursor: (!classInfo.classId || !classInfo.className) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                width: '100%',
                marginBottom: '1rem'
              }}
            >
              🎯 Generate QR Code
            </button>

            {qrData && (
              <button
                onClick={downloadQR}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                💾 Download QR Code
              </button>
            )}
          </div>

          {/* Right Side - QR Code */}
          {qrData && (
            <div>
              <h3 style={{ marginTop: 0, color: '#374151' }}>📱 Generated QR Code:</h3>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: '3px solid #3b82f6',
                borderRadius: '12px',
                padding: '2rem',
                background: '#f8fafc'
              }}>
                <QRCode 
                  id="qr-code-svg"
                  value={qrData} 
                  size={200}
                  style={{
                    height: 'auto',
                    maxWidth: '100%',
                    width: '100%',
                    background: 'white',
                    padding: '10px',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div style={{
                background: '#f0f9ff',
                padding: '1rem',
                borderRadius: '6px',
                marginTop: '1rem',
                fontSize: '0.9rem'
              }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#1e40af' }}>
                  📋 Instructions for Students:
                </p>
                <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#374151' }}>
                  <li>Open the attendance app</li>
                  <li>Click "Scan QR Code"</li>
                  <li>Point camera at this QR code</li>
                  <li>Attendance will be marked automatically</li>
                </ul>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
                  ⏰ This QR code expires in {classInfo.duration} minutes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default QRCodeGenerator
