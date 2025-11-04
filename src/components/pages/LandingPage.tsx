import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Shield,
  Zap,
  Globe,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

const LandingPage: React.FC = () => {
  // Use default branding on marketing site
  const branding = { logoUrl: '/sunlms-logo-wide.png', companyName: 'SunLMS' } as const;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Course Management",
      description: "Create and manage comprehensive driving courses with our intuitive block editor.",
      color: "bg-primary-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Student Management",
      description: "Track student progress, manage enrollments, and monitor performance in real-time.",
      color: "bg-green-500"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Digital Certificates",
      description: "Generate and manage digital certificates with QR code verification.",
      color: "bg-yellow-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive analytics and reporting for data-driven decisions.",
      color: "bg-primary-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with GDPR compliance and data protection.",
      color: "bg-red-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast & Reliable",
      description: "Lightning-fast performance with 99.9% uptime guarantee.",
      color: "bg-accent-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "Director, Premier Driving Academy",
      content: "SunLMS has transformed how we deliver training across our organization. Our completion rates have increased by 40% since implementation.",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Owner, City Driving School",
      content: "The analytics dashboard gives us insights we never had before. We can now identify struggling students early and provide targeted support.",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      rating: 5
    },
    {
      name: "Jennifer Chen",
      role: "Instructor, Safe Drive Institute",
      content: "Creating interactive lessons has never been easier. The block editor is intuitive and my students love the engaging content.",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "What makes SunLMS different from other LMS platforms?",
      answer: "SunLMS is a generic LMS/CMS-as-a-Service platform that powers specialized solutions for various industries. It provides a flexible foundation that can be customized for healthcare (CPD), corporate training, driving schools, and educational institutions."
    },
    {
      question: "How long does it take to set up SunLMS for my organization?",
      answer: "Most organizations are up and running within 24-48 hours. Our onboarding team provides personalized setup assistance and training for your staff across various industries."
    },
    {
      question: "Can I import my existing course content?",
      answer: "Yes! Our migration team can help you import existing content from other platforms. We support various file formats and provide tools to convert your materials."
    },
    {
      question: "Is SunLMS mobile-friendly?",
      answer: "Absolutely! SunLMS is fully responsive and works seamlessly on all devices. Users can access courses on their phones, tablets, or computers across all industries."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer 24/7 technical support, comprehensive documentation, video tutorials, and dedicated account management for enterprise customers."
    },
    {
      question: "How secure is my data?",
      answer: "We use enterprise-grade security with end-to-end encryption, regular security audits, and compliance with GDPR, CCPA, and education-specific regulations."
    }
  ];

  const stats = [
    { number: "10,000+", label: "Students Trained" },
    { number: "500+", label: "Driving Schools" },
    { number: "99.9%", label: "Uptime" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={branding.logoUrl} alt={branding.companyName} className="h-12 w-auto mr-3" />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition-colors">Testimonials</a>
              <a href="#faq" className="text-gray-700 hover:text-primary-600 transition-colors">FAQ</a>
              <a href="#contact" className="text-gray-700 hover:text-primary-600 transition-colors">Contact</a>
              <Link
                to="/docs"
                className="flex items-center text-gray-700 hover:text-primary-600 transition-colors"
              >
                Documentation
                <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/docs/implementation-progress"
                className="flex items-center text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Development Status
                <ExternalLink className="w-4 h-4 ml-1" />
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full text-sm font-medium mb-8 animate-pulse">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></span>
              🚧 System Under Active Development
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              The Future of
              <span className="block bg-gradient-to-r from-primary-600 via-primary-700 to-secondary-600 bg-clip-text text-transparent">
                Driving Education
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your driving school with our comprehensive Learning Management System. 
              Manage courses, track progress, and deliver exceptional education experiences.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link
                to="/signup"
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-gray-300 hover:border-primary-300 text-gray-700 hover:text-primary-600 font-semibold rounded-xl transition-all hover:bg-primary-50"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Development Status */}
      <section className="py-16 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-primary-100">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Current Development Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">✅ Authentication System - <strong>Ready for Testing</strong></span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">✅ Database Schema - <strong>Implemented</strong></span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">✅ UI Components - <strong>Complete</strong></span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-gray-700">🔄 Multi-Tenant Architecture - <strong>In Progress</strong></span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-gray-700">🔄 Course Management - <strong>Under Development</strong></span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                      <span className="text-gray-700">🔄 Student Portal - <strong>Under Development</strong></span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <Link
                    to="/docs/implementation-progress"
                    className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                  >
                    View Detailed Progress
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Modern Driving Schools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your driving school efficiently and deliver exceptional education experiences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 hover:-translate-y-2">
                <div className={`w-16 h-16 ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by Driving Schools Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers are saying about their experience with SunLMS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
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
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to transform your driving school? Contact us to learn more or schedule a demo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">support@sunlms.com</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600">San Francisco, CA</p>
            </div>
          </div>

          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-xl"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border-2 border-primary-300 hover:border-primary-400 text-primary-700 hover:text-primary-800 font-semibold rounded-xl transition-all hover:bg-primary-50"
              >
                Access Your Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <img src={branding.logoUrl} alt={branding.companyName} className="h-12 w-auto mr-3" />
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering organizations across industries with modern technology to deliver exceptional learning experiences.
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
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status Page</a></li>
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