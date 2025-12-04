// SCORM Course Player - Clean implementation that loads SCORM content directly
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, Maximize, Minimize, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import PageLayout from '../ui/PageLayout';

interface ScormPackage {
  id: string;
  title: string;
  content_base_path: string;
  version: string;
}

interface ScormSco {
  id: string;
  identifier: string;
  title: string;
  launch_path: string;
  is_entry_point: boolean;
}

const ScormCoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);
  const [scoId, setScoId] = useState<string | null>(null);
  const [packageInfo, setPackageInfo] = useState<ScormPackage | null>(null);
  const [scos, setScos] = useState<ScormSco[]>([]);
  const [currentScoIndex, setCurrentScoIndex] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Build the launch URL for a SCO
  const buildLaunchUrl = useCallback((pkg: ScormPackage, sco: ScormSco): string => {
    // Sanitize launch path
    const launchPath = sco.launch_path
      .replace(/^\/+/, '')
      .replace(/\.\./g, '')
      .replace(/\0/g, '');

    // Serve SCORM content through our same-origin path-style route so that
    // all relative URLs (images, CSS, JS, JSON) resolve under the same package.
    // Example: /api/scorm/content/<packageId>/Playing/Playing.html
    const encodedPath = encodeURI(launchPath); // preserve slashes
    return `/api/scorm/content/${pkg.id}/${encodedPath}`;
  }, []);

  // Load SCORM course data
  const loadScormCourse = useCallback(async () => {
    if (!courseId) {
      setError('Course ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get course info
      const courseRes = await api.get(`/courses/${courseId}`);
      if (!courseRes.success || !courseRes.data) {
        throw new Error('Course not found');
      }

      const course = courseRes.data;
      if (!course.is_scorm) {
        throw new Error('This is not a SCORM course');
      }

      // Get SCORM package info
      const packageRes = await api.scorm.getPackageByCourseId(courseId);
      if (!packageRes.success || !packageRes.data?.package) {
        throw new Error('SCORM package not found for this course');
      }

      const pkg = packageRes.data.package as ScormPackage;
      const scoList = (packageRes.data.scos || []) as ScormSco[];

      if (scoList.length === 0) {
        throw new Error('No SCOs found in SCORM package');
      }

      // Find entry SCO (or first SCO)
      const entryIndex = scoList.findIndex(sco => sco.is_entry_point);
      const startIndex = entryIndex >= 0 ? entryIndex : 0;
      const entrySco = scoList[startIndex];

      setPackageInfo(pkg);
      setScos(scoList);
      setScoId(entrySco.id);
      setCurrentScoIndex(startIndex);

      // Build launch URL - direct access to Vercel Blob
      const url = buildLaunchUrl(pkg, entrySco);
      
      console.log('[SCORM] Launch configuration:', {
        packageId: pkg.id,
        packageTitle: pkg.title,
        contentBasePath: pkg.content_base_path,
        launchPath: entrySco.launch_path,
        fullLaunchUrl: url,
        totalScos: scoList.length
      });

      setLaunchUrl(url);
      setIframeLoaded(false);
    } catch (err: any) {
      console.error('[SCORM] Failed to load course:', err);
      setError(err?.message || 'Failed to load SCORM course');
      showToast(err?.message || 'Failed to load SCORM course', 'error');
    } finally {
      setLoading(false);
    }
  }, [courseId, buildLaunchUrl, showToast]);

  // Load course on mount
  useEffect(() => {
    loadScormCourse();
  }, [loadScormCourse]);

  // Navigate to a specific SCO
  const navigateToSco = useCallback((index: number) => {
    if (!packageInfo || !scos[index]) return;
    
    const sco = scos[index];
    const url = buildLaunchUrl(packageInfo, sco);
    
    setCurrentScoIndex(index);
    setScoId(sco.id);
    setLaunchUrl(url);
    setIframeLoaded(false);
    
    console.log('[SCORM] Navigating to SCO:', {
      index,
      scoId: sco.id,
      scoTitle: sco.title,
      url
    });
  }, [packageInfo, scos, buildLaunchUrl]);

  // SCORM 1.2 Runtime API
  useEffect(() => {
    if (!scoId) return;

    const cmi: Record<string, string> = {
      'cmi.core.student_id': 'student',
      'cmi.core.student_name': 'Student User',
      'cmi.core.lesson_status': 'not attempted',
      'cmi.core.lesson_location': '',
      'cmi.core.credit': 'credit',
      'cmi.core.entry': 'ab-initio',
      'cmi.suspend_data': '',
    };
    let initialized = false;
    let finished = false;
    let lastError = '0';

    const commitData = async () => {
      try {
        await api.post('/scorm/runtime/commit', {
          scoId,
          attemptNo: 1,
          cmi,
        });
        console.log('[SCORM] Data committed successfully');
      } catch (err) {
        console.error('[SCORM] Commit failed:', err);
      }
    };

    const scormAPI = {
      LMSInitialize: (_param: string = ''): string => {
        console.log('[SCORM API] LMSInitialize called');
        if (finished) {
          lastError = '101';
          return 'false';
        }
        initialized = true;
        lastError = '0';
        cmi['cmi.core.lesson_status'] = 'incomplete';
        return 'true';
      },
      
      LMSFinish: (_param: string = ''): string => {
        console.log('[SCORM API] LMSFinish called');
        if (!initialized) {
          lastError = '301';
          return 'false';
        }
        finished = true;
        lastError = '0';
        if (cmi['cmi.core.lesson_status'] === 'incomplete') {
          cmi['cmi.core.lesson_status'] = 'completed';
        }
        commitData();
        return 'true';
      },
      
      LMSGetValue: (element: string): string => {
        console.log('[SCORM API] LMSGetValue:', element);
        if (!initialized && element !== '') {
          lastError = '301';
          return '';
        }
        lastError = '0';
        const value = cmi[element] ?? '';
        console.log('[SCORM API] LMSGetValue result:', value);
        return value;
      },
      
      LMSSetValue: (element: string, value: string): string => {
        console.log('[SCORM API] LMSSetValue:', element, '=', value);
        if (!initialized) {
          lastError = '301';
          return 'false';
        }
        cmi[element] = String(value ?? '');
        lastError = '0';
        return 'true';
      },
      
      LMSCommit: (_param: string = ''): string => {
        console.log('[SCORM API] LMSCommit called');
        if (!initialized) {
          lastError = '301';
          return 'false';
        }
        lastError = '0';
        commitData();
        return 'true';
      },
      
      LMSGetLastError: (): string => {
        return lastError;
      },
      
      LMSGetErrorString: (errorCode: string): string => {
        const errors: Record<string, string> = {
          '0': 'No error',
          '101': 'General exception',
          '201': 'Invalid argument error',
          '202': 'Element cannot have children',
          '203': 'Element not an array',
          '301': 'Not initialized',
          '401': 'Not implemented error',
          '402': 'Invalid set value',
          '403': 'Element is read only',
          '404': 'Element is write only',
          '405': 'Incorrect data type',
        };
        return errors[errorCode] || 'Unknown error';
      },
      
      LMSGetDiagnostic: (errorCode: string): string => {
        return `Diagnostic info for error ${errorCode || lastError}`;
      },
    };

    // Expose API on window for SCORM content to find
    (window as any).API = scormAPI;
    console.log('[SCORM] Runtime API initialized and exposed on window.API');

    return () => {
      if ((window as any).API === scormAPI) {
        delete (window as any).API;
        console.log('[SCORM] Runtime API cleaned up');
      }
    };
  }, [scoId]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log('[SCORM] Iframe loaded');
    setIframeLoaded(true);
    
    // Try to inject API into iframe (same-origin only)
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow && (window as any).API) {
        (iframe.contentWindow as any).API = (window as any).API;
        console.log('[SCORM] API injected into iframe window');
      }
    } catch (e) {
      // Cross-origin - content will use window.parent.API
      console.log('[SCORM] Cross-origin iframe, API available via window.parent.API');
    }
  }, []);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-600">Loading SCORM course...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !launchUrl) {
    return (
      <PageLayout
        title="SCORM Course Error"
        breadcrumbs={[{ label: 'Courses', path: '/student/courses' }]}
      >
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Unable to Load Course</h2>
          </div>
          <p className="text-gray-600 mb-6">{error || 'Course data is missing.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Back to Courses
            </button>
            <button
              onClick={loadScormCourse}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Render the iframe
  const renderContent = () => (
    <div className="relative w-full h-full min-h-[500px]" style={{ height: isFullscreen ? 'calc(100vh - 60px)' : '70vh' }}>
      {/* Loading overlay */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            <p className="text-gray-600">Loading content...</p>
          </div>
        </div>
      )}
      
      {/* SCORM iframe - NO sandbox, NO proxy, direct Vercel Blob access */}
      <iframe
        ref={iframeRef}
        src={launchUrl}
        title={packageInfo?.title || 'SCORM Course'}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        allow="fullscreen"
      />
    </div>
  );

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col z-50">
        <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700"
            >
              <ArrowLeft size={16} />
              <span className="text-sm">Exit</span>
            </button>
            <span className="text-sm font-medium">{packageInfo?.title}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* SCO navigation */}
            {scos.length > 1 && (
              <div className="flex items-center gap-2 mr-4">
                <button
                  onClick={() => navigateToSco(currentScoIndex - 1)}
                  disabled={currentScoIndex === 0}
                  className="px-2 py-1 text-sm bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-400">
                  {currentScoIndex + 1} / {scos.length}
                </span>
                <button
                  onClick={() => navigateToSco(currentScoIndex + 1)}
                  disabled={currentScoIndex === scos.length - 1}
                  className="px-2 py-1 text-sm bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
                >
                  Next →
                </button>
              </div>
            )}
            
            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded hover:bg-gray-700"
            >
              <Minimize size={16} />
              <span className="text-sm">Exit Fullscreen</span>
            </button>
          </div>
        </div>
        {renderContent()}
      </div>
    );
  }

  // Normal layout
  return (
    <PageLayout
      title={packageInfo?.title || 'SCORM Course'}
      breadcrumbs={[
        { label: 'Courses', path: '/student/courses' },
        { label: packageInfo?.title || 'SCORM Course', path: '#' },
      ]}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 -mx-4 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{packageInfo?.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {scos.length > 1 ? `Module ${currentScoIndex + 1} of ${scos.length}` : 'Your progress is tracked automatically'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* SCO navigation */}
              {scos.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToSco(currentScoIndex - 1)}
                    disabled={currentScoIndex === 0}
                    className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => navigateToSco(currentScoIndex + 1)}
                    disabled={currentScoIndex === scos.length - 1}
                    className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200"
                  >
                    Next →
                  </button>
                </div>
              )}
              
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Maximize size={18} />
                <span>Fullscreen</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {renderContent()}
        </div>
        
        {/* SCO list (if multiple) */}
        {scos.length > 1 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Course Modules</h3>
            <div className="space-y-1">
              {scos.map((sco, index) => (
                <button
                  key={sco.id}
                  onClick={() => navigateToSco(index)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    index === currentScoIndex
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}. {sco.title || sco.identifier}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ScormCoursePlayer;
