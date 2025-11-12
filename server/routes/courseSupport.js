import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { tenantContext } from '../middleware/tenant.middleware.js';
import { query } from '../lib/db.js';
import {
  createQuestion,
  getQuestionById,
  listQuestions,
  createReply,
  getQuestionReplies,
  markReplyAsAnswer,
  updateQuestionStatus,
  updateQuestion,
  deleteQuestion,
  updateReply,
  deleteReply,
} from '../services/courseSupport.service.js';

const router = express.Router();

router.use(requireAuth);
router.use(tenantContext);

// List questions
router.get(
  '/questions',
  asyncHandler(async (req, res) => {
    const {
      course_id,
      student_id,
      category,
      status,
      search,
      limit = 25,
      offset = 0,
    } = req.query;

    const questions = await listQuestions({
      courseId: course_id,
      studentId: student_id,
      category,
      status,
      search,
      limit: parseInt(String(limit), 10),
      offset: parseInt(String(offset), 10),
    });

    res.json({
      success: true,
      data: questions,
    });
  })
);

// Get question by ID
router.get(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    const question = await getQuestionById(req.params.id, req.user.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    // Verify user has access (enrolled in course or is instructor)
    const { role, id: userId } = req.user;
    const isInstructor = ['super_admin', 'school_admin', 'instructor'].includes(role);

    if (!isInstructor && question.studentId !== userId) {
      // Check enrollment
      const enrollmentCheck = await query(
        'SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [userId, question.courseId]
      );

      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: question,
    });
  })
);

// Create question
router.post(
  '/questions',
  asyncHandler(async (req, res) => {
    const { course_id, category, title, body, lesson_id, metadata, attachments } = req.body;

    if (!course_id) {
      return res.status(400).json({
        success: false,
        error: 'Course ID is required',
      });
    }

    // Verify enrollment for students
    const { role, id: userId } = req.user;
    if (role === 'student') {
      const enrollmentCheck = await query(
        'SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [userId, course_id]
      );

      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You must be enrolled in this course to ask questions',
        });
      }
    }

    const question = await createQuestion(
      { category, title, body, lesson_id, metadata, attachments },
      { studentId: userId, courseId: course_id }
    );

    res.status(201).json({
      success: true,
      data: question,
    });
  })
);

// Get replies for a question
router.get(
  '/questions/:id/replies',
  asyncHandler(async (req, res) => {
    const replies = await getQuestionReplies(req.params.id);

    res.json({
      success: true,
      data: replies,
    });
  })
);

// Create reply
router.post(
  '/questions/:id/replies',
  asyncHandler(async (req, res) => {
    const { body, metadata, attachments } = req.body;
    const { role, id: userId } = req.user;

    // Check if user has access to the question
    const question = await getQuestionById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
      });
    }

    const isInstructor = ['super_admin', 'school_admin', 'instructor'].includes(role);

    if (!isInstructor && question.studentId !== userId) {
      // Check enrollment
      const enrollmentCheck = await query(
        'SELECT 1 FROM enrollments WHERE student_id = $1 AND course_id = $2',
        [userId, question.courseId]
      );

      if (enrollmentCheck.rows.length === 0) {
        return res.status(403).json({
          success: false,
          error: 'You must be enrolled in this course to reply',
        });
      }
    }

    const reply = await createReply(
      { body, metadata, attachments },
      {
        userId,
        questionId: req.params.id,
        isInstructor,
      }
    );

    res.status(201).json({
      success: true,
      data: reply,
    });
  })
);

// Mark reply as answer
router.put(
  '/replies/:id/answer',
  asyncHandler(async (req, res) => {
    const { question_id } = req.body;

    if (!question_id) {
      return res.status(400).json({
        success: false,
        error: 'Question ID is required',
      });
    }

    const reply = await markReplyAsAnswer(req.params.id, question_id, req.user.id);

    res.json({
      success: true,
      data: reply,
    });
  })
);

// Update question status
router.put(
  '/questions/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const question = await updateQuestionStatus(req.params.id, status, req.user.id);

    res.json({
      success: true,
      data: question,
    });
  })
);

// Update question (only by author)
router.put(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    const { title, body, category, lesson_id, metadata, attachments } = req.body;

    const question = await updateQuestion(
      req.params.id,
      { title, body, category, lesson_id, metadata, attachments },
      req.user.id
    );

    res.json({
      success: true,
      data: question,
    });
  })
);

// Delete question (only by author)
router.delete(
  '/questions/:id',
  asyncHandler(async (req, res) => {
    await deleteQuestion(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  })
);

// Update reply (only by author)
router.put(
  '/replies/:id',
  asyncHandler(async (req, res) => {
    const { body, metadata, attachments } = req.body;

    const reply = await updateReply(
      req.params.id,
      { body, metadata, attachments },
      req.user.id
    );

    res.json({
      success: true,
      data: reply,
    });
  })
);

// Delete reply (only by author)
router.delete(
  '/replies/:id',
  asyncHandler(async (req, res) => {
    await deleteReply(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Reply deleted successfully',
    });
  })
);

export default router;

