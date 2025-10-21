# UDrive Technical Stack

## Overview

UDrive employs a modern, scalable technical stack designed for reliability, performance, and developer productivity. The architecture follows a microservices approach with a clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │              │  │              │  │                      │   │
│  │  Web Client  │  │ Mobile Apps  │  │ Admin Dashboard      │   │
│  │  (React)     │  │ (React       │  │ (React)              │   │
│  │              │  │  Native)     │  │                      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                  │                     │               │
└─────────┼──────────────────┼─────────────────────┼───────────────┘
          │                  │                     │
          │                  │                     │
┌─────────▼──────────────────▼─────────────────────▼───────────────┐
│                                                                   │
│                            API Gateway                            │
│                                                                   │
└─────────┬──────────────────┬─────────────────────┬───────────────┘
          │                  │                     │
          │                  │                     │
┌─────────▼──────┐ ┌─────────▼──────┐ ┌───────────▼─────────┐
│                │ │                │ │                     │
│  Auth Service  │ │  User Service  │ │  Content Service    │
│                │ │                │ │                     │
└────────────────┘ └────────────────┘ └─────────────────────┘
          │                  │                     │
          │                  │                     │
┌─────────▼──────┐ ┌─────────▼──────┐ ┌───────────▼─────────┐
│                │ │                │ │                     │
│ LMS Service    │ │ Analytics      │ │ Notification        │
│                │ │ Service        │ │ Service             │
│                │ │                │ │                     │
└────────────────┘ └────────────────┘ └─────────────────────┘
          │                  │                     │
          │                  │                     │
┌─────────▼──────────────────▼─────────────────────▼───────────────┐
│                                                                   │
│                        Database Layer                             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Frontend

### Web Application

- **Framework**: React with TypeScript
- **State Management**: Redux Toolkit for global state, React Query for server state
- **Styling**: Tailwind CSS with custom theme
- **Component Library**: Custom component library built on top of Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Build Tools**: Vite for fast development and optimized production builds
- **Testing**: Jest and React Testing Library for unit/integration tests, Cypress for E2E tests

### Block Editor

- Custom-built block editor using slate.js
- Drag-and-drop functionality with react-dnd
- Real-time collaboration using Operational Transforms
- Custom plugins for specialized driving education content

### Admin Dashboard

- Responsive layout with dashboard-specific components
- Data visualization with recharts
- Advanced filtering and search capabilities
- Bulk operations interface
- Role-based UI rendering

### Mobile Applications

- React Native for cross-platform mobile apps
- Offline content access
- Push notifications
- Native device integrations (camera, location, etc.)
- Biometric authentication

## Backend

### API Layer

- **Framework**: Node.js with Express
- **API Style**: RESTful with consistent resource-oriented endpoints
- **Authentication**: JWT-based authentication with refresh tokens
- **Documentation**: OpenAPI/Swagger specification
- **Validation**: JSON Schema validation for request/response
- **Middleware**: Custom middleware for logging, error handling, and tenant isolation

### Services

1. **Auth Service**
   - User authentication and authorization
   - OAuth provider integration
   - 2FA implementation
   - Password management
   - Session handling

2. **User Service**
   - User CRUD operations
   - Profile management
   - Role and permission management
   - Tenant user management

3. **Content Service**
   - Course and lesson management
   - Media processing and storage
   - Content versioning
   - Search indexing
   - Block editor data processing

4. **LMS Service**
   - Progress tracking
   - Quiz engine
   - Certification generation
   - Enrollment management
   - Student assessment

5. **Analytics Service**
   - Data collection and processing
   - Report generation
   - Dashboard metrics calculation
   - Data export capabilities
   - Machine learning insights

6. **Notification Service**
   - Email notifications
   - In-app notifications
   - Push notifications
   - Scheduled reminders
   - Bulk messaging

### Service Communication

- REST APIs for synchronous communication
- Message queues (RabbitMQ) for asynchronous communication
- Event-driven architecture for decoupled services
- Circuit breakers for fault tolerance

## Database Layer

### Primary Database

- **Database**: PostgreSQL
- **Schema Design**: Multi-tenant schema with tenant discriminator
- **Migrations**: Managed through TypeORM migrations
- **Performance**: Optimized indexing and query patterns
- **Security**: Row-level security policies

### Search Functionality

- **Search Engine**: Elasticsearch
- **Indexing**: Automated indexing of content, courses, and users
- **Features**: Full-text search, faceted search, typo tolerance
- **Integration**: Synced with primary database via change data capture

### Caching

- **Cache System**: Redis
- **Use Cases**: Session storage, API response caching, frequent query results
- **Strategies**: Time-based expiration, cache invalidation on writes
- **Distribution**: Clustered for high availability

## Storage

### File Storage

- **Primary Storage**: Amazon S3 or compatible object storage
- **Organization**: Tenant-specific buckets with logical folder structure
- **Security**: Signed URLs for temporary access
- **Performance**: CDN integration for fast delivery

### Media Processing

- **Image Processing**: Server-side resizing, optimization, and format conversion
- **Video Processing**: Transcoding to multiple formats and resolutions
- **Video Streaming**: HLS/DASH streaming for video content
- **Thumbnails**: Automated thumbnail generation

## Infrastructure

### Deployment

- **Containerization**: Docker containers for all services
- **Orchestration**: Kubernetes for container management
- **CI/CD**: Automated pipelines for testing and deployment
- **Environments**: Development, Staging, and Production environments

### Monitoring & Logging

