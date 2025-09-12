import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import Timetable from '../Schedule/Timetable'
import PersonalizedTasks from '../Schedule/PersonalizedTasks'
import { scheduleAPI } from '../../services/api'

function StudentDashboard() {
  const { user } = useAuth()
  const [schedule, setSchedule] = useState([])
  const [currentClass, setCurrentClass] = useState(null)
  const [freeSlots, setFreeSlots] = useState([])
  const [attendance, setAttendance] = useState({})

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    try {
      const [scheduleData, attendanceData] = await Promise.all([
        scheduleAPI.getStudentSchedule(user.id),
        scheduleAPI.getStudentAttendance(user.id)
      ])
      
      setSchedule(scheduleData.schedule)
      setFreeSlots(scheduleData.freeSlots)
      setCurrentClass(scheduleData.currentClass)
      setAttendance(attendanceData)
    } catch (error) {
      console.error('Error loading student data:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.name}!</h1>
        <p className="text-gray-600">Here's your schedule and personalized activities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Class */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Status</h2>
            {currentClass ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900">{currentClass.name}</h3>
                <p className="text-blue-700">Room: {currentClass.room}</p>
                <p className="text-blue-700">Time: {currentClass.time}</p>
                <span className={`inline-block px-2 py-1 rounded text-sm ${
                  attendance[currentClass.id] 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {attendance[currentClass.id] ? 'Present' : 'Absent'}
                </span>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">No class currently scheduled</p>
              </div>
            )}
          </div>

          <Timetable schedule={schedule} attendance={attendance} />
        </div>

        {/* Personalized Tasks */}
        <div>
          <PersonalizedTasks 
            userId={user.id} 
            interests={user.interests} 
            goals={user.goals}
            freeSlots={freeSlots}
          />
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
