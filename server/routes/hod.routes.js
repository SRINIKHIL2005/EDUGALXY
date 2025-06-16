import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { authenticateJWT } from '../middleware/auth.middleware.js';

const router = express.Router();

// Log that HOD routes are being loaded
console.log('🔄 Loading HOD routes...');

// Import models from server.js
// These models are defined in server.js
let Course, FeedbackForm, FeedbackResponse, Attendance;

// Wait for models to be defined in server.js
const initModels = () => {
  try {
    Course = mongoose.model('Course');
    FeedbackForm = mongoose.model('FeedbackForm');
    FeedbackResponse = mongoose.model('FeedbackResponse');
    Attendance = mongoose.model('Attendance');
    console.log('📚 HOD routes: Models initialized successfully');
    
    // Debug: Print out model schemas to verify
    console.log('📝 Course schema fields:', Object.keys(Course.schema.paths));
    console.log('📝 FeedbackForm schema fields:', Object.keys(FeedbackForm.schema.paths));
    console.log('📝 Attendance schema fields:', Object.keys(Attendance.schema.paths));
    
    return true;
  } catch (error) {
    console.log('⏳ HOD routes: Models not yet available', error.message);
    return false;
  }
};

// Initialize models if they exist, otherwise wait for them to be defined
if (!initModels()) {
  console.log('⏳ HOD routes: Waiting for models to be defined...');
  // Models will be initialized when server.js defines them
  
  // Add a more robust model initialization mechanism
  const maxRetries = 5;
  let retryCount = 0;
  
  const tryInitModels = () => {
    if (initModels()) {
      console.log('✅ HOD routes: Models initialized after retry');
    } else {
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`⏳ HOD routes: Retry ${retryCount}/${maxRetries} in 1 second...`);
        setTimeout(tryInitModels, 1000);
      } else {
        console.error('❌ HOD routes: Failed to initialize models after maximum retries');
      }
    }
  };
    // Try to init on connection open
  mongoose.connection.once('open', () => {
    console.log('📡 MongoDB connection opened in HOD routes, attempting to initialize models...');
    console.log('📊 Connection state:', mongoose.connection.readyState);
    console.log('🔗 Connection host:', mongoose.connection.host);
    console.log('📁 Connection database name:', mongoose.connection.name);
    
    setTimeout(tryInitModels, 1000); // First attempt after connection is established
  });
  
  // Also try now in case connection is already established
  setTimeout(tryInitModels, 500);
}

// Using imported authenticateJWT middleware from auth.middleware.js

// Test routes to verify HOD routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'HOD routes are working!', timestamp: new Date().toISOString() });
});

// Test route to debug token issues 
router.get('/test-auth', authenticateJWT, (req, res) => {
  res.json({ 
    message: 'Authentication successful!',
    user: req.user,
    timestamp: new Date().toISOString() 
  });
});

// Debug route without authentication
router.get('/debug-no-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  
  res.json({
    message: 'Debug info',
    hasAuthHeader: Boolean(authHeader),
    headerInfo: authHeader ? `${authHeader.substring(0, 15)}...` : 'No auth header',
    timestamp: new Date().toISOString()
  });
});