- **Application Monitoring**: New Relic or Datadog for performance monitoring
- **Log Management**: ELK stack (Elasticsearch, Logstash, Kibana)
- **Error Tracking**: Sentry for real-time error tracking
- **Alerting**: PagerDuty integration for critical issues

### Security

- **HTTPS**: TLS for all communications
- **Authentication**: OAuth 2.0 and OpenID Connect
- **Authorization**: Role-based access control
- **Data Protection**: Encryption at rest and in transit
- **Compliance**: GDPR, CCPA, and education-specific regulations

## Code Example: Frontend Component

```tsx
// components/LessonEditor/BlockEditor.tsx
import React, { useState, useCallback } from 'react';
import { createEditor, Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { BlockToolbar } from './BlockToolbar';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { QuizBlock } from './blocks/QuizBlock';
import { useBlockEditorContext } from '../../contexts/BlockEditorContext';

interface BlockEditorProps {
  initialValue: Descendant[];
  onChange: (value: Descendant[]) => void;
  readOnly?: boolean;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialValue,
  onChange,
  readOnly = false
}) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const { selectedBlock, setSelectedBlock } = useBlockEditorContext();
  
  const renderElement = useCallback((props) => {
    switch (props.element.type) {
      case 'text':
        return <TextBlock {...props} />;
      case 'image':
        return <ImageBlock {...props} />;
      case 'video':
        return <VideoBlock {...props} />;
      case 'quiz':
        return <QuizBlock {...props} />;
      default:
        return <TextBlock {...props} />;
    }
  }, []);
  
  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <Slate editor={editor} value={initialValue} onChange={onChange}>
        {!readOnly && <BlockToolbar />}
        <div className="p-4">
          <Editable
            renderElement={renderElement}
            placeholder="Begin typing..."
            spellCheck
            readOnly={readOnly}
            className="min-h-[200px] focus:outline-none"
            onFocus={() => console.log('Editor focused')}
          />
        </div>
      </Slate>
    </div>
  );
};
```

## Code Example: Backend API Endpoint

```typescript
// controllers/lessonController.ts
import { Request, Response } from 'express';
import { LessonService } from '../services/lessonService';
import { validateLessonData } from '../validators/lessonValidator';
import { NotFoundError, ValidationError } from '../errors';
import { logger } from '../utils/logger';

export class LessonController {
  private lessonService: LessonService;
  
  constructor() {
    this.lessonService = new LessonService();
  }
  
  public getLesson = async (req: Request, res: Response) => {
    try {
      const lessonId = req.params.id;
      const tenantId = req.tenantId; // From tenantContext middleware
      
      const lesson = await this.lessonService.getLessonById(lessonId, tenantId);
      
      if (!lesson) {
        throw new NotFoundError('Lesson not found');
      }
      
      return res.status(200).json({
        success: true,
        data: lesson
      });
    } catch (error) {
      logger.error('Error fetching lesson', { error, lessonId: req.params.id });
      
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred'
      });
    }
  };
  
  public createLesson = async (req: Request, res: Response) => {
    try {
      const { moduleId, title, description, content } = req.body;
      const tenantId = req.tenantId;
      const userId = req.user.id;
      
      const validationResult = validateLessonData(req.body);
      
      if (!validationResult.success) {
        throw new ValidationError(validationResult.errors.join(', '));
      }
      
      const lesson = await this.lessonService.createLesson({
        moduleId,
        title,
        description,
        content,
        tenantId,
        createdBy: userId
      });
      
      return res.status(201).json({
        success: true,
        data: lesson
      });
    } catch (error) {
      logger.error('Error creating lesson', { error, payload: req.body });
      
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred'
      });
    }
  };
  
  // More controller methods...
}
```

## Code Example: Database Model

```typescript
// models/Lesson.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { Module } from './Module';
import { User } from './User';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column()
  @Index()
  title: string;
  
  @Column({ type: 'text', nullable: true })
  description: string;
  
  @Column({ type: 'jsonb' })
  content: Record<string, any>;
  
  @Column()
  @Index()
  moduleId: string;
  
  @ManyToOne(() => Module, module => module.lessons)
  @JoinColumn({ name: 'moduleId' })
  module: Module;
  
  @Column()
  @Index()
  tenantId: string;
  
  @Column()
  createdBy: string;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
  
  @Column({ type: 'int', default: 0 })
  orderIndex: number;
  
  @Column({ type: 'int', nullable: true })
  durationMinutes: number;
  
  @Column({
    type: 'enum',
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  })
  status: 'draft' | 'published' | 'archived';
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

## Third-Party Integrations

### Payment Processing

- Stripe for subscription and payment processing
- PayPal as an alternative payment option
- Invoice generation and management

### Email Services

- SendGrid or Mailgun for transactional emails
- Email template system
- Delivery tracking and analytics

### Video Conferencing

- Zoom API integration for virtual classroom sessions
- Recording and playback capabilities
- Calendar integration for scheduling

### Analytics

- Google Analytics for web analytics
- Mixpanel for user behavior tracking
- Hotjar for heatmaps and session recording

## Scalability Considerations

- Horizontal scaling of services based on load
- Database read replicas for query-heavy operations
- Caching strategies for frequently accessed data
- Asynchronous processing for non-critical operations
- Content delivery optimization through CDN

## DevOps Practices

- Infrastructure as Code using Terraform
- Blue-green deployments for zero-downtime updates
- Automated testing in CI/CD pipeline
- Canary releases for new features
- Disaster recovery planning and testing