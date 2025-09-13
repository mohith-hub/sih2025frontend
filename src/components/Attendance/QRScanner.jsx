import { useState } from 'react'

function QRScanner({ onScanSuccess, onClose }) {
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (manualCode.trim()) {
      try {
        const qrData = JSON.parse(manualCode)
        onScanSuccess(qrData)
      } catch (err) {
        setError('Invalid QR code format. Please check your JSON.')
      }
    } else {
      setError('Please enter QR code data.')
    }
  }

  const loadDemoData = () => {
    const demoQRData = {
      classId: 'CS101-2025',
      className: 'Computer Science',
      teacherId: 'teacher_1',
      timestamp: Date.now(),
      location: 'Room A101'
    }
    setManualCode(JSON.stringify(demoQRData, null, 2))
    setError('')
  }

  const clearInput = () => {
    setManualCode('')
    setError('')
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
        maxWidth: '500px',
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
            <span>📱</span>
            Scan QR Code
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              padding: '5px'
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
            📋 How to use:
          </h3>
          <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
            <li>Use your phone's camera app to scan a QR code</li>
            <li>Copy the QR code data</li>
            <li>Paste it in the text area below</li>
            <li>Click "Submit" to mark attendance</li>
          </ol>
        </div>

        {/* Manual Entry Form */}
        <form onSubmit={handleManualSubmit} style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: 'bold',
            color: '#374151'
          }}>
            Paste QR Code Data:
          </label>
          <textarea
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste QR code data here..."
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #d1d5db',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              resize: 'vertical',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
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
                flex: 1
              }}
            >
              ✅ Submit Manual Entry
            </button>
            
            <button
              type="button"
              onClick={clearInput}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>
        </form>

        {/* Demo QR Code Section */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bfdbfe',
          borderRadius: '6px',
          padding: '1rem'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.5rem' 
          }}>
            <span>🔧</span>
            <h4 style={{ margin: 0, color: '#1d4ed8' }}>Demo QR Code:</h4>
          </div>
          
          <div style={{
            background: '#ffffff',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            marginBottom: '0.75rem',
            maxHeight: '120px',
            overflow: 'auto'
          }}>
            <pre style={{ 
              margin: 0,
              fontSize: '0.8rem',
              fontFamily: 'monospace',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify({
                "classId": "CS101-2025",
                "className": "Computer Science",
                "teacherId": "teacher_1",
                "timestamp": 1757745701198,
                "location": "Room A101"
              }, null, 2)}
            </pre>
          </div>
          
          <button
            onClick={loadDemoData}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}
          >
            📋 Load Demo Data
          </button>
        </div>

      </div>
    </div>
  )
}

export default QRScanner