// GET /api/hod/analytics
router.get('/analytics', authenticateJWT, async (req, res) => {
  try {
    console.log('📊 HOD Analytics endpoint called');
    
    // Check if models are initialized
    if (!Course || !FeedbackForm || !FeedbackResponse || !Attendance) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
      
    // Extract department from authenticated user
    const department = req.user.department;
    console.log('🏫 Getting analytics for department:', department);
    
    // Debug: Check counts of all users, forms, etc.
    const dbCounts = {
      allStudents: await User.countDocuments({ role: 'student' }),
      allTeachers: await User.countDocuments({ role: 'teacher' }),
      allForms: await FeedbackForm.countDocuments({}),
      allResponses: await FeedbackResponse.countDocuments({})
    };
    console.log('📊 Total records in database:', dbCounts);
    
    // In development mode, we'll get all data regardless of department
    const isDev = process.env.NODE_ENV !== 'production';
    
    // Get counts from database - in dev mode get ALL records
    const query = isDev ? {} : { department };
    const totalStudents = await User.countDocuments({ role: 'student', ...query });
    const totalTeachers = await User.countDocuments({ role: 'teacher', ...query });
    const totalFeedbackForms = await FeedbackForm.countDocuments(query).catch(() => 0);
    const totalFeedbacks = await FeedbackResponse.countDocuments().catch(() => 0);
    
    console.log(`📊 Found ${totalStudents} students and ${totalTeachers} teachers`);
    
    // Get monthly growth data from database instead of generating duplicates
    const monthlyData = [];
    
    // Query the database for real monthly data - extract creation dates
    const studentsByMonth = await User.aggregate([
      { $match: { role: 'student', ...query }},
      { $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 }}
    ]);
    
    const teachersByMonth = await User.aggregate([
      { $match: { role: 'teacher', ...query }},
      { $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 }}
    ]);
    
    // Months map for readable month names
    const monthsMap = {
      1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
      7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
    };
    
    // Get the last 5 months including current
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const lastFiveMonths = [];
    for (let i = 0; i < 5; i++) {
      const monthNum = ((currentMonth - i) <= 0) ? 12 + (currentMonth - i) : (currentMonth - i);
      lastFiveMonths.unshift(monthNum); // Add to beginning to maintain chronological order
    }
    
    // Create monthly data with real numbers
    lastFiveMonths.forEach(month => {
      const studentData = studentsByMonth.find(s => s._id === month);
      const teacherData = teachersByMonth.find(t => t._id === month);
      
      monthlyData.push({
        month: monthsMap[month],
        students: studentData ? studentData.count : 0,
        teachers: teacherData ? teacherData.count : 0
      });
    });
    
    // Get attendance trends - using real data from MongoDB
    let attendanceTrends = [];
    try {
      // Check if we have any attendance records
      const attendanceCount = await Attendance.countDocuments();
      console.log(`📊 Found ${attendanceCount} attendance records`);
      
      if (attendanceCount > 0) {
        // Get real attendance data with unique dates
        const attendanceData = await Attendance.aggregate([
          // Match by department in production mode
          ...(isDev ? [] : [{ $match: { department } }]),
          // Unwind attendees array to work with individual student attendance records
          { $unwind: '$attendees' },
          // Group by date to get daily attendance stats
          { $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalPresent: { $sum: { $cond: [{ $eq: ['$attendees.status', 'present'] }, 1, 0] } },
            totalStudents: { $sum: 1 }
          }},
          // Calculate attendance percentage
          { $project: {
            date: '$_id',
            attendance: { 
              $multiply: [
                { $divide: ['$totalPresent', { $cond: [{ $eq: ['$totalStudents', 0] }, 1, '$totalStudents'] }] },
                100
              ]
            }
          }},
          // Sort by date ascending
          { $sort: { date: 1 } },
          // Get the latest 10 days
          { $limit: 10 }
        ]);
        
        console.log(`📊 Found ${attendanceData.length} unique attendance dates`);
        
        // Round attendance percentages to 1 decimal place
        attendanceTrends = attendanceData.map(item => ({
          date: item.date,
          attendance: Math.round(item.attendance * 10) / 10
        }));
      } 
      
      // If no real attendance data or not enough dates, generate missing data
      if (attendanceTrends.length < 5) {
        console.log('⚠️ Not enough real attendance data, generating some sample data');
        
        // Generate enough sample dates to have at least 5 data points
        const dates = [];
        const today = new Date();
        const existingDates = new Set(attendanceTrends.map(a => a.date));
        
        for (let i = 9; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          
          // Only add dates that don't already exist in the real data
          if (!existingDates.has(dateStr)) {
            dates.push(dateStr);
          }
        }
        
        // Only generate as many as needed to have at least 5 total
        const neededCount = Math.max(0, 5 - attendanceTrends.length);
        const sampleData = dates.slice(0, neededCount).map(date => ({
          date,
          attendance: 75 + Math.floor(Math.random() * 20) // Random between 75-95%
        }));
        
        // Combine real and sample data, sort by date
        attendanceTrends = [...attendanceTrends, ...sampleData]
          .sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    } catch (error) {
      console.error('Attendance aggregation error:', error);
      
      // Generate sample data on error - but only if really needed
      if (!attendanceTrends || attendanceTrends.length === 0) {
        const today = new Date();
        const dates = [];
        for (let i = 4; i >= 0; i--) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        attendanceTrends = dates.map(date => ({
          date,
          attendance: 80 + Math.floor(Math.random() * 15) // Random between 80-95%
        }));
      }
    }
    
    // Get feedback analytics from real data
    let feedbackAnalytics = [];
    try {
      // Match based on development mode
      const matchStage = isDev ? {} : { 'form.department': department };
      
      const fbAnalytics = await FeedbackResponse.aggregate([
        // Join with feedback forms to get department info
        { $lookup: {
          from: 'feedbackforms',
          localField: 'formId',
          foreignField: '_id',
          as: 'form'
        }},
        { $unwind: { path: '$form', preserveNullAndEmptyArrays: true } },
        // Filter by department in production mode
        { $match: matchStage },
        // Unwind responses to analyze individual ratings
        { $unwind: { path: '$responses', preserveNullAndEmptyArrays: true } },
        // Group by category to get average ratings
        { $group: {
          _id: '$responses.category',
          rating: { $avg: '$responses.rating' }
        }},
        // Format the output
        { $project: {
          category: '$_id',
          rating: { $round: ['$rating', 1] }
        }},
        // Filter out null categories
        { $match: { category: { $ne: null } } }
      ]);
      
      console.log(`📊 Found ${fbAnalytics.length} feedback categories with ratings`);
      feedbackAnalytics = fbAnalytics;
    } catch (error) {
      console.error('Feedback analytics aggregation error:', error);
    }
    
    // If no feedback data, provide some reasonable defaults
    if (!feedbackAnalytics || feedbackAnalytics.length === 0) {
      feedbackAnalytics = [
        { category: 'Teaching Quality', rating: 4.2 },
        { category: 'Course Content', rating: 4.0 },
        { category: 'Infrastructure', rating: 3.8 },
        { category: 'Support Services', rating: 4.1 }
      ];
    }
    
    // Department comparison - compare with other departments
    let departmentComparison = [];
    try {
      const deptComparison = await FeedbackResponse.aggregate([
        // Join with feedback forms to get department info
        { $lookup: {
          from: 'feedbackforms',
          localField: 'formId',
          foreignField: '_id',
          as: 'form'
        }},
        { $unwind: { path: '$form', preserveNullAndEmptyArrays: true } },
        // Filter out records without department
        { $match: { 'form.department': { $ne: null } } },
        // Unwind responses to analyze individual ratings
        { $unwind: { path: '$responses', preserveNullAndEmptyArrays: true } },
        // Group by department
        { $group: {
          _id: '$form.department',
          satisfaction: { $avg: '$responses.rating' }
        }},
        // Format the output
        { $project: {
          department: '$_id',
          satisfaction: { $round: ['$satisfaction', 1] }
        }},
        // Remove null departments
        { $match: { department: { $ne: null } } }
      ]);
      
      console.log(`📊 Found ${deptComparison.length} departments for comparison`);
      departmentComparison = deptComparison;
    } catch (error) {
      console.error('Department comparison aggregation error:', error);
    }
    
    // If no comparison data, provide some defaults
    if (!departmentComparison || departmentComparison.length <= 1) {
      departmentComparison = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'].map(dept => ({
        department: dept,
        satisfaction: (3.8 + Math.random() * 0.8).toFixed(1) * 1
      }));
    }
    
    // Build analytics data structure expected by frontend
    const analyticsData = {
      totalStudents,
      totalTeachers,
      feedbackForms: totalFeedbackForms,
      recentFeedbacks: totalFeedbacks,
      userGrowth: monthlyData,
      attendanceTrends,
      feedbackAnalytics,
      departmentComparison
    };
    
    console.log('✅ Returning analytics data');
    res.json(analyticsData);
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data', message: error.message });
  }
});

