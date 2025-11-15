import React from 'react';
import { FileText, Video, UploadCloud, Shield, Layers, Link as LinkIcon, Settings } from 'lucide-react';

const LessonMediaDocs: React.FC = () => {
  const featureHighlights = [
    {
      title: 'Inline Office Viewer',
      description:
        'PowerPoint and Word lessons open directly inside the student lesson viewer via Microsoft 365 embeds. Files remain private thanks to time-limited signed URLs from Vercel Blob.',
      icon: <FileText className="w-5 h-5 text-primary-600" />
    },
    {
      title: 'Dual Video Sources',
      description:
        'Video lessons accept either a streaming URL (YouTube, Vimeo, etc.) or a direct upload. Uploaded files stream via the native browser player with a fallback download link.',
      icon: <Video className="w-5 h-5 text-green-600" />
    },
    {
      title: 'Human-Readable Storage',
      description:
        'Lesson uploads are organized under `sunlms-blob/tenants/<tenant>/courses/<course>/lessons`, making blobs easy to audit and revoke without guessing IDs.',
      icon: <Layers className="w-5 h-5 text-amber-600" />
    },
    {
      title: 'Security & Access',
      description:
        'All file URLs are generated on demand with signed expiration. Viewers never expose tenant IDs, and the backend scopes uploads by tenant and course IDs.',
      icon: <Shield className="w-5 h-5 text-red-500" />
    }
  ];

  const uploadSteps = [
    {
      title: 'Pick the Lesson Type',
      details:
        'Select **Document** or **Video** in the lesson editor. Each type exposes the appropriate upload controls alongside any URL fields.'
    },
    {
      title: 'Upload or Link',
      details:
        'Click the dashed dropzone to upload a file, or paste a streaming URL. Uploads display progress, metadata, and allow replace/remove actions before saving.'
    },
    {
      title: 'Automatic File Naming',
      details:
        'Uploaded files are renamed using the lesson title slug (e.g., `safe-driving-101.mp4`). Metadata persists so students see meaningful filenames when downloading.'
    },
    {
      title: 'Save & Stream',
      details:
        'Once the upload completes, `Save Lesson` persists the blob URL. Students immediately see the inline viewer/player without leaving the lesson.'
    }
  ];

  const storageRules = [
    'Root path: `sunlms-blob/tenants/{tenant-slug}/courses/{course-slug}/lessons/`',
    'Each upload stores tenant/course/lesson IDs, slugs, and normalized titles in the metadata payload',
    'Document uploads use the `lesson-document` storage category; video uploads use `lesson-video`',
    'File names are sanitized, lowercased, and truncated to 80 characters to keep paths URL-safe',
    'Signed URLs expire automatically; administrators can revoke blobs at any time via Vercel Blob'
  ];

  const studentExperience = [
    'Document lessons render inside a responsive Microsoft Office iframe. A fallback download button is always available.',
    'Video lessons prefer the native player when a file is uploaded, and automatically fall back to YouTube embeds for streaming URLs.',
    'Download buttons appear for uploaded assets so learners can keep an offline copy.',
    'The lesson viewer detects MIME types to ensure the correct `<video>` or `<iframe>` attributes are applied across browsers.',
    'All viewers inherit the lesson completion logic—students can still mark lessons complete without leaving the page.'
  ];

  const bestPractices = [
    'Use descriptive lesson titles before uploading so generated filenames remain meaningful.',
    'Favor PPTX/PDF conversions for decks with heavy animations; Office embeds honour most transitions but not macros.',
    'Keep uploaded videos under 500 MB for quick uploads. For longer content, prefer streaming links (YouTube, Vimeo).',
    'When revoking access, delete the blob via Vercel and save the lesson to clear stale URLs.',
    'Signed URLs should be generated server-side with short expirations (e.g., 1 hour) to reduce leak risk.'
  ];

  return (
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100">
          <UploadCloud className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Lesson Media Pipeline</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Learn how SunLMS handles document and video uploads end-to-end—from the lesson editor all the way to the inline
          student playback experience.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Feature Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featureHighlights.map((item, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary-50">{item.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <UploadCloud className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Instructor Workflow</h2>
        </div>
        <div className="space-y-6">
          {uploadSteps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 mt-1">{step.details}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <LinkIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Storage & Access</h3>
          </div>
          <ul className="space-y-3 list-disc list-inside text-gray-600">
            {storageRules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Student Experience</h3>
          </div>
          <ul className="space-y-3 list-disc list-inside text-gray-600">
            {studentExperience.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-primary-50 rounded-xl border border-primary-100 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Best Practices</h3>
        <ul className="space-y-2 list-disc list-inside text-gray-700">
          {bestPractices.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default LessonMediaDocs;

