import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceRegistration({ user, onComplete, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [message, setMessage] = useState('Loading face detection models...')
  const videoRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    loadModels()
    return () => {
      stopCamera()
    }
  }, [])

  const loadModels = async () => {
    try {
      setMessage('🤖 Loading AI models...')
      
      // Use CDN for production deployment - works on Vercel
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      console.log('Loading face detection models from CDN...')
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      
      console.log('Models loaded successfully!')
      setMessage('📹 Starting camera...')
      await startCamera()
      setIsLoading(false)
      setMessage('👤 Position your face in the frame and click "Capture"')
      
    } catch (error) {
      console.error('Error loading models:', error)
      setMessage('❌ Error loading models: ' + error.message)
    }
  }

  const startCamera = async () => {
    try {
      console.log('Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      console.log('Camera access granted!')
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          console.log('Video loaded, starting face detection...')
          detectFace()
        }
      }
    } catch (error) {
      console.error('Camera error:', error)
      setMessage('❌ Camera access denied. Please allow camera access and refresh the page.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const detectFaces = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detection) {
          // Draw face detection box
          faceapi.draw.drawDetections(canvas, [detection])
          faceapi.draw.drawFaceLandmarks(canvas, [detection])
          
          setMessage('✅ Face detected! Ready to capture.')
        } else {
          setMessage('⚠️ No face detected. Please position your face in the frame.')
        }

        if (!isCapturing) {
          requestAnimationFrame(detectFaces)
        }
      } catch (error) {
        console.error('Face detection error:', error)
        setMessage('❌ Face detection error: ' + error.message)
      }
    }

    detectFaces()
  }

  const captureFace = async () => {
    if (!videoRef.current) return

    setIsCapturing(true)
    const video = videoRef.current

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setMessage('❌ No face detected. Please try again.')
        setIsCapturing(false)
        return
      }

      // Capture the face image
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      const faceDescriptor = Array.from(detection.descriptor)

      const newCapture = {
        id: Date.now(),
        imageData,
        descriptor: faceDescriptor,
        timestamp: new Date().toISOString()
      }

      setCapturedImages(prev => [...prev, newCapture])
      setMessage(`✅ Captured ${capturedImages.length + 1}/3 images. ${capturedImages.length < 2 ? 'Capture from different angles for better accuracy.' : 'All captures complete!'}`)
      
      // If we have 3 captures, enable registration
      if (capturedImages.length >= 2) {
        setTimeout(() => {
          setMessage('🎯 Ready to register! Click "Complete Registration"')
        }, 1000)
      }
      
    } catch (error) {
      console.error('Capture error:', error)
      setMessage('❌ Error capturing face: ' + error.message)
    }
    
    setIsCapturing(false)
    
    // Resume face detection after 2 seconds
    setTimeout(() => {
      if (capturedImages.length < 3) {
        detectFace()
      }
    }, 2000)
  }

  const registerFace = async () => {
    if (capturedImages.length === 0) return

    try {
      setMessage('📡 Registering face data...')
      
      const registrationData = {
        studentId: user.id,
        studentName: user.name,
        faceData: capturedImages.map(img => ({
          descriptor: img.descriptor,
          timestamp: img.timestamp
        }))
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(registrationData)
      })

      const result = await response.json()

      if (result.success) {
        setMessage('🎉 Face registration successful!')
        setTimeout(() => {
          stopCamera()
          onComplete(result.data)
        }, 1500)
      } else {
        setMessage('❌ Registration failed: ' + result.message)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setMessage('❌ Registration error: ' + error.message)
    }
  }

  const deleteCapturedImage = (id) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id))
    if (capturedImages.length <= 3) {
      detectFace()
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>📷 Face Registration - {user.name}</h2>
          <button 
            onClick={() => {
              stopCamera()
              onClose()
            }} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Status Message */}
        <div style={{
          padding: '1rem',
          background: message.includes('✅') || message.includes('🎉') ? '#dcfce7' : message.includes('❌') ? '#fee2e2' : '#dbeafe',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>

        {!isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Camera Section */}
            <div>
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={captureFace}
                  disabled={isLoading || isCapturing || capturedImages.length >= 3}
                  style={{
                    background: isCapturing ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: isCapturing ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    flex: 1
                  }}
                >
                  {isCapturing ? 'Capturing...' : `📸 Capture Face (${capturedImages.length}/3)`}
                </button>

                {capturedImages.length >= 1 && (
                  <button
                    onClick={registerFace}
                    style={{
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      flex: 1
                    }}
                  >
                    ✅ Complete Registration
                  </button>
                )}
              </div>
            </div>

            {/* Captured Images */}
            <div>
              <h4>Captured Images:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {capturedImages.map((img, index) => (
                  <div key={img.id} style={{ position: 'relative', border: '2px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <img 
                      src={img.imageData} 
                      alt={`Capture ${index + 1}`}
                      style={{ width: '100%', height: '80px', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => deleteCapturedImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {capturedImages.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.8rem' }}>
                  💡 <strong>Tips:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                    <li>Look directly at camera</li>
                    <li>Good lighting on face</li>
                    <li>Different angles help accuracy</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceRegistration
