# System Architecture

## Overview

SunLMS is a modern, full-stack learning management system and content management system built with React, Node.js, and PostgreSQL. The system is designed as a generic LMS/CMS-as-a-Service platform with multi-tenancy in mind, supporting multiple organizations across various industries with complete data isolation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
├─────────────────────────────────────────────────────────────┤
│  • Student Dashboard    • Quiz Engine    • Lesson Viewer   │
│  • Admin Panel         • Progress UI    • Auth Components  │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/API Calls
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Backend (Node.js/Express)                   │
├─────────────────────────────────────────────────────────────┤
│  • Authentication     • Progress Service  • Quiz Service   │
│  • Tenant Middleware  • File Storage      • API Routes     │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ Database Queries
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Database (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────┤
│  • Users & Profiles  • Courses & Modules  • Progress Data  │
│  • Quizzes & Lessons • File References    • Tenant Data    │
└─────────────────────────────────────────────────────────────┘
                                │
                                │ File Storage
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                              │
├─────────────────────────────────────────────────────────────┤
│  • Vercel Blob (File Storage)  • Email Service (Future)    │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer
- **Framework**: React 18 with TypeScript
- **State Management**: React Hooks (useState, useEffect, useContext)
- **UI Components**: Custom component library with Tailwind CSS
- **Routing**: React Router for navigation
- **HTTP Client**: Custom API client with error handling

### 2. Backend Layer
- **Runtime**: Node.js with Express.js
- **Authentication**: JWT-based with secure cookies
- **Middleware**: Tenant isolation, authentication, error handling
- **Services**: Modular service architecture for business logic
- **File Handling**: Vercel Blob integration for media storage

### 3. Database Layer
- **Primary Database**: PostgreSQL (Supabase)
- **Schema**: Normalized relational design with tenant isolation
- **Migrations**: Version-controlled database schema changes
- **Indexing**: Optimized for performance with proper indexes

## Key Architectural Patterns

### 1. Multi-Tenancy
- **Tenant Isolation**: Complete data separation between organizations
- **Middleware**: Automatic tenant context injection
- **Security**: Row-level security with tenant_id filtering

### 2. Unified Content Model
- **Lessons and Quizzes**: Treated as unified content types
- **Progress Tracking**: Single system for all content completion
- **Navigation**: Consistent user experience across content types

### 3. Service-Oriented Architecture
- **Modular Services**: Separate services for different domains
- **Dependency Injection**: Services injected into routes
- **Error Handling**: Centralized error management

### 4. Progressive Enhancement
- **Mobile-First**: Responsive design for all devices
- **Offline Capability**: Future enhancement for offline learning
- **Performance**: Optimized loading and caching strategies

## Security Architecture

### 1. Authentication Flow
```
User Login → JWT Generation → Secure Cookie Storage → Request Validation
```

### 2. Authorization Levels
- **Super Admin**: Full system access across all tenants
- **Tenant Admin**: Full access within their organization
- **Instructor**: Course and content management
- **Student**: Learning content access only

### 3. Data Protection
- **Tenant Isolation**: Automatic data filtering by tenant_id
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Content sanitization and CSP headers

## Performance Considerations

### 1. Database Optimization
- **Indexing Strategy**: Optimized indexes for common queries
- **Query Optimization**: Efficient joins and subqueries
- **Connection Pooling**: Managed database connections

### 2. Frontend Performance
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Responsive images with proper sizing
- **Caching Strategy**: Browser caching for static assets

### 3. API Performance
- **Response Caching**: Strategic caching of API responses
- **Pagination**: Efficient data loading for large datasets
- **Compression**: Gzip compression for API responses

## Scalability Design

### 1. Horizontal Scaling
- **Stateless Backend**: No server-side session storage
- **Database Scaling**: Read replicas for query distribution
- **CDN Integration**: Global content delivery

### 2. Vertical Scaling
- **Resource Optimization**: Efficient memory and CPU usage
- **Database Tuning**: Optimized PostgreSQL configuration
- **Monitoring**: Performance metrics and alerting

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **React Router**: Client-side routing

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **JWT**: JSON Web Tokens for authentication
- **Multer**: File upload handling

### Infrastructure
- **Vercel**: Frontend hosting and deployment
- **Supabase**: Database hosting and management
- **Vercel Blob**: File storage service
- **Git**: Version control

## Development Workflow

### 1. Code Organization
```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── utils/              # Utility functions
└── types/              # TypeScript type definitions

server/
├── routes/             # API route handlers
├── services/           # Business logic services
├── middleware/         # Express middleware
├── models/             # Database models
└── utils/              # Server utilities
```

### 2. Database Management
```
database/
├── schema.sql          # Complete database schema
├── migrations/         # Version-controlled migrations
├── seeds/              # Sample data
└── backups/            # Database backups
```

### 3. Documentation
```
docs/
├── README.md           # Main documentation index
├── system-architecture.md
├── api-reference.md
├── user-guides/
└── development/
```

## Future Enhancements

### 1. Advanced Features
- **Real-time Collaboration**: WebSocket integration
- **Advanced Analytics**: Learning analytics and reporting
- **Mobile App**: React Native mobile application
- **AI Integration**: Intelligent content recommendations

### 2. Performance Improvements
- **Caching Layer**: Redis for session and data caching
- **CDN Integration**: Global content delivery network
- **Database Optimization**: Advanced indexing and partitioning

### 3. Security Enhancements
- **Two-Factor Authentication**: Enhanced security
- **Audit Logging**: Comprehensive activity tracking
- **Advanced Permissions**: Granular access control

---

*This architecture document is maintained alongside the codebase and reflects the current system design as of December 2024.*
