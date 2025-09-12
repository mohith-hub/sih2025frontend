import { useState, useEffect } from 'react'
import { taskAPI } from '../../services/api'
import toast from 'react-hot-toast'

function PersonalizedTasks({ userId, interests, goals, freeSlots }) {
  const [tasks, setTasks] = useState([])
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPersonalizedTasks()
  }, [userId, interests, goals])

  const loadPersonalizedTasks = async () => {
    try {
      const response = await taskAPI.getPersonalizedTasks({
        userId,
        interests,
        goals,
        freeSlots
      })
      setTasks(response.tasks)
      setCompletedTasks(new Set(response.completedTaskIds))
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const markTaskComplete = async (taskId) => {
    try {
      await taskAPI.markTaskComplete(taskId, userId)
      setCompletedTasks(prev => new Set([...prev, taskId]))
      toast.success('Task marked as complete!')
    } catch (error) {
      toast.error('Failed to mark task as complete')
    }
  }

  const getTasksByCategory = () => {
    const categories = {
      'Current Free Time': tasks.filter(task => task.timing === 'now'),
      'Upcoming Free Periods': tasks.filter(task => task.timing === 'upcoming'),
      'Personal Development': tasks.filter(task => task.category === 'personal'),
      'Academic Enhancement': tasks.filter(task => task.category === 'academic')
    }
    return categories
  }

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Personalized Activities</h2>
      
      {Object.entries(getTasksByCategory()).map(([category, categoryTasks]) => (
        categoryTasks.length > 0 && (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">{category}</h3>
            <div className="space-y-3">
              {categoryTasks.map(task => (
                <div 
                  key={task.id}
                  className={`border rounded-lg p-3 transition-all ${
                    completedTasks.has(task.id)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {task.duration} min
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {task.difficulty}
                        </span>
                      </div>
                    </div>
                    
                    {!completedTasks.has(task.id) && (
                      <button
                        onClick={() => markTaskComplete(task.id)}
                        className="ml-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
      
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No personalized tasks available right now.</p>
          <p className="text-sm mt-1">Complete your profile setup for better recommendations!</p>
        </div>
      )}
    </div>
  )
}

export default PersonalizedTasks
