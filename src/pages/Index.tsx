import React, { useState, useEffect, useRef, useMemo, CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ChevronDown, Star, Award, Trophy, Users, BookOpen, Calendar, Check, Sparkles } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showParticles, setShowParticles] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const parallaxRef = useRef(null);
  const sectionRefs = {
    hero: useRef(null),
    features: useRef(null),
    testimonials: useRef(null),
    cta: useRef(null),
  };
  
  // Gamification elements
  const [achievements] = useState([
    { id: 1, name: 'Explorer', description: 'Visited all sections', icon: <Star size={20} /> },
    { id: 2, name: 'Enthusiast', description: 'Engaged with content', icon: <Trophy size={20} /> },
    { id: 3, name: 'Curious Mind', description: 'Hovered over interactive elements', icon: <Award size={20} /> },
  ]);
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  // Colors
  const colors = {
    primary: '#4F46E5', // Indigo
    secondary: '#10B981', // Emerald
    accent: '#8B5CF6', // Violet
    dark: '#1F2937', // Gray-800
    light: '#F9FAFB', // Gray-50
    accentButton: '#FF6B6B', // Coral for Learn More button
  };

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

  // Scroll effects with slower animation
  useEffect(() => {
    const handleScroll = () => {
      // Slow down scroll effect by dividing by a larger number
      setScrollY(window.scrollY / 3);
      
      // Determine active section based on scroll position with a more generous threshold
      for (const [section, ref] of Object.entries(sectionRefs)) {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.6 && rect.bottom >= window.innerHeight * 0.3) {
            if (activeSection !== section) {
              setActiveSection(section);
            }
            break;
          }
        }
      }
      
      // Unlock "Explorer" achievement if scrolled to bottom
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        unlockAchievement(1);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);
  
  // Mouse movement for parallax effect - slowed down
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: e.clientX / 75, 
        y: e.clientY / 75 
      });
    };
    
    let ticking = false;
    const throttledMouseMove = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMouseMove(e);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('mousemove', throttledMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', throttledMouseMove);
  }, []);
  
  // Function to unlock achievements
  const unlockAchievement = (id) => {
    if (!unlockedAchievements.includes(id)) {
      const achievement = achievements.find(a => a.id === id);
      setUnlockedAchievements(prev => [...prev, id]);
      setCurrentAchievement(achievement);
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 4000);
    }
  };
  
  // Trigger achievement for hovering over interactive elements
  useEffect(() => {
    if (isHovered) {
      unlockAchievement(3);
    }
  }, [isHovered]);

  // Features data with icons
  const features = [
    {
      title: "Student Dashboard",
      description: "Track your academic progress, attendance, and manage feedback forms with our intuitive interface.",
      icon: <Users className="text-indigo-500" size={24} />,
      color: colors.primary
    },
    {
      title: "Teacher Portal",
      description: "Create feedback forms, monitor student performance, and analyze responses with powerful visualization tools.",
      icon: <BookOpen className="text-emerald-500" size={24} />,
      color: colors.secondary
    },
    {
      title: "HOD Administration",
      description: "Oversee department performance, manage faculty, and review comprehensive analytics in real-time.",
      icon: <Calendar className="text-violet-500" size={24} />,
      color: colors.accent
    }
  ];

  // Animation variants - slowed down
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.5,
        duration: 1.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 }
    }
  };
  
  // Handle image loading
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // Memoize background blobs and particles to avoid recalculating on every render
  const backgroundBlobs = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      key: i,
      style: {
        width: `${Math.random() * 30 + 10}vw`,
        height: `${Math.random() * 30 + 10}vw`,
        backgroundColor: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.secondary : colors.accent,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        filter: 'blur(100px)',
        opacity: 0.15,
        position: 'absolute' as CSSProperties['position'],
        zIndex: 0,
        transition: 'transform 1.5s cubic-bezier(0.4,0,0.2,1)'
      } as React.CSSProperties
    })),
  [colors.primary, colors.secondary, colors.accent]);

  const memoParticles = useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      key: i,
      style: {
        width: Math.random() * 8 + 4 + 'px',
        height: Math.random() * 8 + 4 + 'px',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        opacity: 0.18,
        position: 'absolute' as CSSProperties['position'],
        background: colors.primary,
        borderRadius: '50%',
        animation: `floatSlow ${Math.random() * 18 + 18}s linear infinite`,
        zIndex: 1
      } as React.CSSProperties
    })),
  [colors.primary]);

  // Galaxy SVG background (unique, subtle, performant)
  const galaxyBackground = (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position:'absolute',top:0,left:0,width:'100vw',height:'100vh',zIndex:0, pointerEvents:'none'}}>
      <defs>
        <radialGradient id="galaxyGradient" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.5"/>
          <stop offset="60%" stopColor="#6366f1" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7"/>
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#galaxyGradient)"/>
      {/* Stars */}
      {Array.from({length: 80}).map((_,i) => (
        <circle key={i} cx={Math.random()*1920} cy={Math.random()*1080} r={Math.random()*1.5+0.3} fill="#fff" opacity={Math.random()*0.7+0.2}/>
      ))}
      {/* Swirl */}
      <ellipse cx="960" cy="540" rx="420" ry="120" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.18"/>
      <ellipse cx="960" cy="540" rx="320" ry="80" fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.13"/>
      <ellipse cx="960" cy="540" rx="200" ry="40" fill="none" stroke="#facc15" strokeWidth="1" opacity="0.10"/>
    </svg>
  );

  return (
    <div className="min-h-screen overflow-hidden text-gray-800 bg-gradient-to-b from-gray-900 via-indigo-950 to-indigo-900 relative">
      {/* Unique animated galaxy background */}
      {galaxyBackground}

      {/* Achievement notification */}
      <div className="fixed top-8 right-8 z-50">
        <div 
          className="relative"
          style={{
            transition: 'all 0.8s cubic-bezier(0.68, -0.55, 0.27, 1.55)'
          }}
        >
          <div
            className={`bg-white rounded-lg shadow-xl p-4 flex items-center gap-3 transform transition-all duration-800 ${
              showAchievement ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-20 scale-95'
            }`}
            style={{
              boxShadow: showAchievement ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 'none'
            }}
          >
            {currentAchievement && (
              <>
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 relative">
                  {currentAchievement.icon}
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
                </div>
                <div>
                  <p className="font-bold">Achievement Unlocked!</p>
                  <p className="text-sm">{currentAchievement.name}: {currentAchievement.description}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fixed navigation dots */}
      <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-40">
        {Object.keys(sectionRefs).map((section) => (
          <button
            key={section}
            aria-label={`Navigate to ${section} section`}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              activeSection === section 
                ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-200' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => {
              sectionRefs[section].current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
              });
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <div 
        ref={sectionRefs.hero}
        className="relative min-h-screen flex items-center overflow-hidden z-10"
        style={{
          background: `linear-gradient(135deg, #312e81 0%, #6366f1 100%)`
        }}
        onMouseEnter={() => setShowParticles(true)}
        onMouseLeave={() => setShowParticles(false)}
      >
        {/* Unique Galaxy Swirl/Orbit effect */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="210" cy="60" rx="200" ry="40" fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.18"/>
            <ellipse cx="210" cy="60" rx="150" ry="30" fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.13"/>
            <ellipse cx="210" cy="60" rx="90" ry="18" fill="none" stroke="#facc15" strokeWidth="1" opacity="0.10"/>
          </svg>
        </div>
        {/* Floating planet illustration */}
        <div className="absolute right-24 top-1/3 z-10 animate-float-slow">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="40" cy="40" r="32" fill="#facc15" opacity="0.85"/>
            <ellipse cx="40" cy="50" rx="24" ry="8" fill="#fde68a" opacity="0.5"/>
            <circle cx="54" cy="32" r="6" fill="#fbbf24" opacity="0.7"/>
          </svg>
        </div>
        {/* Unique logo/title treatment */}
        <div className="container mx-auto px-6 py-16 z-10">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 text-white">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-indigo-100 to-indigo-400 animate-text-shimmer">
                <span className="inline-block align-middle">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="20,2 24,14 38,14 26,22 30,36 20,28 10,36 14,22 2,14 16,14" fill="#facc15" stroke="#eab308" strokeWidth="2"/>
                  </svg>
                </span>
                Educational Feedback Galaxy
              </h1>
              <p className="text-xl mb-8 text-indigo-100">
                A cosmic platform for students, teachers, and administrators to manage academic feedback, attendance, and performance—across the galaxy.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="relative overflow-hidden group bg-white text-indigo-600 hover:bg-gray-100 transition-all duration-500"
                  asChild
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Link to="/login">
                    <span className="relative z-10 flex items-center">
                      Sign In
                      <Sparkles className="ml-2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </span>
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
                    <span className="absolute -inset-px rounded-md border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  className="border-2 border-orange-400 bg-orange-500/20 text-orange-100 hover:bg-orange-500/30 transition-all duration-500"
                  asChild
                >
                  <Link to="/login" className="relative overflow-hidden">
                    <span className="relative z-10">Learn More</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-500/0 to-orange-500/30 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                  </Link>
                </Button>
              </div>
            </div>
            <div 
              className="lg:w-1/2 mb-10 lg:mb-0 perspective-1000"
            >
              <div 
                className={`relative mx-auto w-full max-w-md transform transition-all duration-1000 hover:rotate-y-12 hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              >
                <img
                  src="/api/placeholder/600/400"
                  alt="Educational Platform"
                  className="w-full rounded-xl shadow-2xl"
                  onLoad={handleImageLoad}
                />
                <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />
                <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-indigo-600 rounded-full opacity-50 blur-xl animate-pulse-slow" />
                <div className="absolute -top-3 -left-3 w-16 h-16 bg-orange-400 rounded-full opacity-40 blur-lg animate-float-slow" />
                {/* Animated overlay effects */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/20 to-transparent opacity-60" />
                  <div className="absolute -inset-full w-[300%] h-[300%] bg-gradient-to-r from-transparent via-white/5 to-transparent animate-slow-sweep" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center z-20"
          style={{
            animation: 'floatUpDown 3s ease-in-out infinite'
          }}
        >
          <p className="mb-2 text-sm font-medium">Scroll to explore</p>
          <ChevronDown size={24} />
        </div>
      </div>

      {/* Features Section */}
      <div 
        ref={sectionRefs.features}
        className="py-24 relative z-10"
      >
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden">
          <div 
            className="absolute w-96 h-96 rounded-full bg-indigo-100 -top-10 -left-10"
            style={{
              transform: `translateY(${scrollY * 0.05}px)`,
              transition: 'transform 1s ease-out'
            }}
          />
          <div 
            className="absolute w-96 h-96 rounded-full bg-emerald-100 bottom-20 -right-20"
            style={{
              transform: `translateY(${-scrollY * 0.03}px)`,
              transition: 'transform 1s ease-out'
            }}
          />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div
            style={{
              opacity: scrollY > 100 ? 1 : 0,
              transform: `translateY(${Math.max(0, 20 - scrollY * 0.1)}px)`,
              transition: 'all 1.2s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              Key Features
            </h2>
            <p className="text-lg text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Experience a new dimension of educational management with our innovative features
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center text-center group transform transition-all duration-700 hover:shadow-2xl"
                style={{
                  opacity: scrollY > 150 ? 1 : 0,
                  transform: `translateY(${Math.max(0, 30 - scrollY * 0.05)}px) scale(${scrollY > 200 ? 1 : 0.95})`,
                  transitionDelay: `${index * 0.3}s`,
                  transition: 'all 1s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
                }}
              >
                <div 
                  className="p-4 rounded-full mb-6 group-hover:scale-110 transition-transform duration-700"
                  style={{ 
                    background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                    boxShadow: `0 0 0 2px ${feature.color}20`
                  }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <div 
                  className="w-12 h-1 mt-6 rounded-full transition-all duration-700 group-hover:w-24"
                  style={{ 
                    backgroundColor: feature.color,
                    boxShadow: `0 0 10px ${feature.color}80`
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials / Stats Section */}
      <div 
        ref={sectionRefs.testimonials}
        className="py-24 bg-gradient-to-b from-gray-50 to-white relative z-10"
      >
        <div className="container mx-auto px-6">
          <div
            className="grid md:grid-cols-3 gap-8 mb-16"
            style={{
              opacity: scrollY > 300 ? 1 : 0,
              transform: `translateY(${Math.max(0, 30 - scrollY * 0.05)}px)`,
              transition: 'all 1.2s ease-out'
            }}
          >
            {[
              { number: "98%", text: "User Satisfaction", icon: <Check size={20} className="text-green-500" /> },
              { number: "10K+", text: "Active Students", icon: <Users size={20} className="text-blue-500" /> },
              { number: "500+", text: "Educational Institutions", icon: <BookOpen size={20} className="text-purple-500" /> }
            ].map((stat, index) => (
              <div 
                key={index}
                className="flex flex-col items-center text-center p-6"
                style={{
                  transitionDelay: `${index * 0.3}s`
                }}
              >
                <div className="flex items-center mb-2">
                  {stat.icon}
                  <span 
                    className="text-4xl font-bold ml-2 text-gray-800"
                    style={{
                      opacity: scrollY > 350 ? 1 : 0,
                      transform: `scale(${scrollY > 350 ? 1 : 0.8})`,
                      transitionDelay: `${0.5 + index * 0.3}s`,
                      transition: 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {stat.number}
                  </span>
                </div>
                <p className="text-gray-600">{stat.text}</p>
              </div>
            ))}
          </div>
          
          <div
            className="bg-white p-8 rounded-2xl shadow-xl relative overflow-hidden border border-gray-100"
            style={{
              opacity: scrollY > 400 ? 1 : 0,
              transform: `translateY(${Math.max(0, 50 - scrollY * 0.05)}px)`,
              transition: 'all 1.5s ease-out'
            }}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 opacity-10 rounded-full" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-green-500 opacity-10 rounded-full" />
            
            <h3 className="text-2xl font-bold mb-6 text-center">How It Works</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-between relative">
              {[
                { title: "Register", description: "Create your account" },
                { title: "Customize", description: "Set up your profile" },
                { title: "Collaborate", description: "Connect with others" },
                { title: "Track", description: "Monitor progress" }
              ].map((step, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center text-center p-4 z-10 md:w-1/4"
                  style={{
                    opacity: scrollY > 450 ? 1 : 0,
                    transform: `translateY(${Math.max(0, 20 - scrollY * 0.03)}px)`,
                    transitionDelay: `${index * 0.3}s`,
                    transition: 'all 1s cubic-bezier(0.17, 0.67, 0.83, 0.67)'
                  }}  
                >
                  <div className="mb-4 rounded-full bg-indigo-100 p-4 relative">
                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium animate-pulse-slow">
                      {index + 1}
                    </span>
                    <div className="text-indigo-600">
                      {index === 0 ? <Users size={24} /> : 
                       index === 1 ? <BookOpen size={24} /> :
                       index === 2 ? <Calendar size={24} /> :
                       <Check size={24} />}
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
              
              {/* Connecting line with animation */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-indigo-100 hidden md:block"
                style={{
                  width: scrollY > 500 ? '100%' : '0%',
                  transition: 'width 1.5s ease-out'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div 
        ref={sectionRefs.cta}
        className="py-24 relative overflow-hidden z-10"
        style={{
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primary} 100%)`
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white opacity-10"
              style={{
                width: Math.random() * 300 + 100 + 'px',
                height: Math.random() * 300 + 100 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                transform: 'translate(-50%, -50%)',
                filter: 'blur(40px)',
                animation: `floatSlow ${Math.random() * 20 + 20}s linear infinite`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div
            style={{
              opacity: scrollY > 600 ? 1 : 0,
              transform: `scale(${scrollY > 600 ? 1 : 0.95})`,
              transition: 'all 1.2s ease-out'
            }}
          >
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to transform your educational experience?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join our community today and access your personalized learning dashboard.
            </p>
            <div
              className="inline-block"
              style={{
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50 transition-all duration-500 shadow-xl hover:shadow-2xl relative overflow-hidden group"
                asChild
              >
                <Link to="/login" className="px-8 py-6 text-lg">
                  <span className="relative z-10">Get Started Now</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 opacity-0 group-hover:opacity-100 transform group-hover:-translate-x-full transition-all duration-1500 ease-in-out" />
                </Link>
              </Button>
            </div>
            
            {/* Achievement badges */}
            <div 
              className="mt-12 flex flex-wrap justify-center gap-4"
              style={{
                opacity: scrollY > 650 ? 1 : 0,
                transform: `translateY(${Math.max(0, 20 - scrollY * 0.02)}px)`,
                transition: 'all 1.5s ease-out'
              }}
            >
              {achievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-700 ${
                    unlockedAchievements.includes(achievement.id)
                      ? 'bg-white/10 text-white' 
                      : 'bg-white/5 text-white/50'
                  }`}
                >
                  <div className="p-2 rounded-full bg-indigo-500/20">
                    {achievement.icon}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{achievement.name}</p>
                    <p className="text-xs opacity-80">{achievement.description}</p>
                  </div>
                  {unlockedAchievements.includes(achievement.id) && (
                    <Check size={16} className="text-green-400" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">© 2025 Educational Feedback Galaxy. All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global CSS animations */}
      <style>{`
        @keyframes floatSlow {
          0% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0); }
        }

        @keyframes animate-pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes animate-float-slow {
          0% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0); }
        }

        @keyframes animate-text-shimmer {
          0% { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }

        @keyframes animate-slow-sweep {
          0% { transform: translateX(0); }
          100% { transform: translateX(-66.66%); }
        }

        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default Index;
