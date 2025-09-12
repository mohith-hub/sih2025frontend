import { useState, useRef, useEffect } from 'react'

function QRScanner({ onScanSuccess, onClose }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const videoRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setScanning(true)
        scanQRCode()
      }
    } catch (err) {
      setError('Camera access denied. Use manual entry instead.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
    }
  }

  const scanQRCode = () => {
    // Simulate QR scanning (in real app, use qr-scanner library)
    const interval = setInterval(() => {
      if (!scanning) {
        clearInterval(interval)
        return
      }

      // Mock QR detection - replace with actual QR scanning
      if (Math.random() > 0.95) { // 5% chance to "detect" QR
        const mockQRData = {
          classId: 'CS101-2025',
          className: 'Computer Science',
          teacherId: 'teacher_1',
          timestamp: Date.now(),
          location: 'Room A101'
        }
        
        clearInterval(interval)
        setScanning(false)
        onScanSuccess(mockQRData)
      }
    }, 500)
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualCode.trim()) {
      try {
        const qrData = JSON.parse(manualCode)
        onScanSuccess(qrData)
      } catch (err) {
        setError('Invalid QR code format')
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
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>📱 Scan QR Code</h2>
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

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}

        {/* Camera View */}
        <div style={{ marginBottom: '1.5rem' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '300px',
              background: '#f3f4f6',
              borderRadius: '8px',
              display: scanning ? 'block' : 'none'
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {scanning && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: '2px solid #3b82f6',
              width: '200px',
              height: '200px',
              borderRadius: '12px'
            }}>
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#3b82f6',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem'
              }}>
                Position QR code here
              </div>
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Or Enter Manually:</h3>
          <form onSubmit={handleManualSubmit}>
            <textarea
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Paste QR code data here..."
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #d1d5db',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.9rem'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                marginTop: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Submit Manual Entry
            </button>
          </form>
        </div>

        {/* Demo QR Code */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8' }}>🔗 Demo QR Code:</h4>
          <code style={{ 
            fontSize: '0.8rem',
            background: '#e0e7ff',
            padding: '0.25rem',
            borderRadius: '3px',
            display: 'block',
            wordBreak: 'break-all'
          }}>
            {"{"}"classId":"CS101-2025","className":"Computer Science","teacherId":"teacher_1","timestamp":{Date.now()},"location":"Room A101"{"}"}
          </code>
        </div>
      </div>
    </div>
  )
}

export default QRScanner
