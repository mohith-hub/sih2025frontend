import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceAttendance({ user, onSuccess, onClose }) {
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('Loading face recognition...')
  const [isRecognizing, setIsRecognizing] = useState(false)
  const videoRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    loadModelsAndStartRecognition()
    return () => {
      stopCamera()
    }
  }, [])

  const loadModelsAndStartRecognition = async () => {
    try {
      setMessage('🤖 Loading AI models...')
      
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      
      console.log('✅ Models loaded successfully')
      setMessage('📹 Starting camera...')
      await startCamera()
      
    } catch (error) {
      console.error('Models loading error:', error)
      setMessage('❌ Error: ' + error.message)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // CRITICAL: Add event listeners before play
        videoRef.current.onloadedmetadata = async () => {
          try {
            console.log('📹 Video metadata loaded, starting playback...')
            
            // CRITICAL: Explicitly play the video
            await videoRef.current.play()
            console.log('✅ Video playing successfully')
            
            setIsLoading(false)
            setMessage('👤 Position your face in the frame for attendance marking')
            
            // Start recognition after video is confirmed playing
            setTimeout(() => {
              recognizeFace()
            }, 1000)
            
          } catch (playError) {
            console.error('❌ Video play failed:', playError)
            setMessage('❌ Video play failed. Please refresh and allow autoplay.')
          }
        }
        
        // Handle video errors
        videoRef.current.onerror = (error) => {
          console.error('❌ Video error:', error)
          setMessage('❌ Video error occurred. Please refresh.')
        }
      }
    } catch (error) {
      console.error('Camera error:', error)
      setMessage('❌ Camera access denied. Please allow camera access.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  const recognizeFace = async () => {
    if (!videoRef.current || !canvasRef.current || isRecognizing) return

    const video = videoRef.current
    
    // CRITICAL: Check if video is actually playing
    if (video.readyState < 2 || video.paused) {
      console.log('⚠️ Video not ready, retrying...')
      setTimeout(recognizeFace, 500)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas dimensions based on actual video dimensions
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    let recognitionAttempts = 0
    const maxAttempts = 15

    const performRecognition = async () => {
      if (recognitionAttempts >= maxAttempts) {
        setMessage('⏰ Recognition timeout. Please try QR code instead.')
        return
      }

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        if (detection) {
          faceapi.draw.drawDetections(canvas, [detection])
          faceapi.draw.drawFaceLandmarks(canvas, [detection])
          
          setMessage('🎯 Face detected! Matching with registered data...')
          
          const faceDescriptor = Array.from(detection.descriptor)
          await matchFaceWithBackend(faceDescriptor)
          
        } else {
          setMessage('👤 Please position your face clearly in the frame')
          recognitionAttempts++
          
          if (!isRecognizing) {
            setTimeout(performRecognition, 1000)
          }
        }
      } catch (error) {
        console.error('Recognition error:', error)
        recognitionAttempts++
        
        if (!isRecognizing) {
          setTimeout(performRecognition, 1000)
        }
      }
    }

    performRecognition()
  }

  const matchFaceWithBackend = async (faceDescriptor) => {
    if (isRecognizing) return
    
    setIsRecognizing(true)
    
    try {
      setMessage('🔍 Matching face data...')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/face/recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          faceDescriptor,
          studentId: user.id
        })
      })

      const result = await response.json()

      if (result.success && result.match) {
        setMessage('✅ Face recognized! Marking attendance...')
        await markAttendance(result.data)
        
      } else if (result.success && !result.match) {
        setMessage('❌ Face not recognized. Please try QR code or register your face first.')
        
      } else {
        setMessage('❌ Recognition failed: ' + result.message)
      }
      
    } catch (error) {
      console.error('Backend match error:', error)
      setMessage('❌ Connection error: ' + error.message)
    }
    
    setIsRecognizing(false)
  }

  const markAttendance = async (recognitionData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: user.id,
          method: 'face',
          faceRecognitionData: {
            confidence: recognitionData?.confidence || 0.85,
            matchedAt: new Date().toISOString(),
            studentName: user.name,
            recognitionId: `face_${Date.now()}`,
            originalData: recognitionData
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage('🎉 Attendance marked successfully!')
        setTimeout(() => {
          onSuccess(result)
        }, 1500)
      } else {
        setMessage('❌ Attendance marking failed: ' + result.message)
      }
      
    } catch (error) {
      console.error('Attendance marking error:', error)
      setMessage('❌ Failed to mark attendance: ' + error.message)
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
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>📷 Face Recognition Attendance</h2>
          <button 
            onClick={onClose}
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
            <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  height: '400px', 
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
                  height: '100%'
                }}
              />
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setIsRecognizing(false)
                    recognizeFace()
                  }}
                  disabled={isRecognizing}
                  style={{
                    background: isRecognizing ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: isRecognizing ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isRecognizing ? 'Recognizing...' : '🔄 Try Again'}
                </button>

                <button
                  onClick={onClose}
                  style={{
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Use QR Code Instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceAttendance
