import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'

function FaceAttendance({ user, onSuccess, onClose }) {
  const [message, setMessage] = useState('Loading...')
  const [isRecognizing, setIsRecognizing] = useState(false)
  const videoRef = useRef()
  const streamRef = useRef()

  useEffect(() => {
    startEverything()
    return () => cleanup()
  }, [])

  const startEverything = async () => {
    try {
      console.log('🔄 Starting camera for attendance...')
      setMessage('Starting camera...')
      
      // Get camera stream first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      
      console.log('✅ Got camera stream for attendance:', stream)
      streamRef.current = stream
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('✅ Set video srcObject for attendance')
        
        // Force play
        try {
          await videoRef.current.play()
          console.log('✅ Video is playing for attendance')
          setMessage('Position your face for attendance marking')
          
          // Load models and start recognition
          setTimeout(() => {
            loadModelsAndRecognize()
          }, 1000)
          
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

  const loadModelsAndRecognize = async () => {
    try {
      setMessage('Loading AI models...')
      
      const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
      
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      
      console.log('✅ Models loaded for attendance')
      setMessage('AI models ready. Position your face for recognition...')
      
      // Start recognition
      setTimeout(() => {
        startRecognition()
      }, 500)
      
    } catch (error) {
      console.error('❌ Model loading error:', error)
      setMessage('Model loading failed: ' + error.message)
    }
  }

  const startRecognition = async () => {
    if (!videoRef.current || isRecognizing) return
    
    setIsRecognizing(true)
    setMessage('Scanning your face...')
    
    let attempts = 0
    const maxAttempts = 10
    
    const recognitionLoop = async () => {
      if (attempts >= maxAttempts) {
        setMessage('Recognition timeout. Please try again.')
        setIsRecognizing(false)
        return
      }
      
      try {
        const video = videoRef.current
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()
        
        if (detection) {
          console.log('✅ Face detected for attendance!')
          setMessage('Face detected! Checking registration...')
          
          const faceDescriptor = Array.from(detection.descriptor)
          await matchFaceWithBackend(faceDescriptor)
          return
        }
        
        attempts++
        setMessage(`Looking for your face... (${attempts}/${maxAttempts})`)
        
        setTimeout(recognitionLoop, 1000)
        
      } catch (error) {
        console.error('Recognition error:', error)
        attempts++
        setTimeout(recognitionLoop, 1000)
      }
    }
    
    recognitionLoop()
  }

  const matchFaceWithBackend = async (faceDescriptor) => {
    try {
      setMessage('Matching with registered data...')
      
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
        setMessage('Face recognized! Marking attendance...')
        await markAttendance(result.data)
      } else {
        setMessage('Face not recognized. Please try again or use QR code.')
        setIsRecognizing(false)
      }
      
    } catch (error) {
      console.error('Backend error:', error)
      setMessage('Connection error: ' + error.message)
      setIsRecognizing(false)
    }
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
          cleanup()
          onSuccess(result)
        }, 1500)
      } else {
        setMessage('Attendance marking failed: ' + result.message)
        setIsRecognizing(false)
      }
      
    } catch (error) {
      console.error('Attendance error:', error)
      setMessage('Failed to mark attendance: ' + error.message)
      setIsRecognizing(false)
    }
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const retryRecognition = () => {
    setIsRecognizing(false)
    setTimeout(() => {
      startRecognition()
    }, 500)
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
          <h2 style={{ margin: 0 }}>📷 Face Recognition Attendance</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
            ×
          </button>
        </div>

        {/* Message */}
        <div style={{
          padding: '10px',
          background: message.includes('successfully') ? '#d4edda' : 
                     message.includes('failed') || message.includes('error') ? '#f8d7da' : '#f0f0f0',
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
            onPlay={() => console.log('📹 Attendance video playing')}
            onError={(e) => console.error('📹 Attendance video error:', e)}
            onLoadedMetadata={() => console.log('📹 Attendance video metadata loaded')}
          />
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={retryRecognition}
            disabled={isRecognizing}
            style={{
              background: isRecognizing ? '#6c757d' : '#0066cc',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: isRecognizing ? 'not-allowed' : 'pointer',
              flex: 1
            }}
          >
            {isRecognizing ? 'Recognizing...' : '🔄 Try Again'}
          </button>

          <button
            onClick={onClose}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            Use QR Code Instead
          </button>
        </div>

      </div>
    </div>
  )
}

export default FaceAttendance