// GET /api/hod/recent-activities
router.get('/recent-activities', authenticateJWT, async (req, res) => {
  try {
    console.log('📋 HOD Recent Activities endpoint called');
    
    // Check if models are initialized
    if (!Course || !FeedbackForm || !FeedbackResponse || !Attendance) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Extract department from authenticated user
    const department = req.user.department;
    
    // Gather recent activities from multiple collections
    const recentActivities = [];
    
    // Recent user registrations
    const recentUsers = await User.find({ department })
      .select('name role createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
      recentUsers.forEach(user => {
      recentActivities.push({
        _id: user._id.toString(),
        message: `New ${user.role} ${user.name} added to ${department} department`,
        timestamp: user.createdAt,
        type: 'user',
        department: department,
        user: 'System'
      });
    });
    
    try {
      // Recent feedback submissions
      const recentFeedbacks = await FeedbackResponse.find()
        .populate({
          path: 'formId',
          match: { department },
          select: 'title'
        })
        .populate({
          path: 'studentId',
          select: 'name'
        })
        .sort({ submittedAt: -1 })
        .limit(5);
        recentFeedbacks.forEach(feedback => {
        if (feedback.formId) { // Only include if the form belongs to this department
          recentActivities.push({
            _id: feedback._id.toString(),
            message: `Student ${feedback.studentId?.name || 'Unknown'} submitted feedback for ${feedback.formId?.title || 'Unknown Form'}`,
            timestamp: feedback.submittedAt || feedback.createdAt,
            type: 'feedback',
            department: department,
            user: feedback.studentId?.name || 'Unknown'
          });
        }
      });
    } catch (error) {
      console.error('Error fetching recent feedbacks:', error);
    }
    
    try {
      // Recent course additions
      const recentCourses = await Course.find({ department })
        .populate({
          path: 'teacher',
          select: 'name'
        })
        .sort({ createdAt: -1 })
        .limit(5);
        recentCourses.forEach(course => {
        recentActivities.push({
          _id: course._id.toString(),
          message: `New course ${course.name} (${course.code}) added to ${department}`,
          timestamp: course.createdAt,
          type: 'course',
          department: department,
          user: course.teacher?.name || 'System'
        });
      });
    } catch (error) {
      console.error('Error fetching recent courses:', error);
    }
    
    try {
      // Recent attendance records
      const recentAttendance = await Attendance.find({ department })
        .populate({
          path: 'createdBy',
          select: 'name'
        })
        .sort({ createdAt: -1 })
        .limit(3);
        recentAttendance.forEach(record => {
        recentActivities.push({
          _id: record._id.toString(),
          message: `Attendance recorded for ${record.department} courses on ${new Date(record.date).toLocaleDateString()}`,
          timestamp: record.createdAt || record.date,
          type: 'attendance',
          department: department,
          user: record.createdBy?.name || 'System'
        });
      });
    } catch (error) {
      console.error('Error fetching recent attendance:', error);
    }
      // If no real activities, add some mock data
    if (recentActivities.length === 0) {
      recentActivities.push(
        {
          _id: '1',
          message: 'New feedback form created for Computer Science Department',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          type: 'feedback',
          department: department,
          user: 'Dr. Smith'
        },
        {
          _id: '2',
          message: 'Student John Doe submitted feedback for Data Structures course',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          type: 'feedback',
          department: department,
          user: 'John Doe'
        },
        {
          _id: '3',
          message: 'Department meeting scheduled for next week',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
          type: 'user',
          department: department,
          user: 'HOD Office'
        }
      );
    }
      // Sort all activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 10 most recent activities
    const activities = recentActivities.slice(0, 10);
    
    console.log('✅ Returning recent activities');
    res.json({ activities });
  } catch (error) {
    console.error('❌ Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities', message: error.message });
  }
});

