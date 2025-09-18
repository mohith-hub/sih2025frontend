import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import '../../styles/responsive.css'
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

  // Optimized responsive styles with laptop sizing
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
      padding: '1rem',
      display: 'flex',
      alignItems: 'center', // Center vertically on laptop
      justifyContent: 'center'
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '900px', // Reduced from 95vw for laptops
      maxHeight: '85vh', // Reduced height for laptops
      margin: 'auto',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 1.5rem',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#f9fafb',
      position: 'sticky',
      top: 0,
      zIndex: 10
    },
    title: {
      margin: 0,
      fontSize: '1.25rem', // Fixed size for laptops
      fontWeight: '600',
      color: '#374151',
      lineHeight: '1.2'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
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
      padding: '1.5rem',
      maxHeight: 'calc(85vh - 80px)',
      overflowY: 'auto'
    },
    message: {
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1.5rem',
      fontWeight: '500',
      textAlign: 'center',
      fontSize: '0.95rem',
      lineHeight: '1.4'
    },
    gridContainer: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '2rem'
    },
    videoContainer: {
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: '#000',
      width: '100%',
      height: '350px', // Fixed height for better laptop viewing
      maxHeight: '350px'
    },
    video: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)'
    },
    canvas: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      transform: 'scaleX(-1)'
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
      width: '50px',
      height: '50px',
      border: '4px solid rgba(255, 255, 255, 0.3)',
      borderTop: '4px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '1rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1rem'
    },
    button: {
      padding: '0.75rem 1.25rem', // Smaller padding for laptops
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.9rem', // Smaller font for laptops
      fontWeight: '500',
      cursor: 'pointer',
      minHeight: '44px',
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
      marginTop: '1.5rem'
    },
    photoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
      gap: '0.75rem',
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
      transform: 'scaleX(-1)'
    },
    confidenceBadge: {
      position: 'absolute',
      top: '4px',
      right: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '500'
    },
    placeholderBox: {
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      padding: '2rem',
      textAlign: 'center',
      color: '#6b7280'
    },
    tipsBox: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      padding: '1rem',
      marginTop: '1.5rem'
    },
    tipsList: {
      margin: '0.5rem 0 0 0',
      paddingLeft: '1.2rem',
      fontSize: '0.85rem',
      lineHeight: '1.5'
    }
  }

  // Laptop-specific media queries
  const mediaStyles = `
    @media (min-width: 1024px) {
      .face-registration-grid {
        grid-template-columns: 1fr 1fr;
      }
      
      .face-registration-modal {
        max-width: 800px;
        max-height: 80vh;
      }
      
      .face-registration-video {
        height: 300px;
      }
      
      .face-registration-content {
        padding: 1.25rem;
      }
    }
    
    @media (min-width: 1280px) {
      .face-registration-modal {
        max-width: 900px;
        max-height: 75vh;
      }
      
      .face-registration-video {
        height: 320px;
      }
    }
    
    @media (max-width: 767px) {
      .face-registration-modal {
        margin: 0.5rem;
        max-width: calc(100vw - 1rem);
        max-height: calc(100vh - 1rem);
      }
      
      .face-registration-video {
        height: 250px;
      }
      
      .face-registration-content {
        padding: 1rem;
      }
      
      .face-registration-grid {
        gap: 1rem;
      }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `

  useEffect(() => {
    // Add media styles
    const styleSheet = document.createElement('style')
    styleSheet.innerText = mediaStyles
    document.head.appendChild(styleSheet)
    
    initializeSystem()
    return () => {
      cleanup()
      document.head.removeChild(styleSheet)
    }
  }, [])

  // ... (keep all the existing functions: initializeSystem, startCamera, loadFaceApiModels, etc.)
  // I'll include the key ones, but you can copy the function implementations from your current code

  const initializeSystem = async () => {
    try {
      await startCamera()
      setMessage('🤖 Loading AI models...')
      await loadFaceApiModels()
      setModelsLoaded(true)
      setMessage('👤 Position your face clearly and tap "Capture Face"')
      setIsLoading(false)
    } catch (error) {
      setMessage('❌ Setup failed: ' + error.message)
      setCameraError(error.message)
      setIsLoading(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setVideoReady(true)
        setTimeout(() => {
          if (modelsLoaded) startFaceDetection()
        }, 1000)
      }
    } catch (error) {
      setCameraError('Camera setup failed: ' + error.message)
      throw error
    }
  }

  const loadFaceApiModels = async () => {
    const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ])
  }

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded || !videoReady) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    detectionInterval.current = setInterval(async () => {
      if (!videoReady || isCapturing) return
      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        if (detections.length > 0) {
          const resizedDetections = faceapi.resizeResults(detections, {
            width: canvas.width,
            height: canvas.height
          })
          faceapi.draw.drawDetections(canvas, resizedDetections)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
          setMessage(detections.length === 1 ? 
            `✅ Face detected! Ready to capture (${capturedImages.length}/3)` : 
            '⚠️ Multiple faces detected. Please ensure only your face is visible.')
        } else {
          setMessage('👤 Looking for your face... Position yourself in the frame.')
        }
      } catch (error) {
        console.error('Face detection error:', error)
      }
    }, 500)
  }

  const captureFace = async () => {
    if (!videoReady || isCapturing || capturedImages.length >= 3) return
    setIsCapturing(true)
    setMessage('📸 Capturing face data...')

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        setMessage('❌ No clear face detected. Please position properly and try again.')
        setIsCapturing(false)
        return
      }

      const canvas = document.createElement('canvas')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.95)
      const faceDescriptor = Array.from(detection.descriptor)

      setCapturedImages(prev => [...prev, {
        id: Date.now(),
        imageData,
        descriptor: faceDescriptor,
        confidence: detection.detection.score,
        timestamp: new Date().toISOString()
      }])
      
      const newCount = capturedImages.length + 1
      setMessage(`✅ Photo ${newCount}/3 captured! ${newCount < 3 ? 'Take more from different angles.' : 'Ready to register!'}`)
    } catch (error) {
      setMessage('❌ Failed to capture: ' + error.message)
    }
    setIsCapturing(false)
  }

  const registerFaces = async () => {
    if (capturedImages.length === 0) return
    try {
      setMessage(`📡 Registering ${capturedImages.length} face samples...`)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
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
        })
      })

      const result = await response.json()
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
      setMessage('❌ Registration failed: ' + error.message)
    }
  }

  const cleanup = () => {
    if (detectionInterval.current) clearInterval(detectionInterval.current)
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
      <div 
        className="face-registration-modal"
        style={styles.modal}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            👤 Face Registration - {user.name}
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

        <div 
          className="face-registration-content"
          style={styles.content}
        >
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
                  initializeSystem()
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
                <div 
                  className="face-registration-video"
                  style={styles.videoContainer}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      ...styles.video,
                      display: videoReady ? 'block' : 'none'
                    }}
                  />
                  
                  <canvas
                    ref={canvasRef}
                    style={styles.canvas}
                  />
                  
                  {(!videoReady && !cameraError) && (
                    <div style={styles.loadingOverlay}>
                      <div style={styles.spinner} />
                      <p style={{ margin: 0 }}>Setting up camera...</p>
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
                      {isCapturing ? '📸 Capturing...' : `📸 Capture (${capturedImages.length}/3)`}
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
                      marginTop: '1rem'
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
                  fontSize: '1rem',
                  color: '#374151'
                }}>
                  📸 Captured Photos:
                </h4>
                
                {capturedImages.length === 0 ? (
                  <div style={styles.placeholderBox}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📷</div>
                    <p style={{ margin: '0 0 0.5rem 0' }}>No photos captured yet</p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>
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
                    fontSize: '0.9rem'
                  }}>
                    💡 Tips for best results:
                  </h5>
                  <ul style={styles.tipsList}>
                    <li>Look directly at the camera</li>
                    <li>Ensure good lighting on your face</li>
                    <li>Keep a neutral expression</li>
                    <li>Take photos from different angles</li>
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
