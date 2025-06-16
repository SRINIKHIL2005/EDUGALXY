import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, Star, Award, Trophy, Users, BookOpen, Calendar, Check, Sparkles,
  Cpu, Database, Network, Radar, Power, Binary, Terminal, Layers, Activity,
  Shield, Lock, Mail, User, Globe, FileText, Zap, Brain, Rocket, Eye, 
  ArrowRight, Play, Pause, Volume2, VolumeX, Settings, Search, Filter
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [systemOnline, setSystemOnline] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [particleSystem, setParticleSystem] = useState([]);
  const [glitchActive, setGlitchActive] = useState(false);
  const [loginHovered, setLoginHovered] = useState(false);
  const [signupHovered, setSignupHovered] = useState(false);
  const [showInitOverlay, setShowInitOverlay] = useState(true);
  const [initProgress, setInitProgress] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [magneticFields, setMagneticFields] = useState([]);
  
  const containerRef = useRef(null);

  // Futuristic messages
  const messages = [
    'NEURAL EDUCATION MATRIX ONLINE...',
    'QUANTUM LEARNING PROTOCOLS ACTIVE...',
    'AI-POWERED FEEDBACK SYSTEMS READY...',
    'BIOMETRIC AUTHENTICATION ENABLED...',
    'WELCOME TO THE FUTURE OF EDUCATION...'
  ];

  // Enhanced color scheme
  const colors = {
    primary: '#06B6D4', // Cyan
    secondary: '#8B5CF6', // Violet
    accent: '#EC4899', // Pink
    success: '#10B981', // Emerald
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    dark: '#0F172A' // Slate-900
  };

  // Features data
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "AI-Powered Learning",
      description: "Advanced neural networks analyze learning patterns and provide personalized educational experiences.",
      color: colors.primary,
      delay: 0
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Quantum Data Analytics",
      description: "Process massive educational datasets with quantum-speed analytics for instant insights.",
      color: colors.secondary,
      delay: 0.2
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Biometric Security",
      description: "Next-generation security protocols ensure your educational data remains protected.",
      color: colors.accent,
      delay: 0.4
    },
    {
      icon: <Network className="w-8 h-8" />,
      title: "Neural Networking",
      description: "Connect students, teachers, and administrators through an advanced communication matrix.",
      color: colors.success,
      delay: 0.6
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Performance Boost",
      description: "Accelerate learning outcomes with our revolutionary educational acceleration technology.",
      color: colors.warning,
      delay: 0.8
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "Real-time Monitoring",
      description: "Advanced surveillance systems track learning progress with microscopic precision.",
      color: colors.danger,
      delay: 1.0
    }
  ];

  // Stats data
  const stats = [
    { number: "99.9%", text: "System Uptime", icon: <Activity size={24} />, color: colors.success },
    { number: "∞", text: "Processing Power", icon: <Cpu size={24} />, color: colors.primary },
    { number: "10K+", text: "Neural Nodes", icon: <Network size={24} />, color: colors.secondary },
    { number: "24/7", text: "AI Monitoring", icon: <Eye size={24} />, color: colors.accent }
  ];

  // System initialization sequence with enhanced animations
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setInitProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          setTimeout(() => setShowInitOverlay(false), 800);
          setTimeout(() => setSystemOnline(true), 1200);
          return 100;
        }
        return prev + 2;
      });
    }, 80);

    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 12000);
    
    return () => {
      clearInterval(progressTimer);
      clearInterval(glitchTimer);
    };
  }, []);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'student':
          navigate('/student/dashboard');
          break;
        case 'teacher':
          navigate('/teacher/dashboard');
          break;
        case 'hod':
          navigate('/hod/dashboard');
          break;
        default:
          break;
      }
    }
  }, [user, navigate]);

  // Advanced particle system for background effects
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 120; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          speed: Math.random() * 3 + 0.5,
          opacity: Math.random() * 0.6 + 0.2,
          size: Math.random() * 4 + 1,
          color: i % 4 === 0 ? colors.primary : i % 4 === 1 ? colors.secondary : i % 4 === 2 ? colors.accent : colors.success,
          char: String.fromCharCode(0x30A0 + Math.random() * 96),
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2
        });
      }
      setParticleSystem(newParticles);
    };

    createParticles();
    const interval = setInterval(() => {
      setParticleSystem(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > window.innerHeight ? -20 : particle.y + particle.speed,
        opacity: Math.sin(Date.now() * 0.001 + particle.id) * 0.4 + 0.3,
        rotation: particle.rotation + particle.rotationSpeed,
        x: particle.x + Math.sin(Date.now() * 0.002 + particle.id) * 0.5
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // AI typing effect for hero text
  useEffect(() => {
    if (!systemOnline) return;
    
    const currentMessage = messages[textIndex % messages.length];
    const typingInterval = setInterval(() => {
      setDisplayText(prev => {
        if (prev.length < currentMessage.length) {
          return currentMessage.slice(0, prev.length + 1);
        } else {
          setTimeout(() => {
            setDisplayText('');
            setTextIndex(prev => prev + 1);
          }, 3000);
          return prev;
        }
      });
    }, 80);

    return () => clearInterval(typingInterval);
  }, [textIndex, systemOnline]);

  // Advanced mouse tracking for parallax and magnetic effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = (e.clientX - rect.left - centerX) / centerX;
        const y = (e.clientY - rect.top - centerY) / centerY;
        
        setMousePosition({ x: x * 50, y: y * 50 });
        
        // Create magnetic field effect
        const magneticField = {
          id: Date.now(),
          x: e.clientX,
          y: e.clientY,
          strength: 1
        };
        
        setMagneticFields(prev => [...prev.slice(-5), magneticField]);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Click ripple effects
  const createRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ripple = {
      id: Date.now(),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      size: 0
    };
    
    setRipples(prev => [...prev, ripple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 1000);
  };

  // Scanning progress animation
  useEffect(() => {
    if (systemOnline) {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 1));
      }, 80);
      return () => clearInterval(interval);
    }
  }, [systemOnline]);

  // Enhanced scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen overflow-hidden text-white relative transition-all duration-1000 ${
        glitchActive ? 'animate-pulse' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary}15 30%, ${colors.secondary}15 70%, ${colors.dark} 100%)`
      }}
    >
      {/* System Initialization Overlay */}
      {showInitOverlay && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
          <div className="text-center relative">
            {/* Holographic loading ring */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-cyan-400/30 rounded-full"></div>
              <div 
                className="absolute inset-0 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin"
                style={{ animationDuration: '1s' }}
              ></div>
              <div 
                className="absolute inset-2 border-2 border-transparent border-r-purple-400 rounded-full animate-spin"
                style={{ animationDuration: '2s', animationDirection: 'reverse' }}
              ></div>
              <Cpu className="absolute top-1/2 left-1/2 w-12 h-12 text-cyan-400 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 mb-6 font-mono animate-pulse">
              E-F-G MATRIX
            </h1>
            
            {/* Progress bar with holographic effect */}
            <div className="w-80 h-3 bg-gray-800 rounded-full overflow-hidden mb-4 border border-cyan-400/50">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-300 relative"
                style={{ width: `${initProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
              </div>
            </div>
            
            <p className="text-cyan-300 font-mono text-lg mb-2">
              INITIALIZING QUANTUM PROTOCOLS...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              <span className="text-cyan-300 font-mono ml-2">{initProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Matrix Rain Particles */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {particleSystem.map(particle => (
          <div
            key={particle.id}
            className="absolute text-xs font-mono transition-all duration-200"
            style={{
              left: particle.x,
              top: particle.y,
              color: particle.color,
              opacity: particle.opacity,
              fontSize: `${particle.size * 3}px`,
              transform: `rotate(${particle.rotation}deg) scale(${Math.sin(Date.now() * 0.005 + particle.id) * 0.3 + 1})`,
              textShadow: `0 0 10px ${particle.color}80`
            }}
          >
            {particle.char}
          </div>
        ))}
      </div>

      {/* Dynamic Holographic Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <svg width="100%" height="100%" className="opacity-15">
          <defs>
            <pattern id="dynamicGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path 
                d="M 60 0 L 0 0 0 60" 
                fill="none" 
                stroke={colors.primary} 
                strokeWidth="1"
                style={{
                  filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.5))'
                }}
              />
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3"/>
              <stop offset="50%" stopColor={colors.secondary} stopOpacity="0.2"/>
              <stop offset="100%" stopColor={colors.accent} stopOpacity="0.3"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#dynamicGrid)" />
          <rect width="100%" height="100%" fill="url(#gridGradient)" />
        </svg>
      </div>

      {/* Enhanced Floating Geometric Shapes */}
      <div className="fixed inset-0 pointer-events-none z-5">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute border-2 opacity-20"
            style={{
              width: `${40 + i * 15}px`,
              height: `${40 + i * 15}px`,
              borderColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent,
              left: `${5 + i * 8}%`,
              top: `${10 + i * 6}%`,
              transform: `rotate(${i * 30}deg) translate(${mousePosition.x * (i + 1) * 0.05}px, ${mousePosition.y * (i + 1) * 0.05}px) scale(${Math.sin(Date.now() * 0.001 + i) * 0.2 + 1})`,
              borderRadius: i % 4 === 0 ? '50%' : i % 4 === 1 ? '0' : i % 4 === 2 ? '25%' : '10px',
              animation: `float-complex-${i} ${10 + i * 2}s ease-in-out infinite`,
              transition: 'transform 0.3s ease-out',
              boxShadow: `0 0 20px ${i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent}30`
            }}
          />
        ))}
      </div>

      {/* Enhanced Scanning Line Effect */}
      <div 
        className="fixed left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 z-20 pointer-events-none"
        style={{
          top: `${scanProgress}%`,
          transition: 'top 0.1s linear',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.8), 0 0 60px rgba(6, 182, 212, 0.4)'
        }}
      />

      {/* Ripple Effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-30"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: '4px',
            height: '4px',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="absolute inset-0 border-2 border-cyan-400 rounded-full animate-ping"
            style={{
              animation: 'ripple 1s ease-out'
            }}
          />
        </div>
      ))}

      {/* Main Content */}
      <div className={`relative z-20 transition-all duration-1500 ${systemOnline ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
        
        {/* Enhanced Navigation Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-30">
          <div className="flex justify-between items-center">
            {/* System Status */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-mono text-green-400">SYSTEM ONLINE</span>
              <div className="w-px h-4 bg-green-400/50 mx-2" />
              <span className="text-xs font-mono text-gray-400">v3.14.159</span>
            </div>

            {/* Enhanced Logo/Brand */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping" />
                <Cpu className="text-cyan-400 animate-spin relative z-10" size={36} style={{animationDuration: '3s'}} />
                <div className="absolute inset-0 border-2 border-purple-400/50 rounded-full animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold font-mono hidden md:block bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                E-F-G MATRIX
              </h1>
            </div>

            {/* Enhanced AI Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-mono">
                <Terminal className="text-purple-400 animate-pulse" size={16} />
                <span className="text-purple-400">AI NEURAL ACTIVE</span>
              </div>
              <div className="w-px h-4 bg-purple-400/50" />
              <div className="text-xs font-mono text-gray-400">
                {Math.floor(Date.now() / 1000)} Hz
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 relative">
          
          {/* Hero Content */}
          <div className="text-center max-w-5xl mx-auto">
            
            {/* Enhanced Main Title */}
            <div className="mb-12">
              <h1 className="text-8xl md:text-9xl font-bold mb-6 font-mono relative">
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 relative z-10"
                  style={{
                    animation: 'textGlow 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 30px rgba(6, 182, 212, 0.5))'
                  }}
                >
                  E-F-G
                </span>
                <div className="absolute inset-0 text-cyan-400/20 blur-sm">E-F-G</div>
              </h1>
              <h2 className="text-3xl md:text-5xl font-light text-gray-300 mb-8 font-mono">
                Educational Feedback Galaxy
              </h2>
              <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto mb-8" />
            </div>

            {/* Enhanced AI Typing Display */}
            <div className="mb-16 h-12 flex items-center justify-center">
              <div className="border border-cyan-400/50 bg-black/50 px-6 py-3 font-mono text-lg rounded backdrop-blur-sm">
                <span className="text-cyan-300">&gt; </span>
                <span className="text-green-400">{displayText}</span>
                <span className="animate-pulse ml-1 text-cyan-400">█</span>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mb-20">
              
              {/* Enhanced Login Button */}
              <Link to="/login" state={{ tab: 'login' }}>
                <div 
                  className={`group relative overflow-hidden border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-700 cursor-pointer ${
                    loginHovered ? 'scale-110 shadow-2xl shadow-cyan-400/50' : 'scale-100'
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 25px) 0, 100% 100%, 25px 100%)',
                    padding: '20px 40px',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={() => setLoginHovered(true)}
                  onMouseLeave={() => setLoginHovered(false)}
                  onClick={createRipple}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <User className="text-cyan-400" size={24} />
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping" />
                    </div>
                    <span className="text-cyan-400 font-bold font-mono text-lg">ACCESS PORTAL</span>
                    <ArrowRight className={`text-cyan-400 transition-transform duration-500 ${
                      loginHovered ? 'translate-x-3 scale-110' : ''
                    }`} size={24} />
                  </div>
                  
                  {/* Enhanced animated border effect */}
                  <div className="absolute inset-0 border-2 border-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 25px) 0, 100% 100%, 25px 100%)',
                      animation: loginHovered ? 'borderPulse 1s infinite' : 'none'
                    }}
                  />
                  
                  {/* Magnetic field effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </Link>

              {/* Enhanced Register Button */}
              <Link to="/login" state={{ tab: 'register' }}>
                <div 
                  className={`group relative overflow-hidden border-2 border-purple-400 bg-purple-400/10 hover:bg-purple-400/20 transition-all duration-700 cursor-pointer ${
                    signupHovered ? 'scale-110 shadow-2xl shadow-purple-400/50' : 'scale-100'
                  }`}
                  style={{
                    clipPath: 'polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)',
                    padding: '20px 40px',
                    backdropFilter: 'blur(10px)'
                  }}
                  onMouseEnter={() => setSignupHovered(true)}
                  onMouseLeave={() => setSignupHovered(false)}
                  onClick={createRipple}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Rocket className="text-purple-400" size={24} />
                      <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping" />
                    </div>
                    <span className="text-purple-400 font-bold font-mono text-lg">INITIALIZE PROFILE</span>
                    <Sparkles className={`text-purple-400 transition-transform duration-500 ${
                      signupHovered ? 'rotate-180 scale-110' : ''
                    }`} size={24} />
                  </div>
                  
                  {/* Enhanced animated border effect */}
                  <div className="absolute inset-0 border-2 border-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      clipPath: 'polygon(25px 0, 100% 0, calc(100% - 25px) 100%, 0 100%)',
                      animation: signupHovered ? 'borderPulse 1s infinite' : 'none'
                    }}
                  />
                  
                  {/* Magnetic field effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
              </Link>
            </div>

            {/* Enhanced System Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center mb-12">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="relative p-6 border border-gray-700 bg-gray-900/30 backdrop-blur-sm hover:bg-gray-800/50 transition-all duration-500 group"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% calc(100% - 15px), 15px 100%)',
                    animation: `fadeInUp 1s ease-out ${index * 0.2}s both`
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div 
                      className="relative p-3 rounded border group-hover:scale-110 transition-transform duration-500"
                      style={{ 
                        borderColor: stat.color,
                        color: stat.color,
                        boxShadow: `0 0 20px ${stat.color}30`
                      }}
                    >
                      {stat.icon}
                      <div className="absolute inset-0 bg-current opacity-10 rounded animate-pulse" />
                    </div>
                    <div 
                      className="text-3xl font-bold font-mono group-hover:scale-105 transition-transform duration-500" 
                      style={{ 
                        color: stat.color,
                        textShadow: `0 0 10px ${stat.color}50`
                      }}
                    >
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      {stat.text}
                    </div>
                  </div>
                  
                  {/* Enhanced animated border */}
                  <div 
                    className="absolute inset-0 border opacity-0 group-hover:opacity-50 transition-opacity duration-500"
                    style={{
                      borderColor: stat.color,
                      clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% calc(100% - 15px), 15px 100%)',
                      animation: 'borderGlow 2s ease-in-out infinite'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
            <div className="text-cyan-400 mb-2 text-sm font-mono animate-pulse">SCROLL TO EXPLORE</div>
            <div className="relative">
              <ChevronDown className="text-cyan-400 animate-bounce" size={32} />
              <div className="absolute inset-0 text-cyan-400/50 blur-sm animate-bounce">
                <ChevronDown size={32} />
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-7xl mx-auto">
            
            {/* Enhanced Section Header */}
            <div className="text-center mb-20">
              <h2 className="text-6xl md:text-7xl font-bold font-mono mb-6 relative">
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
                  style={{
                    animation: 'textShimmer 4s ease-in-out infinite'
                  }}
                >
                  CORE SYSTEMS
                </span>
                <div className="absolute inset-0 text-cyan-400/10 blur-md">CORE SYSTEMS</div>
              </h2>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                Advanced educational technologies powered by quantum computing, neural networks, and AI-driven analytics for the next generation of learning experiences
              </p>
              <div className="w-48 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mx-auto mt-8" />
            </div>

            {/* Enhanced Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="group relative p-8 border border-gray-700 bg-gray-900/30 backdrop-blur-sm hover:border-cyan-400 transition-all duration-700 hover:scale-105 hover:rotate-1"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% calc(100% - 20px), 20px 100%)',
                    animation: `slideInUp 1s ease-out ${feature.delay}s both`
                  }}
                >
                  <div className="flex flex-col items-center text-center gap-6">
                    <div 
                      className="relative p-6 rounded border-2 group-hover:animate-pulse group-hover:scale-110 transition-all duration-500"
                      style={{ 
                        borderColor: feature.color,
                        color: feature.color,
                        background: `linear-gradient(135deg, ${feature.color}10, transparent)`,
                        boxShadow: `0 0 30px ${feature.color}20`
                      }}
                    >
                      {feature.icon}
                      <div className="absolute inset-0 border-2 border-current opacity-30 rounded animate-ping" />
                    </div>
                    
                    <h3 className="text-2xl font-bold font-mono text-white group-hover:text-cyan-400 transition-colors duration-500">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors duration-500">
                      {feature.description}
                    </p>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000 group-hover:w-full"
                        style={{
                          background: `linear-gradient(90deg, ${feature.color}, ${feature.color}80)`,
                          width: '60%'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Enhanced hover effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}40, transparent)`,
                      clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% calc(100% - 20px), 20px 100%)'
                    }}
                  />
                  
                  {/* Magnetic field visualization */}
                  <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div 
                      className="absolute inset-0 border border-current rounded animate-pulse"
                      style={{
                        borderColor: feature.color,
                        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% calc(100% - 20px), 20px 100%)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action Section */}
        <section className="py-32 px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-6xl md:text-7xl font-bold font-mono mb-12 relative">
              <span 
                className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400"
                style={{
                  animation: 'textPulse 2s ease-in-out infinite'
                }}
              >
                READY TO CONNECT?
              </span>
              <div className="absolute inset-0 text-purple-400/10 blur-lg">READY TO CONNECT?</div>
            </h2>
            
            <p className="text-2xl text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed">
              Join the educational revolution. Access your personalized learning matrix and unlock unlimited potential across the digital universe.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
              <Link to="/login" state={{ tab: 'login' }}>
                <div 
                  className="group relative overflow-hidden border-2 border-cyan-400 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-700 hover:scale-110 cursor-pointer"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 100%, 30px 100%)',
                    padding: '24px 48px',
                    backdropFilter: 'blur(15px)',
                    boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)'
                  }}
                  onClick={createRipple}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Power className="text-cyan-400" size={28} />
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping" />
                    </div>
                    <span className="text-cyan-400 font-bold font-mono text-xl">ENTER THE MATRIX</span>
                    <ArrowRight className="text-cyan-400 group-hover:translate-x-2 transition-transform duration-500" size={28} />
                  </div>
                  
                  {/* Power surge effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform group-hover:translate-x-full" 
                    style={{ transition: 'transform 1s ease-in-out, opacity 0.3s ease-in-out' }}
                  />
                </div>
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Enhanced Custom CSS Animations */}
      <style>{`
        @keyframes float-complex-0 { 0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); } 50% { transform: translateY(-25px) rotate(180deg) scale(1.1); } }
        @keyframes float-complex-1 { 0%, 100% { transform: translateY(0px) rotate(45deg) scale(1); } 50% { transform: translateY(-30px) rotate(225deg) scale(0.9); } }
        @keyframes float-complex-2 { 0%, 100% { transform: translateY(0px) rotate(90deg) scale(1); } 50% { transform: translateY(-20px) rotate(270deg) scale(1.05); } }
        @keyframes float-complex-3 { 0%, 100% { transform: translateY(0px) rotate(135deg) scale(1); } 50% { transform: translateY(-35px) rotate(315deg) scale(0.95); } }
        @keyframes float-complex-4 { 0%, 100% { transform: translateY(0px) rotate(180deg) scale(1); } 50% { transform: translateY(-22px) rotate(360deg) scale(1.08); } }
        @keyframes float-complex-5 { 0%, 100% { transform: translateY(0px) rotate(225deg) scale(1); } 50% { transform: translateY(-28px) rotate(405deg) scale(0.92); } }
        @keyframes float-complex-6 { 0%, 100% { transform: translateY(0px) rotate(270deg) scale(1); } 50% { transform: translateY(-32px) rotate(450deg) scale(1.12); } }
        @keyframes float-complex-7 { 0%, 100% { transform: translateY(0px) rotate(315deg) scale(1); } 50% { transform: translateY(-18px) rotate(495deg) scale(0.88); } }
        @keyframes float-complex-8 { 0%, 100% { transform: translateY(0px) rotate(360deg) scale(1); } 50% { transform: translateY(-26px) rotate(540deg) scale(1.06); } }
        @keyframes float-complex-9 { 0%, 100% { transform: translateY(0px) rotate(405deg) scale(1); } 50% { transform: translateY(-24px) rotate(585deg) scale(0.94); } }
        @keyframes float-complex-10 { 0%, 100% { transform: translateY(0px) rotate(450deg) scale(1); } 50% { transform: translateY(-29px) rotate(630deg) scale(1.09); } }
        @keyframes float-complex-11 { 0%, 100% { transform: translateY(0px) rotate(495deg) scale(1); } 50% { transform: translateY(-21px) rotate(675deg) scale(0.97); } }
        
        @keyframes textGlow { 0%, 100% { filter: drop-shadow(0 0 30px rgba(6, 182, 212, 0.5)); } 50% { filter: drop-shadow(0 0 50px rgba(139, 92, 246, 0.8)); } }
        @keyframes textShimmer { 0%, 100% { background-position: -200% center; } 50% { background-position: 200% center; } }
        @keyframes textPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes borderPulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.02); } }
        @keyframes borderGlow { 0%, 100% { box-shadow: 0 0 5px currentColor; } 50% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; } }
        @keyframes ripple { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(4); opacity: 0; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(50px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default Index;
