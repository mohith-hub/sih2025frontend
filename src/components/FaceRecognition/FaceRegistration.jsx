import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceRegistration({ user, onComplete, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [message, setMessage] = useState('Loading face detection models...')
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef()

  useEffect(() => {
    loadModelsAndCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const loadModelsAndCamera = async () => {
    try {
      setMessage('🤖 Loading AI models...')
      
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])
      
      console.log('✅ Models loaded successfully')
      setMessage('📹 Starting camera...')
      
      await startCamera()
      
    } catch (error) {
      console.error('Error:', error)
      setMessage('❌ Error: ' + error.message)
    }
  }

  const startCamera = async () => {
    try {
      console.log('🎥 Requesting camera access...')
      
      const constraints = {
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      console.log('✅ Camera stream obtained')
      
      if (videoRef.current) {
        // Critical: Set srcObject and force play
        videoRef.current.srcObject = stream
        
        // Wait for metadata to load
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log('📹 Video metadata loaded, starting playback...')
            
            // Force play the video
            await videoRef.current.play()
            
            console.log('✅ Video is now playing!')
            setCameraReady(true)
            setIsLoading(false)
            setMessage('👤 Position your face in the frame and click "Capture"')
            
            // Start face detection after video is confirmed playing
            setTimeout(() => {
              detectFace()
            }, 500)
            
          } catch (playError) {
            console.error('❌ Video play error:', playError)
            setMessage('❌ Could not start video playback. Please refresh and try again.')
          }
        }
        
        // Handle any video errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video element error:', error)
          setMessage('❌ Video error occurred. Please refresh and try again.')
        }
      }
    } catch (error) {
      console.error('❌ Camera access error:', error)
      setMessage('❌ Camera access denied. Please allow camera access and refresh.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraReady(false)
  }

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current || !cameraReady) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Double-check video is ready and playing
    if (video.readyState < 2 || video.paused) {
      console.log('Video not ready, retrying...')
      setTimeout(detectFace, 500)
      return
    }

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    
    const ctx = canvas.getContext('2d')

    const runDetection = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detection) {
          faceapi.draw.drawDetections(canvas, [detection])
          faceapi.draw.drawFaceLandmarks(canvas, [detection])
          setMessage('✅ Face detected! Ready to capture.')
        } else {
          setMessage('⚠️ Please position your face clearly in the frame.')
        }

        if (!isCapturing && cameraReady && streamRef.current) {
          requestAnimationFrame(runDetection)
        }
      } catch (error) {
        console.log('Detection error:', error)
        if (!isCapturing && cameraReady && streamRef.current) {
          setTimeout(runDetection, 100)
        }
      }
    }

    runDetection()
  }

  const captureFace = async () => {
    if (!videoRef.current || !cameraReady || capturedImages.length >= 3) return

    setIsCapturing(true)

    try {
      const video = videoRef.current
      
      // Ensure video is playing
      if (video.paused) {
        await video.play()
      }
      
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setMessage('❌ No face detected. Please position your face clearly.')
        setIsCapturing(false)
        return
      }

      // Capture image
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
      setMessage(`✅ Captured ${capturedImages.length + 1}/3 images!`)
      
    } catch (error) {
      console.error('Capture error:', error)
      setMessage('❌ Error capturing face. Please try again.')
    }
    
    setIsCapturing(false)
    
    setTimeout(() => {
      if (capturedImages.length < 2) {
        detectFace()
      }
    }, 1000)
  }

  const registerFace = async () => {
    if (capturedImages.length === 0) return

    try {
      setMessage('📡 Registering face data...')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: user.id,
          studentName: user.name,
          faceData: capturedImages.map(img => ({
            descriptor: img.descriptor,
            timestamp: img.timestamp
          }))
        })
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
        maxWidth: '700px',
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

        <div style={{
          padding: '1rem',
          background: message.includes('✅') || message.includes('🎉') ? '#dcfce7' : 
                     message.includes('❌') ? '#fee2e2' : '#dbeafe',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>

        {!isLoading && (
          <div>
            <div style={{ 
              position: 'relative', 
              borderRadius: '8px', 
              overflow: 'hidden', 
              background: '#000',
              marginBottom: '1rem',
              minHeight: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: 'auto',
                  minHeight: '300px',
                  objectFit: 'cover',
                  display: 'block',
                  backgroundColor: '#000'
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
              
              {/* Loading overlay while camera starts */}
              {!cameraReady && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '1.2rem',
                  textAlign: 'center'
                }}>
                  📹 Starting camera...
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={captureFace}
                disabled={!cameraReady || isCapturing || capturedImages.length >= 3}
                style={{
                  background: (!cameraReady || isCapturing) ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  cursor: (!cameraReady || isCapturing) ? 'not-allowed' : 'pointer',
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

            {capturedImages.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {capturedImages.map((img, index) => (
                  <img 
                    key={img.id}
                    src={img.imageData} 
                    alt={`Capture ${index + 1}`}
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      objectFit: 'cover', 
                      borderRadius: '8px', 
                      border: '2px solid #10b981' 
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceRegistration
