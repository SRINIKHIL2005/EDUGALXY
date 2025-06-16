import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, Star, Award, Trophy, Users, BookOpen, Calendar, Check, Sparkles,
  Cpu, Database, Network, Radar, Power, Binary, Terminal, Layers, Activity,
  Shield, Lock, Mail, User, Globe, FileText, Zap, Brain, Rocket, Eye
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

  // System initialization sequence
  useEffect(() => {
    const initTimer = setTimeout(() => setSystemOnline(true), 2000);
    const glitchTimer = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);
    
    return () => {
      clearTimeout(initTimer);
      clearInterval(glitchTimer);
    };
  }, []);

  // Particle system for background effects
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 80; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          speed: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.5 + 0.2,
          size: Math.random() * 3 + 1,
          color: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent,
          char: String.fromCharCode(0x30A0 + Math.random() * 96)
        });
      }
      setParticleSystem(newParticles);
    };

    createParticles();
    const interval = setInterval(() => {
      setParticleSystem(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > window.innerHeight ? -20 : particle.y + particle.speed,
        opacity: Math.sin(Date.now() * 0.001 + particle.id) * 0.3 + 0.2
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // AI typing effect for hero text
  useEffect(() => {
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
    }, 100);

    return () => clearInterval(typingInterval);
  }, [textIndex]);

  // Mouse tracking for advanced parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = (e.clientX - rect.left - centerX) / centerX;
        const y = (e.clientY - rect.top - centerY) / centerY;
        
        setMousePosition({ x: x * 30, y: y * 30 });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scanning progress animation
  useEffect(() => {
    if (systemOnline) {
      const interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 1));
      }, 100);
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
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
    >
      {/* System Initialization Overlay */}
      {!systemOnline && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <Cpu className="text-cyan-400 animate-spin mx-auto" size={64} />
            </div>
            <div className="text-cyan-400 font-mono text-xl mb-4">
              INITIALIZING NEURAL EDUCATION MATRIX...
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      )}

      {/* Matrix Rain Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particleSystem.map(particle => (
          <div
            key={particle.id}
            className="absolute font-mono text-sm pointer-events-none"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              opacity: particle.opacity,
              color: particle.color,
              textShadow: `0 0 10px ${particle.color}`,
              fontSize: `${particle.size * 4}px`
            }}
          >
            {particle.char}
          </div>
        ))}
      </div>

      {/* Holographic Grid Background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`
        }}
      />

      {/* Scanning Line Effect */}
      {systemOnline && (
        <div 
          className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-10"
          style={{
            top: `${scanProgress}%`,
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
            transition: 'top 0.1s linear'
          }}
        />
      )}

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute border border-cyan-500/20 animate-pulse"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${5 + i * 12}%`,
              top: `${5 + i * 10}%`,
              transform: `rotate(${i * 45}deg) translate(${mousePosition.x * (i + 1) * 0.1}px, ${mousePosition.y * (i + 1) * 0.1}px)`,
              borderRadius: i % 2 === 0 ? '50%' : '0',
              animation: `float-${i % 6} ${8 + i * 2}s ease-in-out infinite`,
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className={`relative z-20 min-h-screen flex items-center justify-center p-4 transition-opacity duration-1000 ${systemOnline ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="w-full max-w-6xl text-center"
          style={{
            transform: `translateX(${mousePosition.x * 0.02}px) translateY(${mousePosition.y * 0.02}px)`
          }}
        >
          {/* Status Header */}
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-3 bg-black/50 backdrop-blur-xl border border-cyan-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
            <span className="text-green-400 font-mono text-sm tracking-wider">
              NEURAL EDUCATION MATRIX ONLINE
            </span>
            <Activity className="w-4 h-4 text-green-400" />
          </div>

          {/* Main Title */}
          <h1 className={`text-7xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent ${glitchActive ? 'animate-pulse' : ''}`}>
            <span className="inline-flex items-center gap-6">
              <Cpu className="text-cyan-400 animate-spin" size={80} />
              E-F-G
              <Database className="text-purple-400 animate-pulse" size={80} />
            </span>
          </h1>

          {/* Subtitle */}
          <h2 className="text-3xl md:text-4xl font-mono text-cyan-300 mb-4">
            EDUCATIONAL FEEDBACK GALAXY
          </h2>

          {/* AI Status Display */}
          <div className="text-cyan-300 font-mono text-lg mb-8 h-8 flex items-center justify-center">
            <Terminal className="w-5 h-5 mr-2" />
            <span>{displayText}</span>
            <span className="animate-pulse ml-1">|</span>
          </div>

          {/* Description */}
          <p className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            A quantum-powered platform connecting students, teachers, and administrators through 
            advanced neural pathways. Experience the future of education with AI-driven feedback systems, 
            biometric authentication, and real-time performance analytics.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Button
              asChild
              size="lg"
              className={`h-16 px-12 text-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-mono tracking-wider transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-cyan-500/25 relative overflow-hidden group ${
                loginHovered ? 'scale-105 shadow-cyan-500/50' : ''
              }`}
              onMouseEnter={() => setLoginHovered(true)}
              onMouseLeave={() => setLoginHovered(false)}
            >
              <Link to="/login">
                <div className="relative z-10 flex items-center gap-3">
                  <Power size={20} className="group-hover:animate-spin" />
                  <span>NEURAL ACCESS</span>
                  <Sparkles size={20} className="group-hover:animate-bounce" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="absolute inset-0 border-2 border-cyan-400/0 group-hover:border-cyan-400/50 rounded-lg transition-all duration-300"></div>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className={`h-16 px-12 text-lg border-2 border-purple-500/50 bg-purple-900/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 font-mono transition-all duration-300 transform hover:scale-105 relative overflow-hidden group ${
                signupHovered ? 'scale-105 border-purple-400/70' : ''
              }`}
              onMouseEnter={() => setSignupHovered(true)}
              onMouseLeave={() => setSignupHovered(false)}
            >
              <Link to="/login" state={{ tab: 'register' }}>
                <div className="flex items-center gap-3 relative z-10">
                  <Binary size={20} className="group-hover:animate-pulse" />
                  <span>QUANTUM REGISTRATION</span>
                  <Layers size={20} className="group-hover:animate-bounce" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </Link>
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3 px-6 py-3 bg-black/30 border border-gray-500/30 rounded-lg backdrop-blur-sm">
                <div style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="text-left">
                  <div className="text-white font-mono text-lg font-bold">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center animate-bounce">
          <p className="mb-2 text-sm font-mono">EXPLORE NEURAL MATRIX</p>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6">
              QUANTUM CAPABILITIES
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced neural technologies powering the next generation of educational experiences
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-black/40 backdrop-blur-2xl border border-gray-500/30 shadow-2xl rounded-3xl overflow-hidden relative group hover:border-cyan-500/50 transition-all duration-500 p-8"
                style={{
                  transform: `translateY(${Math.max(0, scrollY * 0.1 - index * 20)}px)`,
                  opacity: scrollY > 200 ? 1 : 0,
                  transitionDelay: `${feature.delay}s`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5 rounded-3xl" />
                
                <div className="relative z-10">
                  <div 
                    className="p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-500"
                    style={{ 
                      backgroundColor: `${feature.color}20`,
                      border: `2px solid ${feature.color}30`
                    }}
                  >
                    <div style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 font-mono">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  
                  <div 
                    className="w-16 h-1 mt-6 rounded-full transition-all duration-500 group-hover:w-32"
                    style={{ 
                      backgroundColor: feature.color,
                      boxShadow: `0 0 20px ${feature.color}80`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative z-20 py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-black/50 backdrop-blur-2xl border border-cyan-500/30 rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 rounded-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6">
                ACTIVATE YOUR NEURAL PATHWAY
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of educational institutions already using our quantum-powered platform 
                to revolutionize learning experiences.
              </p>
              
              <Button
                asChild
                size="lg"
                className="h-16 px-12 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-mono tracking-wider transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-purple-500/25 relative overflow-hidden group"
              >
                <Link to="/login" state={{ tab: 'register' }}>
                  <div className="relative z-10 flex items-center gap-3">
                    <Rocket size={20} className="group-hover:animate-bounce" />
                    <span>BEGIN NEURAL INTEGRATION</span>
                    <Sparkles size={20} className="group-hover:animate-spin" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Global Styles */}
      <style>{`
        @keyframes float-0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-25px) rotate(90deg); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(270deg); } }
        @keyframes float-3 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(45deg); } }
        @keyframes float-4 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(135deg); } }
        @keyframes float-5 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-22px) rotate(225deg); } }
      `}</style>
    </div>
  );
};

export default Index;