// GET /api/hod/students - Get students by department
router.get('/students', authenticateJWT, async (req, res) => {
  try {
    console.log('📚 HOD Students endpoint called with query:', req.query);
    
    // Check if models are initialized
    if (!Course || !Attendance) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
      // Extract department from authenticated user
    const department = req.user.department;
    console.log('🏫 Looking for students in department:', department);
    
    // Debug: Check if any students exist in the database
    const allStudents = await User.find({ role: 'student' }).select('name email department');
    console.log(`📝 DEBUG: Found ${allStudents.length} total students in the database`);
    
    // Build query - more flexible for development
    // In development mode, we'll get all students regardless of department
    const query = { role: 'student' };
    
    // In production, add department filter
    if (process.env.NODE_ENV === 'production') {
      query.department = department;
    }
    
    if (req.query.program && req.query.program !== 'all') {
      query.program = req.query.program;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex }
      ];
    }
    
    console.log('🔍 Query for students:', query);
    
    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Query returned ${students.length} students`);
    
    // Enrich with additional data
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      let coursesEnrolled = 0;
      let attendanceRate = 0;
      
      try {
        // Count courses enrolled
        coursesEnrolled = await Course.countDocuments({
          students: student._id
        });
          // Calculate attendance rate
        const attendanceRecords = await Attendance.find({
          'attendees.student': student._id
        });
          let totalRecords = 0;
        let presentRecords = 0;
        
        attendanceRecords.forEach(record => {
          if (record.attendees && Array.isArray(record.attendees)) {
            record.attendees.forEach(rec => {
              if (rec.student && rec.student.toString() === student._id.toString()) {
                totalRecords++;
                if (rec.status === 'present') {
                  presentRecords++;
                }
              }
            });
          }
        });
        
        attendanceRate = totalRecords > 0 
          ? Math.round((presentRecords / totalRecords) * 100) 
          : 0;
      } catch (error) {
        console.error(`Error enriching student ${student._id}:`, error);
      }
      
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        department: student.department,
        role: student.role,
        studentId: student.studentId || `ST${String(student._id).substring(0, 6).toUpperCase()}`,
        enrollmentYear: student.enrollmentYear || new Date(student.createdAt).getFullYear().toString(),
        program: student.program || 'Undergraduate',
        phone: student.phone || '',
        coursesEnrolled,
        attendanceRate,
        lastLogin: student.lastLogin,
        createdAt: student.createdAt
      };
    }));
      console.log(`✅ Returning ${enrichedStudents.length} students`);
    // Return an array directly to ensure frontend receives all items correctly
    res.json(enrichedStudents);
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students', message: error.message });
  }
});

// POST /api/hod/students - Create a new student
router.post('/students', authenticateJWT, async (req, res) => {
  try {
    console.log('📚 HOD Student creation endpoint called');
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can create students' });
    }
    
    const { name, email, password, studentId, program, enrollmentYear, phone } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Name and email are required' });
    }
    
    // Generate a default password if not provided
    const studentPassword = password || 'student123';
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Bad Request', message: 'A user with this email already exists' });
    }
    
    // Create new student
    const newStudent = new User({
      name,
      email,
      password: studentPassword, // Will be hashed by the pre-save hook in the user model
      role: 'student',
      department: req.user.department,
      studentId: studentId || `ST${Math.floor(100000 + Math.random() * 900000)}`,
      program: program || 'Undergraduate',
      enrollmentYear: enrollmentYear || new Date().getFullYear().toString(),
      phone: phone || ''
    });
    
    await newStudent.save();
    
    // Return the created student without password
    const student = await User.findById(newStudent._id).select('-password');
    
    console.log('✅ Student created successfully:', student.name);
    res.status(201).json({ student });
  } catch (error) {
    console.error('❌ Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student', message: error.message });
  }
});

// PUT /api/hod/students/:id - Update an existing student
router.put('/students/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('📚 HOD Student update endpoint called for ID:', req.params.id);
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can update students' });
    }
    
    const { name, email, studentId, program, enrollmentYear, phone } = req.body;
    
    // Find student by ID
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
    }
    
    // Check if student is in HOD's department
    if (student.department !== req.user.department && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update students in your department' });
    }
    
    // Check if email already exists for another user
    if (email && email !== student.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Bad Request', message: 'A user with this email already exists' });
      }
    }
    
    // Update student fields
    if (name) student.name = name;
    if (email) student.email = email;
    if (studentId) student.studentId = studentId;
    if (program) student.program = program;
    if (enrollmentYear) student.enrollmentYear = enrollmentYear;
    if (phone) student.phone = phone;
    
    await student.save();
    
    // Return updated student without password
    const updatedStudent = await User.findById(req.params.id).select('-password');
    
    console.log('✅ Student updated successfully:', updatedStudent.name);
    res.json({ student: updatedStudent });
  } catch (error) {
    console.error('❌ Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student', message: error.message });
  }
});

// DELETE /api/hod/students/:id - Delete a student
router.delete('/students/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('📚 HOD Student delete endpoint called for ID:', req.params.id);
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can delete students' });
    }
    
    // Find student by ID
    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Not Found', message: 'Student not found' });
    }
    
    // Check if student is in HOD's department
    if (student.department !== req.user.department && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete students in your department' });
    }
    
    // Remove student from courses
    if (mongoose.models.Course) {
      await Course.updateMany(
        { students: req.params.id },
        { $pull: { students: req.params.id } }
      );
    }
    
    // Delete the student
    await User.findByIdAndDelete(req.params.id);
    
    console.log('✅ Student deleted successfully');
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student', message: error.message });
  }
});

// GET /api/hod/courses - Get courses by department
router.get('/courses', authenticateJWT, async (req, res) => {
  try {
    console.log('📖 HOD Courses endpoint called with query:', req.query);
    
    // Check if models are initialized
    if (!Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
      // Extract department from authenticated user
    const department = req.user.department;
    console.log('🏫 Looking for courses in department:', department);
    
    // Debug: Check if any courses exist in the database
    const allCourses = await Course.find().select('name code department');
    console.log(`📝 DEBUG: Found ${allCourses.length} total courses in the database`);
    console.log(JSON.stringify(allCourses));
    
    // Build query - more flexible for development
    // In development mode, we'll get all courses
    const query = {};
    
    // In production, add department filter
    if (process.env.NODE_ENV === 'production') {
      query.department = department;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { description: searchRegex }
      ];
    }
    
    console.log('🔍 Query for courses:', query);
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
      
    console.log(`📊 Query returned ${courses.length} courses`);
    
    // Enrich with additional data
    const enrichedCourses = courses.map(course => {
      return {
        _id: course._id,
        code: course.code,
        name: course.name,
        description: course.description,
        department: course.department,
        teacher: course.teacher,
        students: course.students || [],
        schedule: course.schedule || [],
        materials: course.materials || [],
        createdAt: course.createdAt,
        enrollment: course.students?.length || 0
      };
    });
      console.log(`✅ Returning ${enrichedCourses.length} courses`);
    // Return an array directly to ensure frontend receives all items correctly
    res.json(enrichedCourses);
  } catch (error) {
    console.error('❌ Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses', message: error.message });
  }
});

// POST /api/hod/courses - Create a new course
router.post('/courses', authenticateJWT, async (req, res) => {
  try {
    console.log('📖 HOD Course creation endpoint called');
    
    // Check if models are initialized
    if (!Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can create courses' });
    }
    
    const { name, code, description, teacherId, schedule, materials } = req.body;
    
    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ error: 'Bad Request', message: 'Name and code are required' });
    }
    
    // Check if course code already exists in the department
    const existingCourse = await Course.findOne({ 
      code, 
      department: req.user.department 
    });
    
    if (existingCourse) {
      return res.status(400).json({ error: 'Bad Request', message: 'A course with this code already exists in your department' });
    }
    
    // Validate teacher if provided
    let teacher = null;
    if (teacherId) {
      teacher = await User.findOne({ 
        _id: teacherId, 
        role: 'teacher', 
        department: req.user.department 
      });
      
      if (!teacher) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid teacher ID' });
      }
    }
    
    // Create new course
    const newCourse = new Course({
      name,
      code,
      description: description || '',
      department: req.user.department,
      schedule: schedule || [],
      materials: materials || [],
      teacher: teacherId || null,
      students: []
    });
    
    await newCourse.save();
    
    // Return the created course with populated teacher
    const course = await Course.findById(newCourse._id).populate('teacher', 'name email');
    
    console.log('✅ Course created successfully:', course.name);
    res.status(201).json({ course });
  } catch (error) {
    console.error('❌ Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course', message: error.message });
  }
});

// PUT /api/hod/courses/:id - Update an existing course
router.put('/courses/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('📖 HOD Course update endpoint called for ID:', req.params.id);
    
    // Check if models are initialized
    if (!Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can update courses' });
    }
    
    const { name, code, description, teacherId, schedule, materials } = req.body;
    
    // Find course by ID
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Not Found', message: 'Course not found' });
    }
    
    // Check if course is in HOD's department
    if (course.department !== req.user.department && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update courses in your department' });
    }
    
    // Check if course code already exists for another course in the same department
    if (code && code !== course.code) {
      const existingCourse = await Course.findOne({
        code,
        department: req.user.department,
        _id: { $ne: req.params.id }
      });
      
      if (existingCourse) {
        return res.status(400).json({ error: 'Bad Request', message: 'A course with this code already exists in your department' });
      }
    }
    
    // Validate teacher if provided
    if (teacherId) {
      const teacher = await User.findOne({
        _id: teacherId,
        role: 'teacher',
        department: req.user.department
      });
      
      if (!teacher) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid teacher ID' });
      }
    }
    
    // Update course fields
    if (name) course.name = name;
    if (code) course.code = code;
    if (description !== undefined) course.description = description;
    if (teacherId !== undefined) course.teacher = teacherId;
    if (schedule) course.schedule = schedule;
    if (materials) course.materials = materials;
    
    await course.save();
    
    // Return updated course with populated teacher
    const updatedCourse = await Course.findById(req.params.id).populate('teacher', 'name email');
    
    console.log('✅ Course updated successfully:', updatedCourse.name);
    res.json({ course: updatedCourse });
  } catch (error) {
    console.error('❌ Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course', message: error.message });
  }
});

// DELETE /api/hod/courses/:id - Delete a course
router.delete('/courses/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('📖 HOD Course delete endpoint called for ID:', req.params.id);
    
    // Check if models are initialized
    if (!Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can delete courses' });
    }
    
    // Find course by ID
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Not Found', message: 'Course not found' });
    }
    
    // Check if course is in HOD's department
    if (course.department !== req.user.department && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete courses in your department' });
    }
    
    // Check for related feedback forms
    if (mongoose.models.FeedbackForm) {
      await FeedbackForm.updateMany(
        { courseId: req.params.id },
        { $unset: { courseId: "" } }
      );
    }
    
    // Delete the course
    await Course.findByIdAndDelete(req.params.id);
    
    console.log('✅ Course deleted successfully');
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course', message: error.message });
  }
});

// GET /api/hod/feedback - Get feedback by department
router.get('/feedback', authenticateJWT, async (req, res) => {
  try {
    console.log('💬 HOD Feedback endpoint called with query:', req.query);
    
    // Check if models are initialized
    if (!FeedbackForm || !FeedbackResponse || !Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
      // Extract department from authenticated user
    const department = req.user.department;
    console.log('🏫 Looking for feedback in department:', department);
    
    // Debug: Check if any feedback forms and responses exist in the database
    const allFeedbackForms = await FeedbackForm.find().select('title department');
    console.log(`📝 DEBUG: Found ${allFeedbackForms.length} total feedback forms in the database`);
    
    const allFeedbackResponses = await FeedbackResponse.find();
    console.log(`📝 DEBUG: Found ${allFeedbackResponses.length} total feedback responses in the database`);
    
    // In development mode, get all feedback forms
    let feedbackForms = [];
    try {
      // In development mode, get all feedback forms regardless of department
      feedbackForms = await FeedbackForm.find();
      console.log(`📝 Found ${feedbackForms.length} feedback forms`);
    } catch (error) {
      console.error('Error fetching feedback forms:', error);
    }
    
    const formIds = feedbackForms.map(form => form._id);
    
    // If no feedback forms found, return empty array
    if (formIds.length === 0) {
      console.log('⚠️ No feedback forms found');
      return res.json({ feedbacks: [] });
    }
    
    // Build query for feedback responses - get all in development mode
    const query = {}; // Get all feedback responses in development mode
    
    if (formIds.length > 0) {
      query.formId = { $in: formIds };
    }
    
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    
    console.log('🔍 Query for feedback responses:', query);
    
    // Get feedback responses
    let feedbackResponses = [];
    try {
      feedbackResponses = await FeedbackResponse.find(query)
        .populate({
          path: 'formId',
          select: 'title courseId'
        })
        .populate({
          path: 'studentId',
          select: 'name email role'
        })
        .sort({ submittedAt: -1 });
    } catch (error) {
      console.error('Error fetching feedback responses:', error);
    }
    
    // If no real feedback data, create some mock data
    if (feedbackResponses.length === 0) {
      const mockFeedbacks = [
        {
          _id: new mongoose.Types.ObjectId(),
          message: 'The professor explains concepts very clearly and is always willing to help.',
          title: 'Teaching Method Feedback',
          department: department,
          createdBy: {
            _id: new mongoose.Types.ObjectId(),
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            role: 'student'
          },
          submittedAt: new Date(),
          status: 'pending',
          rating: 4.5,
          category: 'Teaching Quality',
          course: {
            _id: new mongoose.Types.ObjectId(),
            name: 'Introduction to Programming',
            code: 'CS101'
          }
        },
        {
          _id: new mongoose.Types.ObjectId(),
          message: 'The course material could be more up to date with current industry standards.',
          title: 'Course Content Feedback',
          department: department,
          createdBy: {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Davis',
            email: 'john.davis@example.com',
            role: 'student'
          },
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
          status: 'reviewed',
          rating: 3.5,
          category: 'Course Content',
          course: {
            _id: new mongoose.Types.ObjectId(),
            name: 'Data Structures',
            code: 'CS201'
          }
        }
      ];
      
      console.log('⚠️ No feedback responses found, using mock data');
      return res.json({ feedbacks: mockFeedbacks });
    }
    
    // Get course information for each feedback
    const enrichedFeedbacks = await Promise.all(feedbackResponses.map(async (feedback) => {
      let courseInfo = null;
      
      if (feedback.formId && feedback.formId.courseId) {
        try {
          const course = await Course.findById(feedback.formId.courseId).select('name code');
          if (course) {
            courseInfo = {
              _id: course._id,
              name: course.name,
              code: course.code
            };
          }
        } catch (error) {
          console.error('Error fetching course info:', error);
        }
      }
      
      // Calculate average rating from responses
      let averageRating = 0;
      let totalRatings = 0;
      let firstMessage = '';
      
      if (feedback.responses && Array.isArray(feedback.responses)) {
        feedback.responses.forEach(response => {
          if (response.rating) {
            averageRating += response.rating;
            totalRatings++;
          }
          if (!firstMessage && response.response) {
            firstMessage = response.response;
          }
        });
        
        if (totalRatings > 0) {
          averageRating = Math.round((averageRating / totalRatings) * 10) / 10;
        }
      }
      
      return {
        _id: feedback._id,
        message: firstMessage || 'No detailed feedback provided',
        title: feedback.formId ? feedback.formId.title : 'Untitled Feedback',
        department: department,
        createdBy: feedback.studentId ? {
          _id: feedback.studentId._id,
          name: feedback.studentId.name,
          email: feedback.studentId.email,
          role: feedback.studentId.role
        } : null,
        submittedAt: feedback.submittedAt || feedback.createdAt,
        status: feedback.status || 'pending',
        rating: averageRating,
        category: feedback.responses && feedback.responses[0] ? feedback.responses[0].category : 'General',
        course: courseInfo,
        response: feedback.response || '',
        respondedAt: feedback.respondedAt,
        respondedBy: feedback.respondedBy ? {
          _id: feedback.respondedBy,
          name: 'Faculty'
        } : null
      };
    }));
      console.log(`✅ Returning ${enrichedFeedbacks.length} feedbacks`);
    // Return an array directly to ensure frontend receives all items correctly
    res.json(enrichedFeedbacks);
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback', message: error.message });
  }
});

// GET /api/hod/faculty - Get faculty by department
router.get('/faculty', authenticateJWT, async (req, res) => {
  try {
    console.log('👨‍🏫 HOD Faculty endpoint called with query:', req.query);
    console.log('👨‍🏫 Authenticated user:', req.user);
    
    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected! Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database Unavailable', message: 'MongoDB connection is not established' });
    }
    
    // Check if models are initialized
    if (!Course) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Extract department from authenticated user
    const department = req.user.department;    console.log('🏫 Looking for faculty in department:', department);
    
    // Debug: Check if any teachers exist in the database
    const allTeachers = await User.find({ role: 'teacher' }).select('name email department');
    console.log(`📝 DEBUG: Found ${allTeachers.length} total teachers in the database:`);
    console.log(JSON.stringify(allTeachers));
    
    // Build query - more flexible for development
    // In development mode, we'll get all teachers regardless of department
    const query = { role: 'teacher' };
    
    // In production, add department filter
    if (process.env.NODE_ENV === 'production') {
      query.department = department;
    }
    
    if (req.query.specialization && req.query.specialization !== 'all') {
      query.specialization = req.query.specialization;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex }
      ];
    }
    
    console.log('🔍 Query for teachers:', query);
    
    const teachers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Query returned ${teachers.length} teachers`);
    
    // Enrich with additional data
    const enrichedFaculty = await Promise.all(teachers.map(async (teacher) => {
      let coursesCount = 0;
      let studentsCount = 0;
      
      try {
        // Count courses taught
        coursesCount = await Course.countDocuments({
          teacher: teacher._id
        });
        
        // Count students taught
        const courses = await Course.find({ teacher: teacher._id });
        courses.forEach(course => {
          studentsCount += course.students?.length || 0;
        });
      } catch (error) {
        console.error(`Error enriching teacher ${teacher._id}:`, error);
      }
      
      return {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        department: teacher.department,
        role: teacher.role,
        joinedOn: teacher.createdAt,
        phone: teacher.phone || '',
        specialization: teacher.specialization || ['General'],
        coursesCount,
        studentsCount,
        lastLogin: teacher.lastLogin,
        createdAt: teacher.createdAt
      };
    }));
      console.log(`✅ Returning ${enrichedFaculty.length} faculty members`);
    // Return an array directly to ensure frontend receives all items correctly
    res.json(enrichedFaculty);
  } catch (error) {
    console.error('❌ Error fetching faculty:', error);
    res.status(500).json({ error: 'Failed to fetch faculty', message: error.message });
  }
});

