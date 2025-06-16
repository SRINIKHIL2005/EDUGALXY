import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Lock, 
  Mail, 
  User, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  Star,
  Globe,
  FileText,
  Scale,
  BookOpen,
  Sparkles,
  Cpu,
  Database,
  Network,
  Radar,
  Power,
  Binary,
  Terminal,
  Layers,
  Activity
} from 'lucide-react';
import { UserRole } from '@/types';
import { auth } from "../types/firebaseConfig";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import TermsOfService from '@/components/legal/TermsOfService';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';
import TermsAndConditions from '@/components/legal/TermsAndConditions';

const googleProvider = new GoogleAuthProvider();

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const defaultTab = location.state?.tab === 'register' ? 'register' : 'login';
  
  // Refs for advanced animations
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<any>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  // Mouse tracking for interactive effects
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  
  // Holographic scanning effect
  const [scanActive, setScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  
  // Matrix rain particles
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    speed: number;
    opacity: number;
    char: string;
  }>>([]);

  // AI typing effect
  const [aiText, setAiText] = useState('');
  const [aiIndex, setAiIndex] = useState(0);
  const aiMessages = [
    'INITIALIZING QUANTUM SECURITY PROTOCOLS...',
    'SCANNING BIOMETRIC AUTHENTICATION...',
    'ENCRYPTING NEURAL PATHWAYS...',
    'ACCESSING SECURE EDUCATIONAL MATRIX...',
    'WELCOME TO THE FUTURE OF LEARNING...'
  ];
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerRole, setRegisterRole] = useState<UserRole>('student');
  const [registerDepartment, setRegisterDepartment] = useState('');
  
  // Email validation state
  const [emailStatus, setEmailStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  
  // CAPTCHA state
  const [captcha] = useState(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return {
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Legal consent state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToConditions, setAgreedToConditions] = useState(false);

  // Auth context
  const { login, register, signInWithGoogle, loading } = useAuth();
  
  // Password strength calculation
  const calculatePasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'NONE' };
    
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    const labels = ['CRITICAL', 'WEAK', 'FAIR', 'GOOD', 'QUANTUM'];
    return { score, label: labels[score] };
  };

  const passwordStrength = calculatePasswordStrength(registerPassword);
  
  // Email uniqueness check
  const checkEmailUniqueness = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailStatus(null);
      return;
    }

    setEmailStatus('checking');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const isAvailable = Math.random() > 0.3;
      setEmailStatus(isAvailable ? 'available' : 'taken');
    } catch (error) {
      console.error('Email check error:', error);
      setEmailStatus(null);
    }
  };

  // Registration validation
  const isRegistrationValid = () => {
    return (
      registerName.trim() &&
      registerEmail &&
      registerPassword &&
      confirmPassword &&
      registerPassword === confirmPassword &&
      registerRole &&
      registerDepartment &&
      parseInt(captchaInput) === captcha.answer &&
      agreedToTerms &&
      agreedToPrivacy &&
      agreedToConditions &&
      passwordStrength.score >= 3
    );
  };

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setLoginError(error.message || 'Authentication failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    
    if (!isRegistrationValid()) {
      setRegisterError('Please complete all required fields correctly');
      return;
    }

    try {
      await register(registerName, registerEmail, registerPassword, registerRole, registerDepartment);
      navigate('/dashboard');
    } catch (error: any) {
      setRegisterError(error.message || 'Registration failed');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await signInWithGoogle(credential.accessToken);
        navigate('/dashboard');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Google sign-in failed');
    }
  };

  // Particle system for matrix rain effect
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          speed: Math.random() * 3 + 1,
          opacity: Math.random(),
          char: String.fromCharCode(0x30A0 + Math.random() * 96)
        });
      }
      setParticles(newParticles);
    };

    createParticles();
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        y: particle.y > window.innerHeight ? -20 : particle.y + particle.speed,
        opacity: Math.sin(Date.now() * 0.001 + particle.id) * 0.5 + 0.5
      })));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // AI typing effect
  useEffect(() => {
    const currentMessage = aiMessages[aiIndex % aiMessages.length];
    const typingInterval = setInterval(() => {
      setAiText(prev => {
        if (prev.length < currentMessage.length) {
          return currentMessage.slice(0, prev.length + 1);
        } else {
          setTimeout(() => {
            setAiText('');
            setAiIndex(prev => prev + 1);
          }, 2000);
          return prev;
        }
      });
    }, 100);

    return () => clearInterval(typingInterval);
  }, [aiIndex]);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const x = (e.clientX - rect.left - centerX) / centerX;
        const y = (e.clientY - rect.top - centerY) / centerY;
        
        setMousePosition({ x: x * 20, y: y * 20 });
        setIsMouseMoving(true);
        
        clearTimeout(mouseRef.current.timeout);
        mouseRef.current.timeout = setTimeout(() => setIsMouseMoving(false), 100);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Holographic scan effect
  useEffect(() => {
    if (scanActive) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setScanActive(false);
            return 0;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [scanActive]);

  // Initialize scanning when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setScanActive(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Debounced email check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (registerEmail) {
        checkEmailUniqueness(registerEmail);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [registerEmail]);

  useEffect(() => {
    setLoginError(null);
    setRegisterError(null);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
    >
      {/* Matrix Rain Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute text-green-400 font-mono text-sm pointer-events-none"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              opacity: particle.opacity,
              textShadow: '0 0 10px rgba(16, 185, 129, 0.8)'
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
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`
        }}
      />

      {/* Scanning Line Effect */}
      {scanActive && (
        <div 
          className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 z-10"
          style={{
            top: `${scanProgress}%`,
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
            transition: 'top 0.05s linear'
          }}
        />
      )}

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute border border-cyan-500/20 animate-pulse"
            style={{
              width: `${60 + i * 20}px`,
              height: `${60 + i * 20}px`,
              left: `${10 + i * 15}%`,
              top: `${10 + i * 10}%`,
              transform: `rotate(${i * 45}deg) translate(${mousePosition.x * (i + 1) * 0.1}px, ${mousePosition.y * (i + 1) * 0.1}px)`,
              borderRadius: i % 2 === 0 ? '50%' : '0',
              animation: `float-${i} ${8 + i * 2}s ease-in-out infinite`,
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)'
            }}
          />
        ))}
      </div>

      {/* Central Interface */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div 
          className="w-full max-w-4xl"
          style={{
            transform: `translateX(${mousePosition.x * 0.02}px) translateY(${mousePosition.y * 0.02}px)`
          }}
        >
          {/* AI Status Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-black/50 backdrop-blur-xl border border-cyan-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
              <span className="text-green-400 font-mono text-sm tracking-wider">
                QUANTUM AI SYSTEM ONLINE
              </span>
              <Activity className="w-4 h-4 text-green-400" />
            </div>
            
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              <span className="inline-flex items-center gap-4">
                <Cpu className="text-cyan-400 animate-spin" size={56} />
                NEURAL GATEWAY
                <Database className="text-purple-400 animate-pulse" size={56} />
              </span>
            </h1>
            
            <div className="text-cyan-300 font-mono text-lg mb-6 h-8 flex items-center justify-center">
              <Terminal className="w-5 h-5 mr-2" />
              <span className="typing-cursor">{aiText}</span>
              <span className="animate-pulse ml-1">|</span>
            </div>

            {/* Status Indicators */}
            <div className="flex justify-center gap-6 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-lg">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-mono">SECURE</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <Network className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-sm font-mono">CONNECTED</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
                <Radar className="w-4 h-4 text-purple-400" />
                <span className="text-purple-300 text-sm font-mono">SCANNING</span>
              </div>
            </div>
          </div>

          {/* Holographic Interface Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-black/50 backdrop-blur-xl border border-cyan-500/30 p-2 rounded-2xl">
              <TabsTrigger 
                value="login" 
                className="relative overflow-hidden rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-blue-500/20 data-[state=active]:text-cyan-300 data-[state=active]:border data-[state=active]:border-cyan-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <User size={18} />
                  <span className="font-mono">NEURAL ACCESS</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="relative overflow-hidden rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:text-purple-300 data-[state=active]:border data-[state=active]:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-center gap-2 relative z-10">
                  <Binary size={18} />
                  <span className="font-mono">QUANTUM REGISTRATION</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Login Tab */}
            <TabsContent value="login">
              <Card className="bg-black/40 backdrop-blur-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 rounded-3xl overflow-hidden relative">
                {/* Holographic border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-blue-500/10 rounded-3xl" />
                
                <CardHeader className="text-center pb-8 relative z-10">
                  <CardTitle className="text-4xl flex items-center justify-center gap-3 mb-4">
                    <div className="relative">
                      <User className="text-cyan-400 animate-pulse" size={40} />
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-full animate-ping" />
                    </div>
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-mono">
                      NEURAL ACCESS
                    </span>
                  </CardTitle>
                  <CardDescription className="text-cyan-300/80 text-lg font-mono">
                    Initialize quantum authentication protocols
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8 relative z-10">
                  {loginError && (
                    <Alert className="bg-red-900/30 border-red-500/50 backdrop-blur-xl">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300 font-mono">{loginError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="flex items-center gap-2 text-cyan-300 font-mono text-lg">
                        <Mail size={18} />
                        NEURAL ID
                      </Label>
                      <div className="relative group">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your neural signature"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-cyan-500/50 text-cyan-100 placeholder-cyan-500/50 font-mono focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/25 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="password" className="flex items-center gap-2 text-cyan-300 font-mono text-lg">
                        <Lock size={18} />
                        QUANTUM KEY
                      </Label>
                      <div className="relative group">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter quantum encryption key"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-cyan-500/50 text-cyan-100 placeholder-cyan-500/50 font-mono focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/25 transition-all duration-300 pr-14"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-10 w-10 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-16 text-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-mono tracking-wider transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-cyan-500/25 relative overflow-hidden group"
                      disabled={loading}
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span>ACCESSING NEURAL NETWORK...</span>
                          </>
                        ) : (
                          <>
                            <Power size={20} />
                            <span>INITIATE NEURAL ACCESS</span>
                            <Sparkles size={20} />
                          </>
                        )}
                      </div>
                      {/* Scanning line effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-cyan-500/30" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-black px-4 text-cyan-400 font-mono tracking-wider">
                        ALTERNATIVE PROTOCOLS
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGoogleSignIn} 
                    variant="outline"
                    className="w-full h-14 text-lg border-2 border-purple-500/50 bg-purple-900/20 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 font-mono transition-all duration-300 transform hover:scale-105"
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={22} className="text-purple-400" />
                      <span>GOOGLE QUANTUM LINK</span>
                    </div>
                  </Button>

                  <div className="text-center pt-6">
                    <div className="flex justify-center gap-6 text-sm">
                      <Link to="/security" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-mono transition-colors">
                        <Shield size={16} />
                        SECURITY MATRIX
                      </Link>
                      <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2 font-mono transition-colors">
                        <FileText size={16} />
                        PRIVACY PROTOCOLS
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Registration Tab - Complete Implementation */}
            <TabsContent value="register">
              <Card className="bg-black/40 backdrop-blur-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 rounded-3xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl" />
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <CardTitle className="text-4xl flex items-center justify-center gap-3 mb-4">
                    <div className="relative">
                      <Binary className="text-purple-400 animate-pulse" size={40} />
                      <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
                      QUANTUM REGISTRATION
                    </span>
                  </CardTitle>
                  <CardDescription className="text-purple-300/80 text-lg font-mono">
                    Initialize new neural pathway with quantum encryption
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6 relative z-10 max-h-[70vh] overflow-y-auto scrollbar-hide">
                  {registerError && (
                    <Alert className="bg-red-900/30 border-red-500/50 backdrop-blur-xl">
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300 font-mono">{registerError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={handleRegister} className="space-y-6">
                    {/* Full Name Field */}
                    <div className="space-y-3">
                      <Label htmlFor="registerName" className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <User size={18} />
                        NEURAL IDENTITY
                      </Label>
                      <div className="relative group">
                        <Input
                          id="registerName"
                          type="text"
                          placeholder="Enter your quantum signature"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 placeholder-purple-500/50 font-mono focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/25 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-3">
                      <Label htmlFor="registerEmail" className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <Mail size={18} />
                        QUANTUM MAIL ADDRESS
                      </Label>
                      <div className="relative group">
                        <Input
                          id="registerEmail"
                          type="email"
                          placeholder="neural@quantum.matrix"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 placeholder-purple-500/50 font-mono focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/25 transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        {emailStatus && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {emailStatus === 'checking' && (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                            )}
                            {emailStatus === 'available' && (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            )}
                            {emailStatus === 'taken' && (
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Password Field */}
                    <div className="space-y-3">
                      <Label htmlFor="registerPassword" className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <Lock size={18} />
                        QUANTUM ENCRYPTION KEY
                      </Label>
                      <div className="relative group">
                        <Input
                          id="registerPassword"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Create quantum encryption sequence"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 placeholder-purple-500/50 font-mono focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/25 transition-all duration-300 pr-14"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-10 w-10 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                      
                      {/* Password Strength Indicator */}
                      {registerPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-purple-300 font-mono">ENCRYPTION STRENGTH</span>
                            <Badge 
                              variant={passwordStrength.score >= 3 ? "default" : "secondary"}
                              className={`font-mono ${
                                passwordStrength.score >= 4 ? 'bg-green-900/50 text-green-300 border-green-500/50' :
                                passwordStrength.score >= 3 ? 'bg-yellow-900/50 text-yellow-300 border-yellow-500/50' :
                                'bg-red-900/50 text-red-300 border-red-500/50'
                              }`}
                            >
                              {passwordStrength.label}
                            </Badge>
                          </div>
                          <Progress 
                            value={passwordStrength.score * 20} 
                            className="h-2 bg-purple-900/50"
                          />
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-3">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <Shield size={18} />
                        VERIFY QUANTUM KEY
                      </Label>
                      <div className="relative group">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm quantum encryption sequence"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 placeholder-purple-500/50 font-mono focus:border-purple-400 focus:shadow-lg focus:shadow-purple-400/25 transition-all duration-300 pr-14"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-10 w-10 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </Button>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                      {confirmPassword && registerPassword !== confirmPassword && (
                        <Alert className="bg-red-900/30 border-red-500/50">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <AlertDescription className="text-red-300 font-mono text-sm">
                            QUANTUM KEYS DO NOT MATCH
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <Network size={18} />
                        NEURAL CLASSIFICATION
                      </Label>
                      <Select value={registerRole} onValueChange={(value) => setRegisterRole(value as UserRole)}>
                        <SelectTrigger className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 font-mono focus:border-purple-400">
                          <SelectValue placeholder="Select your neural type" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 backdrop-blur-xl border-purple-500/50">
                          <SelectItem value="student" className="text-purple-300 font-mono focus:bg-purple-500/20">
                            LEARNING NODE
                          </SelectItem>
                          <SelectItem value="teacher" className="text-purple-300 font-mono focus:bg-purple-500/20">
                            KNOWLEDGE DISTRIBUTOR
                          </SelectItem>
                          <SelectItem value="hod" className="text-purple-300 font-mono focus:bg-purple-500/20">
                            DEPARTMENT COORDINATOR
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Department Selection */}
                    {(registerRole === 'student' || registerRole === 'teacher' || registerRole === 'hod') && (
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                          <Database size={18} />
                          NEURAL SECTOR
                        </Label>
                        <Select value={registerDepartment} onValueChange={setRegisterDepartment}>
                          <SelectTrigger className="h-14 text-lg bg-black/50 border-purple-500/50 text-purple-100 font-mono focus:border-purple-400">
                            <SelectValue placeholder="Select your neural sector" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 backdrop-blur-xl border-purple-500/50">
                            <SelectItem value="cse" className="text-purple-300 font-mono focus:bg-purple-500/20">
                              COMPUTATIONAL SYSTEMS
                            </SelectItem>
                            <SelectItem value="ece" className="text-purple-300 font-mono focus:bg-purple-500/20">
                              ELECTRONIC CIRCUITS
                            </SelectItem>
                            <SelectItem value="mech" className="text-purple-300 font-mono focus:bg-purple-500/20">
                              MECHANICAL ENGINEERING
                            </SelectItem>
                            <SelectItem value="civil" className="text-purple-300 font-mono focus:bg-purple-500/20">
                              STRUCTURAL SYSTEMS
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* CAPTCHA */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-purple-300 font-mono text-lg">
                        <Radar size={18} />
                        ANTI-BOT VERIFICATION
                      </Label>
                      <div className="p-6 bg-black/30 border border-purple-500/30 rounded-xl">
                        <div className="text-center mb-4">
                          <div className="text-2xl font-mono text-purple-300 bg-purple-900/30 px-4 py-2 rounded border border-purple-500/50 inline-block">
                            {captcha.question}
                          </div>
                        </div>
                        <Input
                          type="number"
                          placeholder="Enter verification result"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          required
                          className="h-12 text-center text-lg bg-black/50 border-purple-500/50 text-purple-100 placeholder-purple-500/50 font-mono focus:border-purple-400"
                        />
                      </div>
                    </div>

                    {/* Legal Consents */}
                    <div className="space-y-4 p-6 bg-purple-900/10 border border-purple-500/30 rounded-xl">
                      <h3 className="text-purple-300 font-mono text-lg flex items-center gap-2">
                        <Scale size={18} />
                        QUANTUM LEGAL PROTOCOLS
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="terms"
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                            className="border-purple-500/50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="text-sm text-purple-300">
                            <Label htmlFor="terms" className="font-mono cursor-pointer">
                              I agree to the{' '}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-purple-400 hover:text-purple-300 font-mono">
                                    Terms of Service
                                  </Button>
                                </DialogTrigger>
                                <TermsOfService isOpen={true} onClose={() => {}} />
                              </Dialog>
                            </Label>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="privacy"
                            checked={agreedToPrivacy}
                            onCheckedChange={(checked) => setAgreedToPrivacy(checked === true)}
                            className="border-purple-500/50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="text-sm text-purple-300">
                            <Label htmlFor="privacy" className="font-mono cursor-pointer">
                              I agree to the{' '}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-purple-400 hover:text-purple-300 font-mono">
                                    Privacy Policy
                                  </Button>
                                </DialogTrigger>
                                <PrivacyPolicy isOpen={true} onClose={() => {}} />
                              </Dialog>
                            </Label>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="conditions"
                            checked={agreedToConditions}
                            onCheckedChange={(checked) => setAgreedToConditions(checked === true)}
                            className="border-purple-500/50 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                          />
                          <div className="text-sm text-purple-300">
                            <Label htmlFor="conditions" className="font-mono cursor-pointer">
                              I agree to the{' '}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="link" className="p-0 h-auto text-purple-400 hover:text-purple-300 font-mono">
                                    Terms and Conditions
                                  </Button>
                                </DialogTrigger>
                                <TermsAndConditions isOpen={true} onClose={() => {}} />
                              </Dialog>
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full h-16 text-lg bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-mono tracking-wider transition-all duration-500 transform hover:scale-105 shadow-2xl shadow-purple-500/25 relative overflow-hidden group"
                      disabled={loading || !isRegistrationValid()}
                    >
                      <div className="relative z-10 flex items-center gap-3">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span>CREATING NEURAL PATHWAY...</span>
                          </>
                        ) : (
                          <>
                            <Layers size={20} />
                            <span>ESTABLISH QUANTUM IDENTITY</span>
                            <Sparkles size={20} />
                          </>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </Button>
                  </form>

                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-purple-500/30" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-black px-4 text-purple-400 font-mono tracking-wider">
                        ALTERNATIVE PROTOCOLS
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGoogleSignIn} 
                    variant="outline"
                    className="w-full h-14 text-lg border-2 border-pink-500/50 bg-pink-900/20 text-pink-300 hover:bg-pink-500/20 hover:border-pink-400 font-mono transition-all duration-300 transform hover:scale-105"
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <Globe size={22} className="text-pink-400" />
                      <span>GOOGLE QUANTUM LINK</span>
                    </div>
                  </Button>

                  <div className="text-center pt-6">
                    <div className="flex justify-center gap-6 text-sm">
                      <Link to="/security" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 font-mono transition-colors">
                        <Shield size={16} />
                        SECURITY MATRIX
                      </Link>
                      <Link to="/privacy" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 font-mono transition-colors">
                        <FileText size={16} />
                        PRIVACY PROTOCOLS
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Global Styles for Futuristic Animations */}
      <style>{`
        @keyframes float-0 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(180deg); } }
        @keyframes float-1 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-25px) rotate(90deg); } }
        @keyframes float-2 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(270deg); } }
        @keyframes float-3 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-30px) rotate(45deg); } }
        @keyframes float-4 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-18px) rotate(135deg); } }
        @keyframes float-5 { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-22px) rotate(225deg); } }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .typing-cursor {
          background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.8), transparent);
          background-size: 200% 100%;
          animation: typing-glow 2s ease-in-out infinite;
        }
        
        @keyframes typing-glow {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Login;
