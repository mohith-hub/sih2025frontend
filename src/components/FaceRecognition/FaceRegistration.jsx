import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceRegistration({ user, onComplete, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [message, setMessage] = useState('Starting camera...')
  const [videoReady, setVideoReady] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef()
  const canvasRef = useRef()
  const streamRef = useRef()
  const detectionInterval = useRef()

  useEffect(() => {
    initializeSystem()
    return () => cleanup()
  }, [])

  const initializeSystem = async () => {
    try {
      console.log('🔄 Starting face registration initialization...')
      
      // Start camera FIRST
      await startCamera()
      
      // Then load models
      setMessage('🤖 Loading AI models...')
      await loadFaceApiModels()
      setModelsLoaded(true)
      
      setMessage('👤 Position your face clearly and click "Capture Face"')
      setIsLoading(false)
      
    } catch (error) {
      console.error('❌ Initialization error:', error)
      setMessage('❌ Setup failed: ' + error.message)
      setCameraError(error.message)
      setIsLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      console.log('📹 Starting camera...')
      setMessage('📹 Accessing your camera...')
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Request camera with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        },
        audio: false
      })
      
      streamRef.current = stream
      console.log('✅ Camera stream obtained:', stream)
      
      if (videoRef.current) {
        // Set up video element properly
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded')
            console.log('📹 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight)
            resolve()
          }
          
          videoRef.current.onerror = (error) => {
            console.error('❌ Video error:', error)
            reject(new Error('Video element error'))
          }
          
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error('Video loading timeout')), 10000)
        })

        // Start playing video
        try {
          await videoRef.current.play()
          console.log('✅ Video is playing')
          setVideoReady(true)
          setMessage('📹 Camera ready! Loading AI models...')
          
          // Start face detection after a short delay
          setTimeout(() => {
            if (modelsLoaded) startFaceDetection()
          }, 1000)
          
        } catch (playError) {
          console.error('❌ Video play failed:', playError)
          throw new Error('Could not start video playback: ' + playError.message)
        }
      } else {
        throw new Error('Video element not found')
      }
      
    } catch (error) {
      console.error('❌ Camera setup failed:', error)
      
      let errorMessage = 'Camera setup failed: '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access and refresh.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.'
      } else {
        errorMessage += error.message
      }
      
      setCameraError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const loadFaceApiModels = async () => {
    try {
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      console.log('📦 Loading face-api.js models from:', MODEL_URL)
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ])
      
      console.log('✅ All models loaded successfully')
      
    } catch (error) {
      console.error('❌ Model loading failed:', error)
      throw new Error('Failed to load AI models. Check internet connection.')
    }
  }

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !videoReady) {
      console.log('⏳ Not ready for face detection yet...')
      return
    }

    console.log('🔍 Starting face detection...')
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    
    console.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height)

    const detectFaces = async () => {
      try {
        if (!videoReady || isCapturing) return

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 416, 
            scoreThreshold: 0.5 
          }))
          .withFaceLandmarks()
          .withFaceDescriptors()

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detections.length > 0) {
          // Draw detection results
          const resizedDetections = faceapi.resizeResults(detections, {
            width: canvas.width,
            height: canvas.height
          })
          
          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
          
          if (detections.length === 1) {
            setMessage(`✅ Face detected! Ready to capture (${capturedImages.length}/3 photos)`)
          } else {
            setMessage(`⚠️ Multiple faces detected. Please ensure only your face is visible.`)
          }
        } else {
          setMessage(`👤 Looking for your face... Please position yourself clearly in the frame.`)
        }

      } catch (error) {
        console.error('Face detection error:', error)
      }
    }

    // Start detection loop
    detectionInterval.current = setInterval(detectFaces, 500)
  }

  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isCapturing || capturedImages.length >= 3) return

    setIsCapturing(true)
    setMessage('📸 Capturing face data...')

    try {
      const video = videoRef.current
      
      // Detect face with descriptor
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 416, 
          scoreThreshold: 0.5 
        }))
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setMessage('❌ No clear face detected. Please position your face properly and try again.')
        setIsCapturing(false)
        return
      }

      console.log('✅ Face captured with confidence:', detection.detection.score)

      // Create image from video
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      const faceDescriptor = Array.from(detection.descriptor)

      const newCapture = {
        id: Date.now(),
        imageData,
        descriptor: faceDescriptor,
        confidence: detection.detection.score,
        timestamp: new Date().toISOString()
      }

      setCapturedImages(prev => [...prev, newCapture])
      
      const newCount = capturedImages.length + 1
      setMessage(`✅ Photo ${newCount}/3 captured! ${newCount < 3 ? 'Take more from different angles.' : 'Ready to register!'}`)
      
      console.log(`✅ Captured ${newCount}/3 photos`)
      
    } catch (error) {
      console.error('❌ Face capture error:', error)
      setMessage('❌ Failed to capture: ' + error.message)
    }
    
    setIsCapturing(false)
  }

  const registerFaces = async () => {
    if (capturedImages.length === 0) {
      setMessage('❌ No photos captured. Please take at least one photo.')
      return
    }

    try {
      setMessage(`📡 Registering ${capturedImages.length} face samples...`)
      
      const registrationData = {
        studentId: user.id,
        studentName: user.name,
        email: user.email || '',
        faceData: capturedImages.map(img => ({
          descriptor: img.descriptor,
          confidence: img.confidence,
          timestamp: img.timestamp
        })),
        totalSamples: capturedImages.length,
        registeredAt: new Date().toISOString()
      }

      console.log('📤 Registering face data for:', user.name)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(registrationData)
      })

      const result = await response.json()
      console.log('📥 Registration result:', result)

      if (result.success) {
        setMessage('🎉 Face registration completed successfully!')
        
        setTimeout(() => {
          cleanup()
          onComplete(result.data)
        }, 2000)
      } else {
        setMessage('❌ Registration failed: ' + (result.message || 'Unknown error'))
      }

    } catch (error) {
      console.error('❌ Registration error:', error)
      setMessage('❌ Registration failed: ' + error.message)
    }
  }

  const cleanup = () => {
    if (detectionInterval.current) {
      clearInterval(detectionInterval.current)
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const retryCapture = () => {
    setCapturedImages([])
    setMessage('👤 Ready to capture new photos')
  }

  const retryCamera = () => {
    setCameraError('')
    setVideoReady(false)
    setIsLoading(true)
    setMessage('🔄 Retrying camera setup...')
    startCamera()
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
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '900px',
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
            <span>👤</span>
            Face Registration - {user.name}
          </h2>
          <button 
            onClick={() => { cleanup(); onClose(); }}
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

        {/* Status Message */}
        <div style={{
          padding: '1rem',
          background: message.includes('✅') || message.includes('🎉') ? '#dcfce7' : 
                     message.includes('❌') || cameraError ? '#fee2e2' : '#dbeafe',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          textAlign: 'center',
          fontWeight: 'bold',
          color: message.includes('✅') || message.includes('🎉') ? '#166534' :
                 message.includes('❌') || cameraError ? '#dc2626' : '#1e40af'
        }}>
          {cameraError || message}
        </div>

        {/* Camera Error - Retry Option */}
        {cameraError && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <button
              onClick={retryCamera}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Retry Camera Setup
            </button>
          </div>
        )}

        {/* Main Content */}
        {!cameraError && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            
            {/* Left Side - Video Feed */}
            <div>
              <div style={{ 
                position: 'relative', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                background: '#000',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Video Element - FIXED STYLING */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ 
                    width: '100%', 
                    height: '400px',
                    objectFit: 'cover',
                    display: videoReady ? 'block' : 'none',
                    transform: 'scaleX(-1)' // Mirror effect for better UX
                  }}
                  onPlay={() => {
                    console.log('📹 Video started playing')
                    setVideoReady(true)
                  }}
                  onError={(e) => {
                    console.error('📹 Video error:', e)
                    setCameraError('Video playback failed')
                  }}
                />
                
                {/* Detection Canvas Overlay */}
                <canvas
                  ref={canvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: 'scaleX(-1)' // Mirror to match video
                  }}
                />
                
                {/* Loading Spinner */}
                {!videoReady && !cameraError && (
                  <div style={{
                    position: 'absolute',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'white'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      border: '4px solid rgba(255,255,255,0.3)',
                      borderTop: '4px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '1rem'
                    }} />
                    <p>Setting up camera...</p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              {videoReady && !cameraError && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={captureFace}
                    disabled={!modelsLoaded || isCapturing || capturedImages.length >= 3}
                    style={{
                      background: (!modelsLoaded || isCapturing || capturedImages.length >= 3) ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      cursor: (!modelsLoaded || isCapturing || capturedImages.length >= 3) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      flex: 1
                    }}
                  >
                    {isCapturing ? '📸 Capturing...' : `📸 Capture Face (${capturedImages.length}/3)`}
                  </button>

                  {capturedImages.length > 0 && (
                    <button
                      onClick={retryCapture}
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              )}

              {/* Register Button */}
              {capturedImages.length >= 1 && (
                <button
                  onClick={registerFaces}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%',
                    marginTop: '1rem',
                    fontSize: '1.1rem'
                  }}
                >
                  ✅ Complete Registration ({capturedImages.length} photos)
                </button>
              )}
            </div>

            {/* Right Side - Captured Photos */}
            <div>
              <h4 style={{ marginTop: 0 }}>📸 Captured Photos:</h4>
              
              {capturedImages.length === 0 ? (
                <div style={{
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '1rem' }}>📷</div>
                  <p>No photos captured yet</p>
                  <p style={{ fontSize: '0.9rem' }}>Take 1-3 photos from different angles</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {capturedImages.map((img, index) => (
                    <div key={img.id} style={{
                      border: '2px solid #10b981',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img 
                        src={img.imageData} 
                        alt={`Capture ${index + 1}`}
                        style={{ 
                          width: '100%', 
                          height: '80px', 
                          objectFit: 'cover',
                          transform: 'scaleX(-1)' // Mirror to match video
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        {Math.round(img.confidence * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tips */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#f0f9ff',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>💡 Tips:</h5>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: '1.5' }}>
                  <li>Look directly at camera</li>
                  <li>Good lighting on face</li>
                  <li>Neutral expression</li>
                  <li>Different angles help</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CSS Animation */}
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default FaceRegistration