// POST /api/hod/faculty - Create a new faculty member
router.post('/faculty', authenticateJWT, async (req, res) => {
  try {
    console.log('👨‍🏫 HOD Faculty creation endpoint called');
    console.log('📝 Request body:', req.body);
    
    // Verify database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected! Connection state:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database Unavailable', message: 'MongoDB connection is not established' });
    }
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can create faculty members' });
    }
    
    const { name, email, password, specialization, phone, department } = req.body;
    console.log('👨‍🏫 Creating faculty with data:', { name, email, department, specialization });
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Bad Request', message: 'Name and email are required' });
    }
      // Generate a default password if not provided
    const teacherPassword = password || 'faculty123';
    console.log('🔑 Using password:', teacherPassword ? 'Provided password' : 'Default password');
    
    // Check if user with email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Bad Request', message: 'A user with this email already exists' });
    }
      // Create new faculty member (teacher)
    const newTeacher = new User({
      name,
      email,
      password: teacherPassword, // Will be hashed by the pre-save hook in the user model
      role: 'teacher',
      department: department || req.user.department, // Use HOD's department if not specified
      specialization: specialization || [],
      phone: phone || '',
      joinedOn: new Date()
    });
    
    console.log('🔄 Saving new teacher to database...');
    try {
      await newTeacher.save();
      console.log('✅ Teacher saved successfully with ID:', newTeacher._id);
    } catch (saveError) {
      console.error('❌ Error saving teacher:', saveError);
      return res.status(500).json({ 
        error: 'Database Error', 
        message: `Failed to save teacher: ${saveError.message}`,
        details: saveError 
      });
    }
    
    // Return the created faculty without password
    const faculty = await User.findById(newTeacher._id).select('-password');
    
    if (!faculty) {
      console.error('⚠️ Warning: Teacher was saved but could not be retrieved');
    }
    
    console.log('✅ Faculty created successfully:', faculty.name);
    res.status(201).json({ faculty });
  } catch (error) {
    console.error('❌ Error creating faculty:', error);
    res.status(500).json({ error: 'Failed to create faculty member', message: error.message });
  }
});

