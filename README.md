# ☀️ SunLMS - LMS/CMS-as-a-Service Platform

A modern, feature-rich Learning Management System and Content Management System built with React, Node.js, and PostgreSQL. Designed as a generic LMS/CMS-as-a-Service platform that powers specialized solutions for hospitals (CPD), corporate training, driving schools, and educational institutions with complete multi-tenancy support.

![System Status](https://img.shields.io/badge/Status-100%25%20Complete-success)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-blue)
![Node](https://img.shields.io/badge/Node-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [User Roles](#-user-roles)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### Core Features
- ✅ **Multi-Tenant Architecture** - Complete tenant isolation with shared database
- ✅ **Role-Based Access Control** - 4 user roles with granular permissions
- ✅ **Course Management** - Rich course creation with TinyMCE editor
- ✅ **Progress Tracking** - Real-time student progress with analytics
- ✅ **Celebration System** - Confetti animations for completions
- ✅ **Enrollment Management** - Easy student enrollment and tracking
- ✅ **Analytics Dashboard** - Comprehensive reporting for all roles

### Authentication & Security
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Secure password reset flow
- ✅ Protected API endpoints
- ✅ Tenant isolation middleware

### Content Management
- ✅ **Rich Text Editor** - TinyMCE integration for lesson content
- ✅ **Module Organization** - Hierarchical course structure
- ✅ **Lesson Types** - Text, video, and document lessons
- ✅ **Drag & Drop Ordering** - Easy content reorganization
- ✅ **Course Publishing** - Draft and published states

### Student Experience
- ✅ **Student Dashboard** - Overview of enrolled courses
- ✅ **Lesson Viewer** - Clean, distraction-free learning interface
- ✅ **Progress Indicators** - Visual progress bars and checkmarks
- ✅ **Module Celebrations** - Confetti when completing modules
- ✅ **Course Celebrations** - Grand celebration on course completion
- ✅ **Seamless Navigation** - Auto-transition to next module
- ✅ **Certificate Access** - View certificates for completed courses

### Admin Features
- ✅ **School Management** - Multi-school support
- ✅ **User Management** - Add/edit students and instructors
- ✅ **Course Analytics** - Enrollment and completion metrics
- ✅ **System Overview** - Super admin dashboard
- ✅ **Bulk Operations** - Efficient data management

## 🛠 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide Icons** - Beautiful icon set
- **Canvas Confetti** - Celebration animations
- **TinyMCE** - Rich text editor

### Backend
- **Node.js 18+** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL 14+** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment configuration

### Development Tools
- **ESLint** - Code linting
- **Nodemon** - Auto-restart server
- **Git** - Version control

## 🏗 Architecture

### Multi-Tenant Design
```
┌─────────────────────────────────────────────┐
│           Super Admin (System)              │
│  - Manages all schools                      │
│  - System-wide analytics                    │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐        ┌───────▼──────┐
│  School A    │        │  School B    │
│  (Tenant 1)  │        │  (Tenant 2)  │
├──────────────┤        ├──────────────┤
│ - Admins     │        │ - Admins     │
│ - Instructors│        │ - Instructors│
│ - Students   │        │ - Students   │
│ - Courses    │        │ - Courses    │
└──────────────┘        └──────────────┘
```

### System Flow
```
Student Journey:
Enroll → View Courses → Start Lesson → Complete Lesson 
  → Progress Updates → Module Complete (🎉 Celebration!)
  → Next Module → Course Complete (🏆 Grand Celebration!)
  → Certificate Access
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nuestman/udrive-lms.git
   cd udrive-lms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=udrive_lms

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Secret (use a strong random string)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173
   ```

## 🗄 Database Setup

### 1. Create Database
```sql
CREATE DATABASE udrive_lms;
```

### 2. Run Schema
```bash
# Using Node.js script
node database/run-schema.js

# Or manually in PostgreSQL
psql -U postgres -d udrive_lms -f database/schema.sql
```

### 3. Seed Initial Data (Optional)
```bash
# Using Node.js script
node database/run-seed.js

# Or manually
psql -U postgres -d udrive_lms -f database/seed.sql
```

### Default Users (After Seeding)
```
Super Admin:
  Email: superadmin@udrive.com
  Password: Admin123!

School Admin:
  Email: admin@school1.com
  Password: Admin123!

Instructor:
  Email: instructor1@school1.com
  Password: Instructor123!

Student:
  Email: student1@school1.com
  Password: Student123!
```

## ▶️ Running the Application

### Development Mode

**Option 1: Run both servers separately**

Terminal 1 - Backend:
```bash
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev:client
```

**Option 2: Run with concurrently (recommended)**
```bash
npm run dev:all
```

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 👥 User Roles

### 🔴 Super Admin
- System-wide access
- Manage all schools
- View all analytics
- Create school admins
- System configuration

### 🟠 School Admin
- Manage their school
- Create/manage courses
- Manage instructors and students
- View school analytics
- Enrollment management

### 🟡 Instructor
- Create and manage courses
- Create lessons and modules
- View student progress
- Grade assignments (future)
- Course analytics

### 🟢 Student
- View enrolled courses
- Access lessons and content
- Track personal progress
- Complete courses
- Earn certificates

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints
```
POST   /auth/register          - Register new user
POST   /auth/login             - User login
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset password with token
GET    /auth/profile           - Get user profile
```

### Course Endpoints
```
GET    /courses                - List all courses
POST   /courses                - Create new course
GET    /courses/:id            - Get course details
PUT    /courses/:id            - Update course
DELETE /courses/:id            - Delete course
POST   /courses/:id/publish    - Publish course
GET    /courses/:id/stats      - Get course statistics
```

### Module Endpoints
```
GET    /modules/course/:courseId  - Get modules for course
POST   /modules                   - Create module
PUT    /modules/:id               - Update module
DELETE /modules/:id               - Delete module
POST   /modules/:id/reorder       - Reorder modules
```

### Lesson Endpoints
```
GET    /lessons/module/:moduleId  - Get lessons for module
POST   /lessons                   - Create lesson
GET    /lessons/:id               - Get lesson details
PUT    /lessons/:id               - Update lesson
DELETE /lessons/:id               - Delete lesson
POST   /lessons/:id/reorder       - Reorder lessons
```

### Progress Endpoints
```
GET    /progress/student/:studentId                    - Get student progress
GET    /progress/course/:courseId/student/:studentId   - Get course progress
POST   /progress/lesson/:lessonId/complete             - Mark lesson complete
POST   /progress/lesson/:lessonId/incomplete           - Mark lesson incomplete
```

### Enrollment Endpoints
```
GET    /enrollments            - List enrollments
POST   /enrollments            - Enroll student
PUT    /enrollments/:id/status - Update enrollment status
DELETE /enrollments/:id        - Unenroll student
```

### Full API Count: **57 Endpoints** across 11 route files

## 📁 Project Structure

```
udrive-lms/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── admin/              # Admin dashboards
│   │   ├── courses/            # Course management
│   │   ├── lessons/            # Lesson components
│   │   ├── student/            # Student interfaces
│   │   ├── ui/                 # Reusable UI components
│   │   └── pages/              # Page components
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and API client
│   ├── services/               # Business logic
│   └── types/                  # TypeScript types
│
├── server/                      # Backend source
│   ├── routes/                 # API routes
│   ├── services/               # Business logic
│   ├── middleware/             # Express middleware
│   └── lib/                    # Utilities
│
├── database/                    # Database files
│   ├── schema.sql              # Database schema
│   ├── seed.sql                # Seed data
│   ├── run-schema.js           # Schema runner
│   └── run-seed.js             # Seed runner
│
├── docs/                        # Documentation
│   ├── system-architecture.md
│   ├── technical-stack.md
│   └── user-roles-permissions.md
│
└── [Documentation Files]        # Progress & test guides
```

## 🧪 Testing

### Manual Testing Guides
- `QUICK_START.md` - Quick setup guide
- `TEST_AUTHENTICATION.md` - Auth testing
- `TEST_COURSES_SYSTEM.md` - Course testing
- `TEST_LESSONS_SYSTEM_NOW.md` - Lesson testing
- `COURSE_PROGRESS_FIXED_AND_CELEBRATIONS.md` - Progress & celebrations
- `TEST_DASHBOARDS_NOW.md` - Dashboard testing

### Test a Complete Flow
1. Login as school admin
2. Create a course with 2-3 modules
3. Add 3-4 lessons per module
4. Enroll a student
5. Login as student
6. Complete all lessons
7. See celebrations! 🎉

## 📚 Documentation

Comprehensive documentation is available in the repository:

- **Setup Guides**
  - `DATABASE_SETUP_GUIDE.md` - Database configuration
  - `ENV_SETUP_INSTRUCTIONS.md` - Environment setup
  - `START_HERE.md` - Getting started guide

- **System Documentation**
  - `COMPREHENSIVE_IMPLEMENTATION_PLAN.md` - Full implementation details
  - `VISUAL_SYSTEM_MAP.md` - System architecture
  - `docs/system-architecture.md` - Technical architecture

- **Feature Documentation**
  - `PROGRESS_AND_FLOW_COMPLETE.md` - Progress tracking
  - `TENANT_ISOLATION_COMPLETE.md` - Multi-tenancy
  - `TINYMCE_LESSON_EDITOR_COMPLETE.md` - Content editor

- **Testing Guides**
  - `QUICK_TEST_GUIDE.md` - Quick testing
  - `COURSES_TESTING_GUIDE.md` - Course features
  - Multiple role-specific test guides

## 🎯 Current Status: 98% Complete

### ✅ Completed Features
- Authentication & Authorization
- Multi-tenant Architecture
- Course, Module, Lesson Management
- Student Enrollment System
- Progress Tracking with Real-time Updates
- Celebration System with Confetti
- Analytics & Reporting Dashboards
- Rich Text Content Editor (TinyMCE)
- Seamless Learning Flow
- 57 Working API Endpoints

### 🚧 In Development
- Quiz System (10%)
- Certificate Generation (20%)
- Email Notifications (0%)
- Media Library (0%)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards
- Use TypeScript for type safety
- Follow existing code structure
- Write clear commit messages
- Add comments for complex logic
- Update documentation as needed

## 🐛 Known Issues

No critical issues at this time. See GitHub Issues for feature requests and minor bugs.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Nuestman**
- GitHub: [@Nuestman](https://github.com/Nuestman)
- Repository: [udrive-lms](https://github.com/Nuestman/udrive-lms)

## 🙏 Acknowledgments

- TinyMCE for the rich text editor
- Lucide for beautiful icons
- Canvas Confetti for celebrations
- React and Node.js communities

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review test guides for examples

---

**Built with ❤️ for education and learning**

🎓 Start your learning journey with UDrive LMS today!
