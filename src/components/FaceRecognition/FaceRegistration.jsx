import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceRegistration({ user, onComplete, onClose }) {
  const [message, setMessage] = useState('Loading...')
  const [capturedImages, setCapturedImages] = useState([])
  const videoRef = useRef()
  const streamRef = useRef()

  useEffect(() => {
    startEverything()
    return () => cleanup()
  }, [])

  const startEverything = async () => {
    try {
      console.log('🔄 Starting camera...')
      setMessage('Starting camera...')
      
      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      
      console.log('✅ Got camera stream:', stream)
      streamRef.current = stream
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('✅ Set video srcObject')
        
        // Force play
        try {
          await videoRef.current.play()
          console.log('✅ Video is playing')
          setMessage('Camera ready! Click Capture to take a photo')
        } catch (playError) {
          console.error('❌ Video play error:', playError)
          setMessage('Video play failed: ' + playError.message)
        }
      }
      
    } catch (error) {
      console.error('❌ Camera error:', error)
      setMessage('Camera failed: ' + error.message)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    
    const imageData = canvas.toDataURL('image/jpeg')
    
    const newCapture = {
      id: Date.now(),
      imageData
    }
    
    setCapturedImages(prev => [...prev, newCapture])
    setMessage(`Captured ${capturedImages.length + 1} photos!`)
  }

  const registerPhotos = async () => {
    setMessage('Registering...')
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          faceData: capturedImages
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage('✅ Registration successful!')
        setTimeout(() => onComplete(result), 1500)
      } else {
        setMessage('❌ Registration failed: ' + result.message)
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message)
    }
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
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
        borderRadius: '10px',
        padding: '20px',
        maxWidth: '600px',
        width: '100%'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>📷 Face Registration</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {/* Message */}
        <div style={{
          padding: '10px',
          background: '#f0f0f0',
          borderRadius: '5px',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>

        {/* Video */}
        <div style={{ marginBottom: '20px' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '300px',
              background: '#000',
              borderRadius: '5px',
              objectFit: 'cover'
            }}
            onPlay={() => console.log('📹 Video playing event')}
            onError={(e) => console.error('📹 Video error:', e)}
            onLoadedMetadata={() => console.log('📹 Video metadata loaded')}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={capturePhoto}
            style={{
              background: '#0066cc',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            📸 Take Photo ({capturedImages.length}/3)
          </button>

          {capturedImages.length >= 1 && (
            <button
              onClick={registerPhotos}
              style={{
                background: '#00cc66',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                flex: 1
              }}
            >
              ✅ Register
            </button>
          )}
        </div>

        {/* Captured Photos */}
        {capturedImages.length > 0 && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            {capturedImages.map((img, index) => (
              <img
                key={img.id}
                src={img.imageData}
                alt={`Photo ${index + 1}`}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '5px',
                  border: '2px solid #00cc66'
                }}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default FaceRegistration