// PUT /api/hod/faculty/:id - Update an existing faculty member
router.put('/faculty/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('👨‍🏫 HOD Faculty update endpoint called for ID:', req.params.id);
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can update faculty members' });
    }
    
    const { name, email, specialization, phone, department } = req.body;
    
    // Validate required fields
    if (!name && !email && !specialization && !phone && !department) {
      return res.status(400).json({ error: 'Bad Request', message: 'No update fields provided' });
    }
    
    // Find faculty member by ID
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Not Found', message: 'Faculty member not found' });
    }
    
    // Check if faculty is in HOD's department
    if (faculty.department !== req.user.department && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You can only update faculty in your department' });
    }
    
    // Check if email already exists for another user
    if (email && email !== faculty.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({ error: 'Bad Request', message: 'A user with this email already exists' });
      }
    }
    
    // Update faculty fields
    if (name) faculty.name = name;
    if (email) faculty.email = email;
    if (specialization) faculty.specialization = specialization;
    if (phone) faculty.phone = phone;
    if (department) faculty.department = department;
    
    await faculty.save();
    
    // Return updated faculty without password
    const updatedFaculty = await User.findById(req.params.id).select('-password');
    
    console.log('✅ Faculty updated successfully:', updatedFaculty.name);
    res.json({ faculty: updatedFaculty });
  } catch (error) {
    console.error('❌ Error updating faculty:', error);
    res.status(500).json({ error: 'Failed to update faculty member', message: error.message });
  }
});

