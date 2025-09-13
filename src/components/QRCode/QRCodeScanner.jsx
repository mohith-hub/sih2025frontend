import { useState } from 'react'
import { QrReader } from 'react-qr-reader'

function QRCodeScanner({ user, onScanSuccess, onClose }) {
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState('')

  const handleScanResult = (result, error) => {
    if (result) {
      try {
        const qrData = JSON.parse(result?.text)
        
        // Check if QR code has expired
        if (qrData.expiresAt && Date.now() > qrData.expiresAt) {
          setError('This QR code has expired. Please ask your teacher for a new one.')
          return
        }

        console.log('✅ QR Code scanned successfully:', qrData)
        setScanning(false)
        
        // Submit attendance
        submitAttendance(qrData)
        
      } catch (err) {
        console.error('❌ Invalid QR code data:', err)
        setError('Invalid QR code format. Please try again.')
      }
    }

    if (error) {
      console.log('Scanning...', error?.message)
    }
  }

  const submitAttendance = async (qrData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          method: 'qr',
          qrData: qrData,
          scannedAt: Date.now()
        })
      })

      const result = await response.json()

      if (result.success) {
        onScanSuccess({
          ...result,
          classInfo: {
            className: qrData.className,
            classId: qrData.classId,
            teacherName: qrData.teacherName,
            location: qrData.location
          }
        })
      } else {
        setError('Attendance marking failed: ' + result.message)
        setScanning(true)
      }
    } catch (error) {
      console.error('Attendance submission error:', error)
      setError('Failed to submit attendance. Please try again.')
      setScanning(true)
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualCode.trim()) {
      try {
        const qrData = JSON.parse(manualCode)
        submitAttendance(qrData)
      } catch (err) {
        setError('Invalid JSON format. Please check your input.')
      }
    }
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
        maxWidth: '600px',
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
            <span>👨‍🎓</span>
            Scan Attendance QR Code
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

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          background: '#f0f9ff',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #bfdbfe'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>
            📋 How to mark attendance:
          </h3>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Point your camera at the teacher's QR code</li>
            <li>Keep the QR code centered in the scanning frame</li>
            <li>Wait for automatic detection</li>
            <li>Your attendance will be marked instantly!</li>
          </ol>
        </div>

        {/* Camera Scanner */}
        {scanning && !showManualEntry && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{
              border: '3px solid #10b981',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <QrReader
                onResult={handleScanResult}
                constraints={{ 
                  facingMode: 'environment' 
                }}
                style={{ 
                  width: '100%',
                  height: '300px'
                }}
                videoStyle={{
                  objectFit: 'cover',
                  width: '100%',
                  height: '300px'
                }}
                scanDelay={300}
              />
              
              {/* Scanning Frame */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                border: '3px solid #ffffff',
                borderRadius: '12px',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-35px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#10b981',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  📱 Scan QR Code Here
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              setError('')
              setScanning(true)
              setShowManualEntry(!showManualEntry)
            }}
            style={{
              background: '#6b7280',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            {showManualEntry ? '📷 Use Camera' : '⌨️ Manual Entry'}
          </button>
        </div>

        {/* Manual Entry Fallback */}
        {showManualEntry && (
          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: '#374151' }}>📝 Manual Entry:</h3>
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Paste QR code data here if camera doesn't work..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  marginBottom: '1rem'
                }}
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                style={{
                  background: !manualCode.trim() ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: !manualCode.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                ✅ Submit Manual Entry
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRCodeScanner
