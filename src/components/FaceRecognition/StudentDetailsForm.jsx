import { useState } from 'react'

function StudentDetailsForm({ onProceed, onCancel }) {
  const [studentData, setStudentData] = useState({
    name: '',
    rollNo: '',
    email: '',
    department: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors = {}
    
    if (!studentData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (studentData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    if (!studentData.rollNo.trim()) {
      newErrors.rollNo = 'Roll Number is required'
    } else if (!/^[A-Z0-9]+$/i.test(studentData.rollNo.trim())) {
      newErrors.rollNo = 'Roll Number can only contain letters and numbers'
    }
    
    if (!studentData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!studentData.department.trim()) {
      newErrors.department = 'Department is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Clean the data
      const cleanedData = {
        name: studentData.name.trim(),
        rollNo: studentData.rollNo.trim().toUpperCase(),
        email: studentData.email.trim().toLowerCase(),
        department: studentData.department.trim()
      }
      
      // Simulate validation delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Proceed to face registration
      onProceed(cleanedData)
    } catch (error) {
      setErrors({ submit: 'Failed to validate student data. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field) => (e) => {
    setStudentData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #1F2127 0%, #181B21 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #2A2D35, #33373F)',
        borderRadius: '20px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(64, 70, 81, 0.3)',
        border: '1px solid #404651',
        position: 'relative',
        animation: 'fadeInUp 0.6s ease'
      }}>
        {/* Top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #017E6E, #00A693)',
          borderRadius: '20px 20px 0 0'
        }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #017E6E, #00A693)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '1.5rem',
            boxShadow: '0 0 20px rgba(1, 126, 110, 0.3)'
          }}>
            👤
          </div>
          <h2 style={{
            color: '#FFFFFF',
            fontSize: '1.5rem',
            fontWeight: '700',
            margin: '0 0 0.5rem 0'
          }}>
            Student Registration
          </h2>
          <p style={{
            color: '#B8BCC8',
            fontSize: '0.9rem',
            margin: 0
          }}>
            Please enter your details to proceed with face registration
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Full Name *
            </label>
            <input
              type="text"
              value={studentData.name}
              onChange={handleInputChange('name')}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: `2px solid ${errors.name ? '#EF4444' : '#404651'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = '#017E6E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = '#404651'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.name && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.name}
              </div>
            )}
          </div>

          {/* Roll Number Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Roll Number *
            </label>
            <input
              type="text"
              value={studentData.rollNo}
              onChange={handleInputChange('rollNo')}
              placeholder="Enter your roll number"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: `2px solid ${errors.rollNo ? '#EF4444' : '#404651'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box',
                textTransform: 'uppercase'
              }}
              onFocus={(e) => {
                if (!errors.rollNo) {
                  e.target.style.borderColor = '#017E6E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!errors.rollNo) {
                  e.target.style.borderColor = '#404651'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.rollNo && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.rollNo}
              </div>
            )}
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Email Address *
            </label>
            <input
              type="email"
              value={studentData.email}
              onChange={handleInputChange('email')}
              placeholder="Enter your email address"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: `2px solid ${errors.email ? '#EF4444' : '#404651'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = '#017E6E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = '#404651'
                  e.target.style.boxShadow = 'none'
                }
              }}
            />
            {errors.email && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.email}
              </div>
            )}
          </div>

          {/* Department Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Department *
            </label>
            <select
              value={studentData.department}
              onChange={handleInputChange('department')}
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                background: '#33373F',
                border: `2px solid ${errors.department ? '#EF4444' : '#404651'}`,
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                if (!errors.department) {
                  e.target.style.borderColor = '#017E6E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(1, 126, 110, 0.1)'
                }
              }}
              onBlur={(e) => {
                if (!errors.department) {
                  e.target.style.borderColor = '#404651'
                  e.target.style.boxShadow = 'none'
                }
              }}
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics">Electronics & Communication</option>
              <option value="Mechanical">Mechanical Engineering</option>
              <option value="Civil">Civil Engineering</option>
              <option value="Electrical">Electrical Engineering</option>
              <option value="Other">Other</option>
            </select>
            {errors.department && (
              <div style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {errors.department}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              color: '#EF4444',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              {errors.submit}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '1rem',
                background: '#33373F',
                color: '#B8BCC8',
                border: '2px solid #404651',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#404651'
                e.target.style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#33373F'
                e.target.style.color = '#B8BCC8'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                flex: 2,
                padding: '1rem',
                background: isSubmitting ? '#567274' : 'linear-gradient(135deg, #017E6E, #00A693)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: isSubmitting ? 'none' : '0 4px 15px rgba(1, 126, 110, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(1, 126, 110, 0.6)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 15px rgba(1, 126, 110, 0.4)'
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>📷</span>
                  <span>Proceed to Face Registration</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem 0',
          borderTop: '1px solid #404651'
        }}>
          <p style={{
            color: '#8B92A9',
            fontSize: '0.8rem',
            margin: 0
          }}>
            Your information is secure and will only be used for attendance tracking
          </p>
        </div>
      </div>

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          input::placeholder,
          select option {
            color: #8B92A9 !important;
          }

          select option {
            background: #33373F !important;
            color: #FFFFFF !important;
          }

          @media (max-width: 480px) {
            div[style*="padding: 2.5rem"] {
              padding: 2rem !important;
            }
          }
        `
      }} />
    </div>
  )
}

export default StudentDetailsForm
