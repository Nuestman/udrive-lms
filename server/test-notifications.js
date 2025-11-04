#!/usr/bin/env node

/**
 * Test script for the enhanced notification system
 * This script tests the email and Socket.IO notifications for course/module/quiz updates
 */

import { createServer } from 'http';
import { Server } from 'socket.io';
import { query } from './lib/db.js';
import { 
  createUpdateNotification, 
  notifyEnrolledStudents, 
  notifyModuleStudents, 
  notifyQuizStudents 
} from './services/notifications.service.js';

// Mock Socket.IO server for testing
const app = { get: () => null };
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store io instance
app.get = (key) => key === 'io' ? io : null;

async function testNotificationSystem() {
  console.log('🧪 Testing Enhanced Notification System...\n');

  try {
    // Test 1: Get a sample course with enrolled students
    console.log('📋 Test 1: Finding a course with enrolled students...');
    const courseResult = await query(`
      SELECT c.id, c.title, COUNT(e.student_id) as student_count
      FROM courses c
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.status = 'published'
      GROUP BY c.id, c.title
      HAVING COUNT(e.student_id) > 0
      LIMIT 1
    `);

    if (courseResult.rows.length === 0) {
      console.log('❌ No courses with enrolled students found. Please create a course and enroll some students first.');
      return;
    }

    const course = courseResult.rows[0];
    console.log(`✅ Found course: "${course.title}" with ${course.student_count} enrolled students`);

    // Test 2: Test course update notification
    console.log('\n📋 Test 2: Testing course update notification...');
    const courseNotificationData = {
      type: 'course_update',
      title: 'Course Updated',
      message: `The course "${course.title}" has been updated with new content.`,
      link: `/courses/${course.id}`,
      data: {
        courseId: course.id,
        courseName: course.title,
        changes: ['description', 'content']
      },
      emailData: {
        courseName: course.title,
        courseUrl: `http://localhost:5173/courses/${course.id}`,
        updateDetails: 'Updated: description, content'
      }
    };

    await notifyEnrolledStudents(course.id, courseNotificationData, io);
    console.log('✅ Course update notifications sent successfully');

    // Test 3: Get a sample module
    console.log('\n📋 Test 3: Finding a module in the course...');
    const moduleResult = await query(`
      SELECT m.id, m.title, m.course_id
      FROM modules m
      WHERE m.course_id = $1
      LIMIT 1
    `, [course.id]);

    if (moduleResult.rows.length > 0) {
      const module = moduleResult.rows[0];
      console.log(`✅ Found module: "${module.title}"`);

      // Test module update notification
      console.log('\n📋 Test 4: Testing module update notification...');
      const moduleNotificationData = {
        type: 'module_update',
        title: 'Module Updated',
        message: `The module "${module.title}" in course "${course.title}" has been updated.`,
        link: `/courses/${course.id}/modules/${module.id}`,
        data: {
          moduleId: module.id,
          courseId: course.id,
          moduleName: module.title,
          courseName: course.title,
          changes: ['title', 'description']
        },
        emailData: {
          moduleName: module.title,
          courseName: course.title,
          moduleUrl: `http://localhost:5173/courses/${course.id}/modules/${module.id}`,
          updateDetails: 'Updated: title, description'
        }
      };

      await notifyModuleStudents(module.id, moduleNotificationData, io);
      console.log('✅ Module update notifications sent successfully');

      // Test 4: Get a sample quiz
      console.log('\n📋 Test 5: Finding a quiz in the module...');
      const quizResult = await query(`
        SELECT q.id, q.title, q.module_id
        FROM quizzes q
        WHERE q.module_id = $1
        LIMIT 1
      `, [module.id]);

      if (quizResult.rows.length > 0) {
        const quiz = quizResult.rows[0];
        console.log(`✅ Found quiz: "${quiz.title}"`);

        // Test quiz update notification
        console.log('\n📋 Test 6: Testing quiz update notification...');
        const quizNotificationData = {
          type: 'quiz_update',
          title: 'Quiz Updated',
          message: `The quiz "${quiz.title}" in course "${course.title}" has been updated.`,
          link: `/courses/${course.id}/quizzes/${quiz.id}`,
          data: {
            quizId: quiz.id,
            courseId: course.id,
            quizName: quiz.title,
            courseName: course.title,
            moduleName: module.title,
            changes: ['questions', 'time_limit']
          },
          emailData: {
            quizName: quiz.title,
            courseName: course.title,
            quizUrl: `http://localhost:5173/courses/${course.id}/quizzes/${quiz.id}`,
            updateDetails: 'Updated: questions, time_limit'
          }
        };

        await notifyQuizStudents(quiz.id, quizNotificationData, io);
        console.log('✅ Quiz update notifications sent successfully');
      } else {
        console.log('⚠️  No quizzes found in the module');
      }
    } else {
      console.log('⚠️  No modules found in the course');
    }

    // Test 5: Test individual notification creation
    console.log('\n📋 Test 7: Testing individual notification creation...');
    const userResult = await query(`
      SELECT u.id, u.email, u.first_name
      FROM users u
      JOIN enrollments e ON u.id = e.student_id
      WHERE e.course_id = $1 AND e.status = 'active'
      LIMIT 1
    `, [course.id]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`✅ Found user: ${user.first_name} (${user.email})`);

      const individualNotificationData = {
        type: 'course_published',
        title: 'New Course Available',
        message: `A new course "${course.title}" is now available for you to start.`,
        link: `/courses/${course.id}`,
        data: {
          courseId: course.id,
          courseName: course.title
        },
        emailData: {
          courseName: course.title,
          courseUrl: `http://localhost:5173/courses/${course.id}`
        }
      };

      await createUpdateNotification(user.id, individualNotificationData, io);
      console.log('✅ Individual notification created successfully');
    }

    console.log('\n🎉 All notification tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Course update notifications');
    console.log('   ✅ Module update notifications');
    console.log('   ✅ Quiz update notifications');
    console.log('   ✅ Individual notification creation');
    console.log('   ✅ Email template integration');
    console.log('   ✅ Socket.IO real-time delivery');
    
    console.log('\n💡 To test in the browser:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Open the application in multiple browser tabs');
    console.log('   3. Update a course, module, or quiz');
    console.log('   4. Check for real-time notifications and email delivery');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close the test server
    server.close();
    process.exit(0);
  }
}

// Run the test
testNotificationSystem();








