import { useState } from 'react'

function QRGenerator({ onClose }) {
  const [qrData, setQrData] = useState({
    classId: 'CS101-2025',
    className: 'Computer Science',
    teacherId: 'teacher_1',
    location: 'Room A101',
    duration: 30
  })
  const [generated, setGenerated] = useState(false)

  const generateQR = () => {
    const qrPayload = {
      ...qrData,
      timestamp: Date.now(),
      expiresAt: Date.now() + (qrData.duration * 60 * 1000)
    }
    setGenerated(qrPayload)
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
        maxWidth: '600px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>🔍 Generate QR Code</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {!generated ? (
          <div>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Class ID:</label>
                <input
                  type="text"
                  value={qrData.classId}
                  onChange={(e) => setQrData({...qrData, classId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Class Name:</label>
                <input
                  type="text"
                  value={qrData.className}
                  onChange={(e) => setQrData({...qrData, className: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Location:</label>
                <input
                  type="text"
                  value={qrData.location}
                  onChange={(e) => setQrData({...qrData, location: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Valid Duration (minutes):</label>
                <select
                  value={qrData.duration}
                  onChange={(e) => setQrData({...qrData, duration: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '0.75rem', border: '2px solid #d1d5db', borderRadius: '6px' }}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <button
              onClick={generateQR}
              style={{
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                width: '100%'
              }}
            >
              🔍 Generate QR Code
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            {/* QR Code Display */}
            <div style={{
              width: '300px',
              height: '300px',
              background: '#f9fafb',
              border: '2px dashed #9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              borderRadius: '12px'
            }}>
              <div>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📱</div>
                <div style={{ color: '#6b7280' }}>QR Code Preview</div>
              </div>
            </div>

            <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>Class Information:</h4>
              <p><strong>Class:</strong> {generated.className} ({generated.classId})</p>
              <p><strong>Location:</strong> {generated.location}</p>
              <p><strong>Valid Until:</strong> {new Date(generated.expiresAt).toLocaleTimeString()}</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setGenerated(false)}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Generate Another
              </button>
              
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(generated))}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                📋 Copy QR Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default QRGenerator
