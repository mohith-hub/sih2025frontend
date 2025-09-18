import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import '../../styles/responsive.css' // Make sure to import the CSS we created earlier

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

  // Universal responsive styles
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: 'clamp(0.5rem, 3vw, 1rem)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '95vw',
      maxHeight: '95vh',
      margin: 'auto',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 'clamp(0.75rem, 3vw, 1.5rem)',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    title: {
      margin: 0,
      fontSize: 'clamp(1rem, 4vw, 1.25rem)',
      fontWeight: '600',
      color: '#374151',
      lineHeight: '1.2'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: 'clamp(1.25rem, 5vw, 1.5rem)',
      cursor: 'pointer',
      minHeight: '44px',
      minWidth: '44px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    content: {
      padding: 'clamp(0.75rem, 3vw, 1.5rem)',
      maxHeight: 'calc(95vh - 80px)',
      overflowY: 'auto'
    },
    message: {
      padding: 'clamp(0.75rem, 3vw, 1rem)',
      borderRadius: '8px',
      marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)',
      fontWeight: '500',
      textAlign: 'center',
      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
      lineHeight: '1.4'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: 'clamp(1rem, 4vw, 2rem)'
    },
    videoContainer: {
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#000',
      aspectRatio: '4/3',
      minHeight: '250px'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)' // Mirror for better UX
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      transform: 'scaleX(-1)' // Mirror to match video
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    spinner: {
      width: 'clamp(40px, 8vw, 60px)',
      height: 'clamp(40px, 8vw, 60px)',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: 'clamp(0.5rem, 2vw, 1rem)',
      marginTop: 'clamp(0.75rem, 3vw, 1rem)'
    },
    button: {
      padding: 'clamp(0.75rem, 3vw, 1rem) clamp(1rem, 4vw, 1.5rem)',
      border: 'none',
      borderRadius: '8px',
      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)',
      fontWeight: '500',
      cursor: 'pointer',
      minHeight: '48px',
      flex: 1,
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    primaryBtn: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    secondaryBtn: {
      backgroundColor: '#10b981',
      color: 'white'
    },
    warningBtn: {
      backgroundColor: '#f59e0b',
      color: 'white'
    },
    disabledBtn: {
      backgroundColor: '#9ca3af',
      color: 'white',
      cursor: 'not-allowed'
    },
    capturedPhotos: {
      marginTop: 'clamp(1rem, 4vw, 1.5rem)'
    },
    photoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
      gap: 'clamp(0.5rem, 2vw, 1rem)',
      marginTop: '1rem'
    },
    photoItem: {
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '2px solid #10b981',
      aspectRatio: '1',
      backgroundColor: '#f3f4f6'
    },
    photoImg: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)' // Mirror to match video
    },
    confidenceBadge: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '12px',
      fontSize: 'clamp(0.7rem, 3vw, 0.75rem)',
      fontWeight: '500'
    },
    placeholderBox: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: 'clamp(1.5rem, 5vw, 2rem)',
      textAlign: 'center',
      color: '#6b7280'
    },
    tipsBox: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: 'clamp(0.75rem, 3vw, 1rem)',
      marginTop: 'clamp(1rem, 4vw, 1.5rem)'
    },
    tipsList: {
      margin: '0.5rem 0 0 0',
      paddingLeft: '1.2rem',
      fontSize: 'clamp(0.8rem, 3.2vw, 0.9rem)',
      lineHeight: '1.5'
    }
  }

  // Media queries for larger screens
  const mediaStyles = `
    @media (min-width: 768px) {
      .face-registration-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `

  useEffect(() => {
    // Add media styles to head
    const styleSheet = document.createElement('style')
    styleSheet.innerText = mediaStyles
    document.head.appendChild(styleSheet)
    
    initializeSystem()
    return () => {
      cleanup()
      document.head.removeChild(styleSheet)
    }
  }, [])

  const initializeSystem = async () => {
    try {
      console.log('🔄 Starting face registration initialization...')
      
      // Start camera first
      await startCamera()
      
      // Then load models
      setMessage('🤖 Loading AI models...')
      await loadFaceApiModels()
      setModelsLoaded(true)
      
      setMessage('👤 Position your face clearly and tap "Capture Face"')
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

      // Request camera with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        },
        audio: false
      })
      
      streamRef.current = stream
      console.log('✅ Camera stream obtained')
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          videoRef.current.onloadedmetadata = () => {
            console.log('📹 Video metadata loaded')
            resolve()
          }
          
          videoRef.current.onerror = (error) => {
            console.error('❌ Video error:', error)
            reject(new Error('Video element error'))
          }
          
          setTimeout(() => reject(new Error('Video loading timeout')), 10000)
        })

        // Start playing video
        try {
          await videoRef.current.play()
          console.log('✅ Video is playing')
          setVideoReady(true)
          setMessage('📹 Camera ready! Loading AI models...')
          
          // Start face detection after models are loaded
          setTimeout(() => {
            if (modelsLoaded) startFaceDetection()
          }, 1000)
          
        } catch (playError) {
          console.error('❌ Video play failed:', playError)
          throw new Error('Could not start video playback: ' + playError.message)
        }
      }
      
    } catch (error) {
      console.error('❌ Camera setup failed:', error)
      
      let errorMessage = 'Camera setup failed: '
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and refresh.'
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
      
      console.log('📦 Loading face-api.js models...')
      
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
          setMessage(`👤 Looking for your face... Position yourself clearly in the frame.`)
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

  const getMessageStyle = () => {
    return {
      ...styles.message,
      backgroundColor: message.includes('✅') || message.includes('🎉') ? '#dcfce7' : 
                      message.includes('❌') ? '#fee2e2' : '#dbeafe',
      color: message.includes('✅') || message.includes('🎉') ? '#166534' : 
             message.includes('❌') ? '#dc2626' : '#1e40af',
      border: `1px solid ${
        message.includes('✅') || message.includes('🎉') ? '#16a34a' : 
        message.includes('❌') ? '#dc2626' : '#3b82f6'
      }`
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            <span style={{ marginRight: '0.5rem' }}>👤</span>
            Face Registration - {user.name}
          </h2>
          <button 
            onClick={() => { cleanup(); onClose(); }}
            style={styles.closeBtn}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {/* Status Message */}
          <div style={getMessageStyle()}>
            {cameraError || message}
          </div>

          {/* Camera Error - Retry Option */}
          {cameraError && (
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <button
                onClick={() => {
                  setCameraError('')
                  setVideoReady(false)
                  setIsLoading(true)
                  setMessage('🔄 Retrying camera setup...')
                  startCamera()
                }}
                style={{
                  ...styles.button,
                  ...styles.primaryBtn,
                  maxWidth: '200px'
                }}
              >
                🔄 Retry Camera Setup
              </button>
            </div>
          )}

          {/* Main Content Grid */}
          {!cameraError && (
            <div 
              className="face-registration-grid"
              style={styles.gridContainer}
            >
              {/* Video Section */}
              <div>
                <div style={styles.videoContainer}>
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      ...styles.video,
                      display: videoReady ? 'block' : 'none'
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
                    style={styles.canvas}
                  />
                  
                  {/* Loading Overlay */}
                  {(!videoReady && !cameraError) && (
                    <div style={styles.loadingOverlay}>
                      <div style={styles.spinner} />
                      <p style={{ margin: 0, fontSize: 'clamp(0.875rem, 3.5vw, 1rem)' }}>
                        Setting up camera...
                      </p>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                {videoReady && !cameraError && (
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={captureFace}
                      disabled={!modelsLoaded || isCapturing || capturedImages.length >= 3}
                      style={{
                        ...styles.button,
                        ...(!modelsLoaded || isCapturing || capturedImages.length >= 3 ? 
                           styles.disabledBtn : styles.primaryBtn)
                      }}
                    >
                      {isCapturing ? '📸 Capturing...' : `📸 Capture Face (${capturedImages.length}/3)`}
                    </button>

                    {capturedImages.length > 0 && (
                      <button
                        onClick={retryCapture}
                        style={{
                          ...styles.button,
                          ...styles.warningBtn,
                          flex: 'none',
                          minWidth: '80px'
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
                      ...styles.button,
                      ...styles.secondaryBtn,
                      width: '100%',
                      marginTop: 'clamp(0.5rem, 2vw, 1rem)'
                    }}
                  >
                    ✅ Complete Registration ({capturedImages.length} photos)
                  </button>
                )}
              </div>

              {/* Captured Photos Section */}
              <div style={styles.capturedPhotos}>
                <h4 style={{ 
                  marginTop: 0, 
                  marginBottom: '1rem',
                  fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                  color: '#374151'
                }}>
                  📸 Captured Photos:
                </h4>
                
                {capturedImages.length === 0 ? (
                  <div style={styles.placeholderBox}>
                    <div style={{ 
                      fontSize: 'clamp(2rem, 8vw, 3rem)', 
                      marginBottom: '1rem' 
                    }}>📷</div>
                    <p style={{ 
                      margin: '0 0 0.5rem 0',
                      fontSize: 'clamp(0.875rem, 3.5vw, 1rem)'
                    }}>
                      No photos captured yet
                    </p>
                    <p style={{ 
                      margin: 0,
                      fontSize: 'clamp(0.8rem, 3.2vw, 0.875rem)',
                      color: '#9ca3af'
                    }}>
                      Take 1-3 photos from different angles
                    </p>
                  </div>
                ) : (
                  <div style={styles.photoGrid}>
                    {capturedImages.map((img, index) => (
                      <div key={img.id} style={styles.photoItem}>
                        <img 
                          src={img.imageData} 
                          alt={`Capture ${index + 1}`}
                          style={styles.photoImg}
                        />
                        <div style={styles.confidenceBadge}>
                          {Math.round(img.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tips Section */}
                <div style={styles.tipsBox}>
                  <h5 style={{ 
                    margin: '0 0 0.5rem 0', 
                    color: '#1e40af',
                    fontSize: 'clamp(0.9rem, 3.6vw, 1rem)'
                  }}>
                    💡 Tips for best results:
                  </h5>
                  <ul style={styles.tipsList}>
                    <li>Look directly at the camera</li>
                    <li>Ensure good lighting on your face</li>
                    <li>Keep a neutral expression</li>
                    <li>Take photos from slightly different angles</li>
                    <li>Avoid glasses or face coverings if possible</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaceRegistration
