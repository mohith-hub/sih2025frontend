import { useState } from 'react'
import QRCode from 'react-qr-code'

function QRScanner({ onScanSuccess, onClose }) {
  const [error, setError] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [qrValue, setQrValue] = useState('')

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

  const handleInputChange = (e) => {
    const value = e.target.value
    setManualCode(value)
    
    // Generate QR code as user types
    if (value.trim()) {
      try {
        JSON.parse(value) // Validate JSON
        setQrValue(value)
        setError('')
      } catch (err) {
        setQrValue('')
        if (value.length > 10) { // Only show error after significant input
          setError('Invalid JSON format')
        }
      }
    } else {
      setQrValue('')
      setError('')
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
    const jsonString = JSON.stringify(demoQRData, null, 2)
    setManualCode(jsonString)
    setQrValue(jsonString)
    setError('')
  }

  const clearInput = () => {
    setManualCode('')
    setQrValue('')
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
            <span>📱</span>
            Generate & Scan QR Code
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

        {/* Two Column Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem',
          marginBottom: '1.5rem'
        }}>
          
          {/* Left Side - Input */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
              📝 Enter JSON Data:
            </h3>
            
            <form onSubmit={handleManualSubmit}>
              <textarea
                value={manualCode}
                onChange={handleInputChange}
                placeholder="Paste or type JSON data here..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #d1d5db',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={!manualCode.trim() || error}
                  style={{
                    background: (!manualCode.trim() || error) ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1rem',
                    borderRadius: '6px',
                    cursor: (!manualCode.trim() || error) ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  ✅ Submit
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
          </div>

          {/* Right Side - QR Code */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
              📱 Generated QR Code:
            </h3>
            
            <div style={{
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              padding: '1rem',
              background: '#f9fafb'
            }}>
              {qrValue ? (
                <div style={{ textAlign: 'center' }}>
                  <QRCode 
                    value={qrValue} 
                    size={180}
                    style={{
                      height: 'auto',
                      maxWidth: '100%',
                      width: '100%',
                      background: 'white',
                      padding: '10px',
                      borderRadius: '8px'
                    }}
                  />
                  <p style={{ 
                    margin: '10px 0 0 0', 
                    fontSize: '0.8rem', 
                    color: '#6b7280' 
                  }}>
                    📸 Scan with your phone
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔳</div>
                  <p>QR Code will appear here<br/>when you enter valid JSON</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Demo Data Section */}
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
            <h4 style={{ margin: 0, color: '#1d4ed8' }}>Demo QR Code Data:</h4>
          </div>
          
          <div style={{
            background: '#ffffff',
            padding: '0.75rem',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            marginBottom: '0.75rem',
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            <pre style={{ 
              margin: 0,
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              lineHeight: '1.3',
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
            📋 Load Demo & Generate QR
          </button>
        </div>

      </div>
    </div>
  )
}

export default QRScanner
