import { useState, useEffect, useRef } from 'react'
import { FaceDetection } from '@mediapipe/face_detection'
import { Camera } from '@mediapipe/camera_utils'
import { attendanceAPI } from '../../services/attendance'
import toast from 'react-hot-toast'

function FaceRecognition({ onRecognition, isActive }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const [detecting, setDetecting] = useState(false)
  const [lastCapture, setLastCapture] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const faceDetection = new FaceDetection({
      model: 'short',
      minDetectionConfidence: 0.5
    })

    faceDetection.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5
    })

    faceDetection.onResults((results) => {
      if (results.detections.length > 0) {
        handleFaceDetected(results.detections[0])
      }
    })

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceDetection.send({ image: videoRef.current })
        }
      },
      width: 640,
      height: 480
    })

    camera.start()
    setDetecting(true)

    return () => {
      camera.stop()
      setDetecting(false)
    }
  }, [isActive])

  const handleFaceDetected = async (detection) => {
    const now = Date.now()
    if (now - lastCapture < 3000) return // Prevent rapid captures
    
    setLastCapture(now)
    
    try {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      const result = await attendanceAPI.recognizeFace({
        imageData,
        method: 'face'
      })
      
      if (result.recognized) {
        toast.success(`Welcome ${result.studentName}!`)
        onRecognition(result)
      }
    } catch (error) {
      console.error('Face recognition error:', error)
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto">
      <video 
        ref={videoRef}
        className="w-full rounded-lg shadow-lg"
        style={{ display: isActive ? 'block' : 'none' }}
        autoPlay
        muted
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {detecting && (
        <div className="absolute inset-0 border-2 border-green-500 rounded-lg">
          <div className="absolute top-2 left-2 right-2 bg-green-500 text-white text-sm text-center p-1 rounded">
            Face Recognition Active
          </div>
        </div>
      )}
    </div>
  )
}

export default FaceRecognition
