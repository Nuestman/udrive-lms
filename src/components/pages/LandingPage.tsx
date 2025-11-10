import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Globe,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Building2,
  Stethoscope,
  HardHat,
  Briefcase,
  DollarSign,
  Target,
  BarChart3,
  CalendarDays,
  Send,
  Lock,
  Bell,
  Palette,
  Quote,
  TrendingDown,
  Clock,
  AlertTriangle,
  X,
  Menu,
  LogOut,
  Home,
  User,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  // Use default branding on marketing site
  const branding = { 
    logoUrl: '/sunlms-logo-wide.png', 
    logoUrlWhite: '/sunlms-logo-wide-white.png', // Fallback to regular if white doesn't exist
    companyName: 'SunLMS' 
  } as const;
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle'|'submitting'|'success'|'error'>('idle');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const activeRole = profile?.active_role || profile?.role || null;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const dashboardPath = useMemo(() => {
    if (!activeRole) {
      return '/dashboard';
    }
    switch (activeRole) {
      case 'student':
        return '/student/dashboard';
      case 'instructor':
        return '/instructor/dashboard';
      case 'super_admin':
        return '/admin/dashboard';
      default:
        return '/school/dashboard';
    }
  }, [activeRole]);

  const userDisplayName = useMemo(() => {
    if (!profile) return null;
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    return fullName || profile.email;
  }, [profile]);

  const userAvatar = useMemo(() => {
    if (profile?.avatar_url) return profile.avatar_url;
    if (!userDisplayName) return `https://ui-avatars.com/api/?name=User&background=B98C1B&color=fff`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userDisplayName)}&background=B98C1B&color=fff`;
  }, [profile?.avatar_url, userDisplayName]);

  const formattedRole = useMemo(() => {
    if (!activeRole) return null;
    return activeRole
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [activeRole]);

  const isAuthenticated = Boolean(user && profile);
  const profilePath = useMemo(() => {
    if (!activeRole) return '/profile';
    switch (activeRole) {
      case 'student':
        return '/student/profile';
      case 'instructor':
        return '/instructor/profile';
      case 'super_admin':
        return '/admin/profile';
      default:
        return '/school/profile';
    }
  }, [activeRole]);

  const themeOptions = useMemo(
    () => [
      {
        value: 'light' as const,
        label: 'Light',
        description: 'Bright interface',
        icon: <Sun className="w-4 h-4" />
      },
      {
        value: 'dark' as const,
        label: 'Dark',
        description: 'Low-light mode',
        icon: <Moon className="w-4 h-4" />
      },
      {
        value: 'auto' as const,
        label: 'System',
        description: `Match ${resolvedTheme} mode`,
        icon: <Monitor className="w-4 h-4" />
      }
    ],
    [resolvedTheme]
  );

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUserMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const featuresTabs = useMemo(() => ([
    {
      key: 'course-builder',
      label: 'Course Builder',
      icon: <BookOpen className="w-4 h-4" />,
      desc: 'Build structured content with a modern editor designed for scale.',
      highlights: ['3-level hierarchy', 'Rich editor', 'Media embedding'],
      points: [
        '3-level structure: Course → Module → Lesson',
        'Rich text editor and media embedding',
        'Content templates and versioning-ready'
      ]
    },
    {
      key: 'student-management',
      label: 'Student Management',
      icon: <Users className="w-4 h-4" />,
      desc: 'Manage learners, cohorts, and communications with ease.',
      highlights: ['Cohorts', 'Bulk actions', 'Directory'],
      points: [
        'Add, edit, search students',
        'Cohorts and enrollment tracking',
        'Activity view and contact info'
      ]
    },
    {
      key: 'enrollments',
      label: 'Enrollments',
      icon: <Briefcase className="w-4 h-4" />,
      desc: 'Simple enrollment flows with statuses and progress linkage.',
      highlights: ['Status flows', 'Filters', 'Bulk updates'],
      points: [
        'Enroll/Unenroll flows and statuses',
        'Auto progress calculation',
        'Filters and bulk actions'
      ]
    },
    {
      key: 'progress',
      label: 'Progress Tracking',
      icon: <TrendingUp className="w-4 h-4" />,
      desc: 'Transparent tracking from lesson to course completion.',
      highlights: ['Bars', 'Per-student', 'Per-course'],
      points: [
        'Lesson and module completion',
        'Course progress bars',
        'Student and course-level views'
      ]
    },
    {
      key: 'quizzes',
      label: 'Quiz Engine',
      icon: <Target className="w-4 h-4" />,
      desc: 'Assess learning with auto-grading and attempt history.',
      highlights: ['Attempts', 'Auto-grading', 'Results'],
      points: [
        'Question management and attempts',
        'Auto-grading and results',
        'Attempt history'
      ]
    },
    {
      key: 'certificates',
      label: 'Certificates',
      icon: <Award className="w-4 h-4" />,
      desc: 'Generate QR-verifiable certificates instantly.',
      highlights: ['QR verify', 'Storage', 'Public check'],
      points: [
        'QR-verifiable digital certificates',
        'Generation and storage',
        'Public verification page'
      ]
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      desc: 'KPIs and activity feeds for data-driven operations.',
      highlights: ['KPIs', 'Reports', 'Tenant stats'],
      points: [
        'Dashboard KPIs and activity feed',
        'Compliance reports',
        'Org and tenant-level stats'
      ]
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-4 h-4" />,
      desc: 'Real-time communication across users, roles, and tenants.',
      highlights: ['Real-time', 'Email-ready', 'Targeting'],
      points: [
        'Real-time in-app alerts (Socket.IO)',
        'Email delivery ready',
        'Role/tenant targeting'
      ]
    },
    {
      key: 'security',
      label: 'Security & 2FA',
      icon: <Lock className="w-4 h-4" />,
      desc: 'Enterprise-grade security with strong tenant isolation.',
      highlights: ['RBAC', '2FA', 'Compliance'],
      points: [
        'JWT auth, RBAC, tenant isolation',
        '2FA (TOTP), rate limiting, audit logs',
        'GDPR + Ghana DPA (Act 843) alignment'
      ]
    },
    {
      key: 'whitelabel',
      label: 'White-labeling',
      icon: <Palette className="w-4 h-4" />,
      desc: 'Make it yours with branding and domain customization.',
      highlights: ['Logos', 'Colors', 'Domains'],
      points: [
        'Custom logos, colors, and domains',
        'Configurable docs and footer',
        'Theme and appearance settings'
      ]
    }
  ]), []);
  const [activeFeatureKey, setActiveFeatureKey] = useState(featuresTabs[0].key);

  const renderFeatureIllustration = (key: string) => {
    // Minimal, on-brand inline SVG illustrations per feature
    switch (key) {
      case 'course-builder':
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#F1F5FF" />
                <stop offset="100%" stopColor="#ECFDF5" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="400" height="200" fill="url(#g1)" />
            <rect x="28" y="26" width="344" height="148" rx="12" fill="#ffffff" stroke="#E5E7EB" />
            <rect x="48" y="48" width="120" height="16" rx="4" fill="#1D4ED8" opacity="0.2" />
            <rect x="48" y="72" width="220" height="10" rx="4" fill="#111827" opacity="0.15" />
            <rect x="48" y="92" width="180" height="10" rx="4" fill="#111827" opacity="0.15" />
            <rect x="48" y="124" width="80" height="22" rx="6" fill="#1D4ED8" opacity="0.25" />
            <rect x="136" y="124" width="80" height="22" rx="6" fill="#16A34A" opacity="0.25" />
          </svg>
        );
      case 'student-management':
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect width="400" height="200" fill="#EEF2FF" />
            <circle cx="80" cy="80" r="22" fill="#1D4ED8" opacity="0.35" />
            <rect x="120" y="66" width="120" height="12" rx="4" fill="#111827" opacity="0.15" />
            <rect x="120" y="86" width="180" height="10" rx="4" fill="#111827" opacity="0.1" />
            <circle cx="80" cy="140" r="22" fill="#16A34A" opacity="0.35" />
            <rect x="120" y="126" width="120" height="12" rx="4" fill="#111827" opacity="0.15" />
            <rect x="120" y="146" width="160" height="10" rx="4" fill="#111827" opacity="0.1" />
          </svg>
        );
      case 'analytics':
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect width="400" height="200" fill="#F0FDF4" />
            <rect x="60" y="110" width="30" height="50" fill="#1D4ED8" opacity="0.3" />
            <rect x="110" y="80" width="30" height="80" fill="#16A34A" opacity="0.35" />
            <rect x="160" y="95" width="30" height="65" fill="#F59E0B" opacity="0.4" />
            <rect x="210" y="60" width="30" height="100" fill="#DC2626" opacity="0.25" />
            <polyline points="60,120 110,90 160,100 210,70 260,90 310,80" fill="none" stroke="#1D4ED8" strokeWidth="2" opacity="0.5" />
          </svg>
        );
      case 'security':
        return (
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <rect width="400" height="200" fill="#F8FAFC" />
            <rect x="70" y="40" width="260" height="120" rx="12" fill="#ffffff" stroke="#E5E7EB" />
            <rect x="100" y="70" width="60" height="40" rx="8" fill="#1F2937" opacity="0.08" />
            <path d="M130 86 a10 10 0 1 0 0.1 0" fill="#1D4ED8" opacity="0.4" />
            <rect x="180" y="76" width="140" height="12" rx="4" fill="#111827" opacity="0.15" />
            <rect x="180" y="96" width="120" height="12" rx="4" fill="#111827" opacity="0.1" />
          </svg>
        );
      default:
        return (
          <div className="h-full min-h-[180px] rounded-lg border border-gray-100 bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center text-primary-700">
            <span className="text-sm font-medium">Polished UX with responsive, mobile-first design</span>
          </div>
        );
    }
  };

  const testimonials = [
    {
      name: "Ms. Seniormost Nurse",
      role: "Nurse Manager, AGA Health Foundation",
      organization: "Healthcare",
      content: "SunLMS has revolutionized our CPD training. Facility-specific content means our nurses gain skills directly applicable to their practice. CPD point management is seamless, and our compliance rates have improved significantly.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2",
      rating: 5,
      highlight: "98% compliance rate",
      gradient: "from-teal-50 to-primary-50"
    },
    {
      name: "Some Guy",
      role: "Safety Manager, AGAG, Obuasi Mine",
      organization: "Mining & Industrial",
      content: "Quarterly safety refreshers have transformed our safety culture. The platform's role-based training ensures every department gets relevant content. Our incident rates have dropped by 30% since implementing continuous training.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2",
      rating: 5,
      highlight: "30% reduction in incidents",
      gradient: "from-amber-50 to-secondary-50"
    },
    {
      name: "Patience Osei",
      role: "HR Director, Corporate Solutions Ltd",
      organization: "Corporate",
      content: "Our culture-building programs are now measurable and impactful. The quarterly training modules keep our values top of mind, and we've seen employee engagement scores increase by 25% year-over-year.",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2",
      rating: 5,
      highlight: "25% engagement increase",
      gradient: "from-indigo-50 to-primary-50"
    },
    {
      name: "Emmanuel Boateng",
      role: "Principal, Accra Driving Academy",
      organization: "Education & Training",
      content: "The mobile-first design means our students can learn anywhere. Progress tracking helps us identify who needs extra support, and digital certificates streamline our certification process beautifully.",
      avatar: "https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2",
      rating: 5,
      highlight: "40% completion increase",
      gradient: "from-rose-50 to-secondary-50"
    }
  ];

  const faqs = [
    {
      question: "What makes SunLMS different from other LMS platforms?",
      answer: "SunLMS is a flexible LMS/CMS-as-a-Service designed for organizations. It powers specialized, context-aware solutions for healthcare (CPD), mining & industrial safety, corporate training, and education—on a single multi-tenant platform."
    },
    {
      question: "How long does it take to set up SunLMS for my organization?",
      answer: "Most organizations are up and running within 24–48 hours. We provide onboarding support and templates tailored to your industry."
    },
    {
      question: "Can I import my existing course content?",
      answer: "Yes! Our migration team can help you import existing content from other platforms. We support various file formats and provide tools to convert your materials."
    },
    {
      question: "Is SunLMS mobile-friendly?",
      answer: "Absolutely. SunLMS is fully responsive and optimized for mobile, tablet, and desktop."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 technical support, comprehensive documentation, video tutorials, and dedicated account management for enterprise customers."
    },
    {
      question: "How secure is my data?",
      answer: "We use enterprise-grade security, encryption, regular security audits, and GDPR-aligned data practices with tenant isolation."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Learners Trained" },
    { number: "500+", label: "Organizations" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  const industries = useMemo(() => ([
    {
      icon: <Stethoscope className="w-6 h-6" />, title: "Healthcare",
      points: [
        "Context-relevant CPD with facility-specific content",
        "CPD point management and PIN renewal streamlining",
        "Compliance reporting and assessments"
      ],
      accent: "from-teal-50 to-primary-50"
    },
    {
      icon: <HardHat className="w-6 h-6" />, title: "Mining & Industrial",
      points: [
        "Continuous safety refreshers (quarterly)",
        "Role-based training per department",
        "Automated compliance tracking"
      ],
      accent: "from-amber-50 to-secondary-50"
    },
    {
      icon: <Briefcase className="w-6 h-6" />, title: "Corporate",
      points: [
        "Culture-building programs and assessments",
        "Flexible professional development",
        "Risk/compliance management"
      ],
      accent: "from-indigo-50 to-primary-50"
    },
    {
      icon: <Building2 className="w-6 h-6" />, title: "Education & Training",
      points: [
        "Driving schools and training centers",
        "Progress tracking and certification",
        "Mobile-first delivery"
      ],
      accent: "from-rose-50 to-secondary-50"
    }
  ]), []);

  const pricing = [
    { tier: "Free", price: "GH₵0", blurb: "Up to 50 users, basics to get started.", features: ["Course builder", "Enrollments", "Basic analytics"] },
    { tier: "Professional", price: "GH₵120–300/user/mo", blurb: "Advanced features for growing orgs.", features: ["Multi-tenant", "Automations", "Advanced analytics", "Digital certificates"] },
    { tier: "Enterprise", price: "Custom", blurb: "White-label, integrations, and SLAs.", features: ["SSO", "Custom SLAs", "Dedicated support", "Compliance packs"] }
  ];

  const kpis = [
    { icon: <BarChart3 className="w-5 h-5" />, label: "Completion Rate" },
    { icon: <Target className="w-5 h-5" />, label: "Compliance Rate" },
    { icon: <TrendingUp className="w-5 h-5" />, label: "Feature Usage" },
    { icon: <CalendarDays className="w-5 h-5" />, label: "Time to Value" }
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactStatus === 'submitting') return;
    setContactStatus('submitting');
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const endpoint = `${API_URL}/contact`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(contactForm)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        // Reset success message after 5 seconds
        setTimeout(() => setContactStatus('idle'), 5000);
      } else {
        // Show error message but don't automatically fall back to mailto
        setContactStatus('error');
        console.error('Contact form error:', data.message || 'Failed to send message');
        // Keep error message for 8 seconds to give user time to see it
        setTimeout(() => setContactStatus('idle'), 8000);
      }
    } catch (error) {
      // Network error or other exception
      console.error('Contact form submission error:', error);
      setContactStatus('error');
      // Keep error message for 8 seconds
      setTimeout(() => setContactStatus('idle'), 8000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={branding.logoUrl} alt={branding.companyName} className="h-12 w-auto mr-3" />
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">Contact</a>
              <Link
                to="/docs"
                className="flex items-center text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
              >
                Docs
                <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/docs/implementation-progress"
                className="flex items-center text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium transition-colors"
              >
                Status
                <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
            </nav>

            {/* Desktop CTA Buttons */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to={dashboardPath}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 dark:hover:border-primary-400 transition-colors"
                    aria-haspopup="true"
                  >
                    <img
                      src={userAvatar}
                      alt={userDisplayName || 'User avatar'}
                      className="h-9 w-9 rounded-full object-cover border border-primary-100"
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-gray-800">{userDisplayName}</span>
                      {formattedRole && (
                        <span className="text-xs text-gray-500">{formattedRole}</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-56 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/[0.04] dark:ring-white/[0.05] overflow-hidden z-50 transition-colors duration-200"
                      >
                        <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-900">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userDisplayName}</p>
                          {formattedRole && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{formattedRole}</p>
                          )}
                        </div>
                        <div className="py-2">
                          <Link
                            to={dashboardPath}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            <Home className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            to={profilePath}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-800 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            View Profile
                          </Link>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-800">
                          <div className="px-4 pt-3 pb-2">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Theme</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose how SunLMS looks for you.</p>
                          </div>
                          <div className="flex flex-col gap-1 px-2 pb-2">
                            {themeOptions.map((option) => {
                              const isActive = theme === option.value;
                              return (
                                <button
                                  type="button"
                                  key={option.value}
                                  onClick={() => {
                                    setTheme(option.value);
                                  }}
                                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                                    isActive
                                      ? 'bg-primary-50 text-primary-700 border border-primary-100 shadow-inner dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/40'
                                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  }`}
                                >
                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                                      isActive
                                        ? 'bg-primary-100 text-primary-600 dark:bg-primary-500/20 dark:text-primary-200'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                    }`}
                                  >
                                    {option.icon}
                                  </span>
                                  <div className="flex flex-col text-left">
                                    <span className="font-medium leading-tight">{option.label}</span>
                                    <span className="text-xs text-gray-500 leading-tight dark:text-gray-400">
                                      {option.description}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-gray-100 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden relative p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            
            {/* Sidebar Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 md:hidden rounded-bl-2xl overflow-hidden flex flex-col max-h-screen"
            >
              <nav className="p-6 space-y-2 flex-1 overflow-y-auto">
                {/* Close Button */}
                <div className="flex justify-end mb-4 -mt-2 -mr-2">
                  <motion.button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Close menu"
                    whileTap={{ scale: 0.95 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
                <motion.a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Features
                </motion.a>
                <motion.a
                  href="#testimonials"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  Testimonials
                </motion.a>
                <motion.a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  FAQ
                </motion.a>
                <motion.a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  Contact
                </motion.a>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    to="/docs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  >
                    Documentation
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    to="/docs/implementation-progress"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center py-3 px-4 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  >
                    Development Status
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </motion.div>
                <motion.div
                  className="pt-6 mt-6 border-t border-gray-200 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <img
                          src={userAvatar}
                          alt={userDisplayName || 'User avatar'}
                          className="h-12 w-12 rounded-full object-cover border border-primary-200"
                        />
                        <div className="flex flex-col">
                          <span className="text-base font-semibold text-gray-800">
                            {userDisplayName}
                          </span>
                          {formattedRole && (
                            <span className="text-sm text-gray-500">{formattedRole}</span>
                          )}
                        </div>
                      </div>
                      <Link
                        to={dashboardPath}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 border-2 border-gray-300 hover:border-primary-300 text-gray-700 hover:text-primary-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg text-sm font-medium transition-all shadow-lg"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <motion.section 
        className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full text-sm font-medium mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>
              🚧 System Under Active Development
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Flexible, Context-Aware
              <span className="block bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 bg-clip-text text-transparent">
                Learning for Modern Organizations
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              SunLMS helps healthcare, industrial, corporate, and educational teams deliver relevant training, reinforce culture, and stay compliant—at scale.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/signup"
                  className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all shadow-xl hover:shadow-2xl"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-4 border-2 border-gray-300 hover:border-primary-300 text-gray-700 hover:text-primary-600 font-semibold rounded-xl transition-all hover:bg-primary-50"
                >
                  Sign In to Dashboard
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats */}
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 dark:text-primary-300 mb-2">{stat.number}</div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Why SunLMS Section */}
      <motion.section 
        className="py-20 bg-white dark:bg-gray-950 transition-colors"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Why SunLMS?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              We've identified the critical problems organizations face. Here's how SunLMS solves them.
            </p>
          </motion.div>

          <div className="space-y-12">
            {/* Problem 1: Culture Erosion - Normal layout (Problem left, Solution right) */}
            <motion.div 
              className="rounded-2xl overflow-hidden shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-7 h-7 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Organizational Culture Erosion</h3>
                      <p className="text-gray-600 font-medium text-sm">The Problem</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Dwindling company culture</strong> across departments and organizations</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Impact:</strong> Reduced employee engagement, productivity, and retention</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Current solutions:</strong> Inconsistent, ad-hoc training with no follow-up</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">SunLMS Solution</h4>
                      <p className="text-primary-700 font-medium text-sm">Systematic Culture Building</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Quarterly culture reinforcement training modules</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Measurable culture impact through assessments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Consistent, organization-wide value alignment</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Problem 2: Irrelevant Professional Development - Style B (alternating bg design) */}
            <motion.div 
              className="rounded-2xl overflow-hidden shadow-xl border-2 border-primary-200 bg-gradient-to-r from-primary-50/30 to-secondary-50/30"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="bg-white/80 backdrop-blur-sm p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Target className="w-7 h-7 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Irrelevant Professional Development</h3>
                      <p className="text-gray-600 font-medium text-sm">The Problem</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Generic CPD courses</strong> that lack context and relevance to specific roles/facilities</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Impact:</strong> Professionals gain points but not meaningful skills for their practice</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Current solutions:</strong> Generic online courses that don't address organizational needs</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white">SunLMS Solution</h4>
                      <p className="text-primary-100 font-medium text-sm">Context-Relevant Training</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>Facility-specific and role-relevant content</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>Skills that directly improve practice and patient care</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>CPD point management with seamless renewal workflows</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Problem 3: Inefficient Onboarding - Normal layout (Problem left, Solution right) */}
            <motion.div 
              className="rounded-2xl overflow-hidden shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Clock className="w-7 h-7 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Inefficient Onboarding Processes</h3>
                      <p className="text-gray-600 font-medium text-sm">The Problem</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Prolonged, repetitive onboarding</strong> that delays productivity</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Impact:</strong> Extended time-to-productivity, resource waste, employee frustration</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Current solutions:</strong> Traditional in-person training sessions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">SunLMS Solution</h4>
                      <p className="text-primary-700 font-medium text-sm">Streamlined Onboarding</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Pre-structured, self-paced onboarding programs</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Validation and follow-up to ensure readiness</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Faster time-to-productivity with reduced training costs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Problem 4: Compliance and Safety Gaps - Style B (alternating bg design) */}
            <motion.div 
              className="rounded-2xl overflow-hidden shadow-xl border-2 border-primary-200 bg-gradient-to-r from-primary-50/30 to-secondary-50/30"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="bg-white/80 backdrop-blur-sm p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-7 h-7 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Compliance and Safety Gaps</h3>
                      <p className="text-gray-600 font-medium text-sm">The Problem</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Annual safety refreshers</strong> are insufficient for high-risk environments</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Impact:</strong> Safety incidents, regulatory violations, operational risks</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Current solutions:</strong> Annual training sessions with limited retention</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white">SunLMS Solution</h4>
                      <p className="text-primary-100 font-medium text-sm">Continuous Compliance</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-white/90">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>Quarterly safety refreshers instead of annual sessions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>Context-specific training for different roles and departments</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>Automated tracking and real-time compliance monitoring</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Problem 5: Accessibility Issues - Normal layout (Problem left, Solution right) */}
            <motion.div 
              className="rounded-2xl overflow-hidden shadow-lg border border-gray-200"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                      <Users className="w-7 h-7 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Accessibility and Flexibility Issues</h3>
                      <p className="text-gray-600 font-medium text-sm">The Problem</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-gray-700">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Training schedules conflict</strong> with work responsibilities</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Impact:</strong> Missed training opportunities, incomplete skill development</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p><strong>Current solutions:</strong> Fixed-schedule training sessions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">SunLMS Solution</h4>
                      <p className="text-primary-700 font-medium text-sm">Flexible Learning</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Mobile-first design for learning anywhere, anytime</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Self-paced learning that fits work schedules</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                      <span>Higher completion rates with accessible delivery</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Summary CTA */}
          <motion.div 
            className="mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Solve These Problems?
            </h3>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              SunLMS addresses real organizational challenges with systematic, measurable solutions. 
              Transform your learning and development today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-4 bg-white text-primary-700 hover:bg-gray-100 rounded-xl font-semibold transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="#contact"
                className="inline-flex items-center px-8 py-4 border-2 border-white/30 hover:border-white rounded-xl font-semibold transition-colors"
              >
                Schedule a Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Industries / Target Markets */}
      <motion.section 
        className="py-16 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Built for Your Industry</h2>
            <p className="text-lg md:text-xl text-gray-600">One platform, specialized outcomes across sectors.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((i, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border border-gray-100 bg-gradient-to-br ${i.accent} hover:shadow-lg transition-shadow`}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white text-primary-600 shadow-sm mb-4">
                  {i.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">{i.title}</h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  {i.points.map((p, pidx) => (
                    <li key={pidx} className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2" /> {p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* removed Current Development Status section; see /docs/implementation-progress */}

      {/* Features Section - Vertical Tabs with Rich Panel */}
      <motion.section 
        id="features" 
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Explore capabilities designed for production-scale learning.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Vertical Tabs */}
            <div className="lg:col-span-4">
              <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-100 rounded-2xl p-3 md:p-4 shadow-sm sticky top-24">
                <div className="space-y-1" role="tablist" aria-orientation="vertical">
                  {featuresTabs.map((tab, idx) => {
                    const active = activeFeatureKey === tab.key;
                    return (
                      <button
                        key={tab.key}
                        role="tab"
                        aria-controls={`panel-${tab.key}`}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            const next = featuresTabs[(idx + 1) % featuresTabs.length];
                            setActiveFeatureKey(next.key);
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            const prev = featuresTabs[(idx - 1 + featuresTabs.length) % featuresTabs.length];
                            setActiveFeatureKey(prev.key);
                          }
                        }}
                        onClick={() => setActiveFeatureKey(tab.key)}
                        className={`w-full text-left flex items-center justify-between gap-3 px-3 py-3 rounded-xl border transition-all ${active ? 'bg-white border-primary-200 shadow text-primary-700' : 'bg-white/70 border-gray-200 hover:bg-white text-gray-700'}`}
                      >
                        <span className="inline-flex items-center gap-2">
                          {tab.icon}
                          <span className="font-medium">{tab.label}</span>
                        </span>
                        <span className={`w-2 h-2 rounded-full ${active ? 'bg-primary-500' : 'bg-gray-300'}`}></span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Content Panel */}
            <div className="lg:col-span-8">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
                {featuresTabs.map((tab) => (
                  <div
                    key={tab.key}
                    id={`panel-${tab.key}`}
                    role="tabpanel"
                    className={activeFeatureKey === tab.key ? 'block' : 'hidden'}
                  >
                    <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-7">
                      <div className="flex items-center justify-between mb-2">
                        <div className="inline-flex items-center gap-2 text-primary-700 font-semibold">
                          {tab.icon}
                          {tab.label}
                        </div>
                        <div className="hidden md:flex gap-2">
                          {tab.highlights?.map((h: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-primary-50 text-primary-700 border border-primary-100">{h}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-5">{tab.desc}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">What you get</h4>
                          <ul className="space-y-2 text-gray-700">
                            {tab.points.map((p, idx) => (
                              <li key={idx} className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2" /> {p}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Experience</h4>
                          <div className="h-full min-h-[180px] rounded-lg overflow-hidden border border-gray-100">
                            {renderFeatureIllustration(tab.key)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Value Propositions by Segment */}
      <motion.section 
        className="py-16 bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Value That Drives Outcomes</h2>
            <p className="text-lg md:text-xl text-gray-600">Tailored benefits across different industries.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Healthcare</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Context-relevant CPD training</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> CPD points & renewal workflows</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Measurable impact on patient care</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Mining & Industrial</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Quarterly safety refreshers</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Department-level training</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Risk & compliance tracking</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Corporate</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Culture reinforcement programs</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Flexible professional development</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Engagement & retention impact</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Education & Training</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Templates for schools & centers</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Progress tracking & certificates</li>
                <li className="flex"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2"/> Mobile-first learner experience</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        id="testimonials" 
        className="py-20 bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Forward-Thinking Organizations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real results from organizations across healthcare, mining, corporate, and education sectors.
            </p>
          </div>

          {/* Featured Testimonial */}
          <div className="mb-12">
            <div className={`bg-gradient-to-br ${testimonials[0].gradient} border border-gray-200 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden`}>
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="w-32 h-32 text-primary-600" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(testimonials[0].rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-gray-900 mb-6 leading-relaxed font-medium">
                  "{testimonials[0].content}"
                </p>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonials[0].avatar}
                      alt={testimonials[0].name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">{testimonials[0].name}</div>
                      <div className="text-gray-700">{testimonials[0].role}</div>
                      <div className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/80 text-primary-700">
                        {testimonials[0].organization}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-700">{testimonials[0].highlight}</div>
                    <div className="text-sm text-gray-600">Measurable Impact</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.slice(1).map((testimonial, index) => (
              <div key={index} className={`bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}>
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${testimonial.gradient} opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity`}></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-primary-200" />
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed text-sm">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{testimonial.name}</div>
                      <div className="text-gray-600 text-xs truncate">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                      {testimonial.organization}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">{testimonial.highlight}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section 
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg md:text-xl text-gray-600">Local Ghana pricing (GH₵). 60-day money-back guarantee.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((p, idx) => (
              <div key={idx} className="border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2 text-primary-600"><DollarSign className="w-5 h-5 mr-2" /> {p.tier}</div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{p.price}</div>
                <p className="text-gray-600 mb-6">{p.blurb}</p>
                <ul className="space-y-2 text-gray-700 text-sm mb-6">
                  {p.features.map((f, fidx) => (
                    <li key={fidx} className="flex items-start"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 mr-2" /> {f}</li>
                  ))}
                </ul>
                <Link to="/signup" className="inline-flex items-center px-5 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors">Get Started <ArrowRight className="w-4 h-4 ml-2"/></Link>
                <div className="mt-4 text-xs text-gray-500">Backed by our 60-day money-back guarantee.</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-gray-600">
            Compliance: GDPR and Ghana Data Protection Act (Act 843).
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        id="faq" 
        className="py-20 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Get answers to common questions about SunLMS.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* KPIs Section */}
      <motion.section 
        className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Measure What Matters</h2>
            <p className="text-lg md:text-xl text-gray-600">Out-of-the-box metrics aligned to outcomes.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {kpis.map((k, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 text-primary-600 mb-3">{k.icon}</div>
                <div className="font-semibold text-gray-900">{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Contact Section (2 columns) */}
      <motion.section 
        id="contact" 
        className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your organization? Contact us to learn more or schedule a demo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <a href="mailto:nuestman@icloud.com" className="block text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                <p className="text-gray-600 break-all">nuestman@icloud.com</p>
              </a>
              <a href="tel:+233206484034" className="block text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
                <p className="text-gray-600">+233 206 484 034</p>
              </a>
              <a href="https://www.nusman.dev" target="_blank" rel="noopener noreferrer" className="block text-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Website</h3>
                <p className="text-gray-600">www.nusman.dev</p>
              </a>
              <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 flex items-start text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-primary-600 mr-2 mt-0.5"/>
                MVSS 27, Moinsi Valley, Obuasi - Ghana
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Send a Message</h3>
              {contactStatus === 'success' && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <strong>Message sent successfully!</strong> We'll get back to you soon.
                    </div>
                  </div>
                </div>
              )}
              {contactStatus === 'error' && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <div>
                      <strong>Failed to send message.</strong> Please check your connection and try again, or contact us directly at <a href="mailto:nuestman@icloud.com" className="underline">nuestman@icloud.com</a>.
                    </div>
                  </div>
                </div>
              )}
              <form onSubmit={handleContactSubmit} className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input id="contact-name" type="text" required value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input id="contact-email" type="email" required value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="you@example.com" />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input id="contact-subject" type="text" required value={contactForm.subject} onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="How can we help?" />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea id="contact-message" rows={6} required value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Tell us about your goals..." />
                </div>
                <button type="submit" disabled={contactStatus==='submitting'} className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium transition-colors">
                  <Send className="w-5 h-5 mr-2" /> {contactStatus==='submitting' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-10 text-white shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-3">Launch SunLMS in Days, Not Months</h3>
                <p className="text-white/90">Start with a free tier, scale as you grow. 60-day money-back guarantee.</p>
              </div>
              <div className="flex gap-3 md:justify-end">
                <Link to="/signup" className="inline-flex items-center px-6 py-3 bg-white text-primary-700 hover:bg-gray-100 rounded-xl font-semibold transition-colors">Start Free Trial <ArrowRight className="w-4 h-4 ml-2"/></Link>
                <Link to="/login" className="inline-flex items-center px-6 py-3 border-2 border-white/70 hover:border-white rounded-xl font-semibold transition-colors">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src={branding.logoUrlWhite} 
                  alt={branding.companyName} 
                  className="h-12 w-auto mr-3 brightness-0 invert"
                  onError={(e) => {
                    // Fallback to regular logo if white version doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.src = branding.logoUrl;
                    target.className = target.className.replace('brightness-0 invert', '');
                  }}
                />
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering organizations with context-aware learning, culture building, and compliance at scale.
              </p>
              <div className="flex items-center text-gray-400">
                <Globe className="w-4 h-4 mr-2" />
                <span>Serving organizations worldwide</span>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/docs/implementation-progress" className="hover:text-white transition-colors">Development Status</Link></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Docs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/docs/implementation-progress" className="hover:text-white transition-colors">Status Page</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 SunLMS. All rights reserved. | Development Version</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;