// DELETE /api/hod/faculty/:id - Delete a faculty member
router.delete('/faculty/:id', authenticateJWT, async (req, res) => {
  try {
    console.log('👨‍🏫 HOD Faculty delete endpoint called for ID:', req.params.id);
    console.log('👤 User from authentication:', req.user);
    console.log('🔑 User role:', req.user?.role);
    console.log('🏫 User department:', req.user?.department);
    
    // Check if user has permissions
    if (req.user.role !== 'hod' && req.user.role !== 'admin') {
      console.log('❌ Permission denied: User role is not hod or admin');
      return res.status(403).json({ error: 'Forbidden', message: 'Only HOD can delete faculty members' });
    }
    
    // Find faculty member by ID
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      console.log('❌ Faculty member not found');
      return res.status(404).json({ error: 'Not Found', message: 'Faculty member not found' });
    }
    
    console.log('👨‍🏫 Found faculty:', faculty.name, 'Department:', faculty.department);
      // Check if faculty is in HOD's department (relaxed in development)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const departmentMatch = faculty.department === req.user.department;
    const isAdmin = req.user.role === 'admin';
    
    if (!departmentMatch && !isAdmin && !isDevelopment) {
      console.log('❌ Department permission denied: Faculty department:', faculty.department, 'User department:', req.user.department);
      return res.status(403).json({ error: 'Forbidden', message: 'You can only delete faculty in your department' });
    }
    
    if (!departmentMatch && !isAdmin && isDevelopment) {
      console.log('⚠️ Development mode: Allowing cross-department delete. Faculty department:', faculty.department, 'User department:', req.user.department);
    }
    
    // Check for courses taught by this faculty
    if (mongoose.models.Course) {
      const coursesCount = await Course.countDocuments({ teacher: req.params.id });
      if (coursesCount > 0) {
        // Option 1: Prevent deletion if faculty teaches courses
        // return res.status(400).json({ error: 'Bad Request', message: `Cannot delete faculty who teaches ${coursesCount} course(s). Reassign courses first.` });
        
        // Option 2: Update courses to remove this teacher (setting to null or default)
        await Course.updateMany(
          { teacher: req.params.id },
          { $unset: { teacher: "" } }
        );
        console.log(`Updated ${coursesCount} courses that were taught by this faculty`);
      }
    }
    
    // Delete the faculty
    await User.findByIdAndDelete(req.params.id);
    
    console.log('✅ Faculty deleted successfully');
    res.json({ message: 'Faculty member deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting faculty:', error);
    res.status(500).json({ error: 'Failed to delete faculty member', message: error.message });
  }
});

// GET /api/hod/dashboard-summary - Get dashboard summary data
router.get('/dashboard-summary', authenticateJWT, async (req, res) => {
  try {
    console.log('📊 HOD Dashboard Summary endpoint called');
    console.log('👤 User from token:', req.user);
    
    // Check if models are initialized
    if (!Course || !FeedbackForm || !FeedbackResponse || !Attendance) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
      // For development, get all data
    const isDev = true; // Set to true for development mode
    
    // Extract department from authenticated user
    let department = req.user.department || 'Engineering';
    console.log('🏫 Department:', department);
    
    // In development mode, count ALL records for easier testing
    // In production, we'll filter by department
    const studentQuery = isDev ? { role: 'student' } : { role: 'student', department };
    const teacherQuery = isDev ? { role: 'teacher' } : { role: 'teacher', department };
    const courseQuery = isDev ? {} : { department };
    const feedbackFormQuery = isDev ? {} : { department };
    
    // Debug available data
    const dbSummary = {
      students: await User.countDocuments({ role: 'student' }),
      teachers: await User.countDocuments({ role: 'teacher' }),
      courses: await Course.countDocuments({}),
      feedbackForms: await FeedbackForm.countDocuments({}),
      feedbackResponses: await FeedbackResponse.countDocuments({})
    };
    console.log('📊 Total records in database:', dbSummary);
      // Get counts from database 
    const totalStudents = await User.countDocuments(studentQuery).catch(() => 0);
    const totalTeachers = await User.countDocuments(teacherQuery).catch(() => 0);
    const totalCourses = await Course.countDocuments(courseQuery).catch(() => 0);
    const totalFeedbackForms = await FeedbackForm.countDocuments(feedbackFormQuery).catch(() => 0);
    const totalFeedbacks = await FeedbackResponse.countDocuments({}).catch(() => 0);
    
    console.log(`📊 Found: ${totalStudents} students, ${totalTeachers} teachers, ${totalCourses} courses`);
    console.log(`📝 Found: ${totalFeedbackForms} feedback forms, ${totalFeedbacks} feedback responses`);
    console.log('🔍 Note: totalFeedbacks represents feedback responses/submissions, not forms');
    
    // Get all students 
    const recentStudents = await User.find(studentQuery)
      .sort({ createdAt: -1 })
      .limit(10)  // Increased limit to see more data
      .select('-password');
      
    // Get all faculty
    const recentFaculty = await User.find(teacherQuery)
      .sort({ createdAt: -1 })
      .limit(10)  // Increased limit to see more data
      .select('-password');
    
    // Get all courses  
    const recentCourses = await Course.find(courseQuery)
      .sort({ createdAt: -1 })
      .limit(10)  // Increased limit to see more data
      .populate('teacher', 'name email');
      
    console.log(`📝 Prepared data: ${recentStudents.length} students, ${recentFaculty.length} faculty, ${recentCourses.length} courses`);
      // Build and send response
    const dashboardData = {
      summary: {
        totalStudents,
        totalFaculty: totalTeachers,
        totalCourses,
        totalFeedbacks: totalFeedbackForms, // Changed to count feedback forms instead of responses
        totalFeedbackResponses: totalFeedbacks, // Add separate field for responses
        courseGrowth: 10, // Default value
        facultyGrowth: 5,  // Default value
        studentGrowth: 15, // Default value
        feedbackGrowth: 20, // Default value
        attendanceRate: 85, // Default value
        feedbackResponseRate: 75, // Default value
        activeUsers: totalStudents + totalTeachers
      },
      students: recentStudents || [],
      faculty: recentFaculty || [],
      courses: recentCourses || [],
      recentActivity: []
    };
    
    console.log('✅ Dashboard data ready');
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Error in dashboard summary endpoint:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// TEMPORARY - Debug route for dashboard data without authentication
router.get('/debug-dashboard', async (req, res) => {
  try {
    console.log('🐞 Debug dashboard route called');
    
    if (!Course || !FeedbackForm || !FeedbackResponse || !Attendance) {
      if (!initModels()) {
        return res.status(503).json({ error: 'Service Unavailable', message: 'Database models not yet initialized' });
      }
    }
    
    // Hardcoded department for testing
    const department = 'Engineering';
    console.log('🏫 Using hardcoded department:', department);    // Get counts from database for the specific department
    const totalStudents = await User.countDocuments({ role: 'student', department });
    const totalTeachers = await User.countDocuments({ role: 'teacher', department });
      // Debug: Check both with and without department filtering
    const totalFeedbackFormsAll = await FeedbackForm.countDocuments({}).catch(() => 0);
    const totalFeedbackFormsDept = await FeedbackForm.countDocuments({ department }).catch(() => 0);
    
    // In development, show all feedback forms if none found for specific department
    const isDev = process.env.NODE_ENV !== 'production';
    const totalFeedbackForms = (isDev && totalFeedbackFormsDept === 0) ? totalFeedbackFormsAll : totalFeedbackFormsDept;
    
    const totalFeedbacks = await FeedbackResponse.countDocuments().catch(() => 0);
    
    console.log(`🐞 DEBUG: Total feedback forms (all): ${totalFeedbackFormsAll}`);
    console.log(`🐞 DEBUG: Total feedback forms (${department}): ${totalFeedbackFormsDept}`);
    console.log(`🐞 DEBUG: Using count: ${totalFeedbackForms} (dev mode: ${isDev})`);
    console.log(`🐞 DEBUG: Total feedback responses: ${totalFeedbacks}`);
    
    // Debug: Check all feedback forms in database
    const allFeedbackForms = await FeedbackForm.find({}).catch(() => []);
    const allFeedbackResponses = await FeedbackResponse.find({}).catch(() => []);
    console.log(`🐞 DEBUG: Found ${allFeedbackForms.length} total feedback forms in database`);
    console.log(`🐞 DEBUG: Found ${allFeedbackResponses.length} total feedback responses in database`);
    if (allFeedbackForms.length > 0) {
      console.log('🐞 DEBUG: Feedback form departments:', allFeedbackForms.map(f => f.department));
    }
    
    // Get counts for courses
    const totalCourses = await Course.countDocuments({ department }).catch(() => 0);
      // Build response
    const responseData = {
      summary: {
        totalStudents,
        totalFaculty: totalTeachers,
        totalCourses,
        totalFeedbacks: totalFeedbackForms, // Changed to count feedback forms instead of responses
        totalFeedbackResponses: totalFeedbacks, // Add separate field for responses
        facultyGrowth: 0,
        studentGrowth: 0,
        courseGrowth: 0,
        feedbackGrowth: 0,
        attendanceRate: 85, // Default value for demo
        feedbackResponseRate: 75, // Default value for demo
        activeUsers: totalStudents + totalTeachers
      },
      faculty: [],
      students: [],
      courses: []
    };
    
    console.log('✅ Debug dashboard data:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error in debug dashboard route:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// TEMPORARY - Debug route for faculty data without authentication
router.get('/debug-faculty', async (req, res) => {
  try {
    console.log('🐞 Debug faculty route called');
    
    // Hardcoded department for testing
    const department = 'Engineering';
    console.log('🏫 Using hardcoded department:', department);
    
    // Basic query for teachers
    const query = { role: 'teacher', department };
    
    const teachers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${teachers.length} teachers in ${department}`);
    res.json({ faculty: teachers });
  } catch (error) {
    console.error('❌ Error in debug faculty route:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// DEBUG DELETE /api/hod/debug-delete-faculty/:id - Delete faculty without authentication (development only)
router.delete('/debug-delete-faculty/:id', async (req, res) => {
  try {
    console.log('🐞 DEBUG Faculty delete endpoint called for ID:', req.params.id);
    
    // Find faculty member by ID
    const faculty = await User.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: 'Not Found', message: 'Faculty member not found' });
    }
    
    console.log('👨‍🏫 Found faculty to delete:', faculty.name, faculty.email);
    
    // Check for courses taught by this faculty
    if (mongoose.models.Course) {
      const coursesCount = await Course.countDocuments({ teacher: req.params.id });
      if (coursesCount > 0) {
        // Update courses to remove this teacher
        await Course.updateMany(
          { teacher: req.params.id },
          { $unset: { teacher: "" } }
        );
        console.log(`🔄 Updated ${coursesCount} courses that were taught by this faculty`);
      }
    }
    
    // Delete the faculty
    await User.findByIdAndDelete(req.params.id);
    
    console.log('✅ DEBUG: Faculty deleted successfully');
    res.json({ 
      message: 'Faculty member deleted successfully (debug mode)',
      deletedFaculty: {
        name: faculty.name,
        email: faculty.email,
        department: faculty.department
      }
    });
  } catch (error) {
    console.error('❌ Error in debug delete faculty:', error);
    res.status(500).json({ error: 'Failed to delete faculty member', message: error.message });
  }
});

export default router;
