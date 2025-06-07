import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Sparkles, 
  MessageCircle, 
  BookOpen, 
  Target, 
  TrendingUp,
  Lightbulb,
  Star,
  Trophy,
  Zap,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  ChevronRight,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface LearningPath {
  id: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  estimatedTime: string;
  topics: string[];
  aiRecommended: boolean;
}

interface StudySession {
  id: string;
  topic: string;
  startTime: Date;
  duration: number;
  progress: number;
  insights: string[];
}

interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'text' | 'suggestion' | 'quiz' | 'resource';
  metadata?: any;
}

interface LearningInsight {
  type: 'strength' | 'weakness' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  actionable: boolean;
  icon: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AILearningCompanion: React.FC = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [studyStreak, setStudyStreak] = useState(0);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [personalityType, setPersonalityType] = useState('Visual');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  // Initialize learning companion
  useEffect(() => {
    initializeLearningCompanion();
    loadUserProgress();
    setupSpeechRecognition();
    setupSpeechSynthesis();
  }, []);

  const initializeLearningCompanion = () => {
    const welcomeMessage: AIMessage = {
      id: '1',
      content: `Hello ${user?.name}! I'm your AI Learning Companion 🤖✨\n\nI'm here to help you learn smarter, not harder. I can:\n• Create personalized learning paths\n• Provide instant explanations\n• Generate practice questions\n• Track your progress\n• Adapt to your learning style\n\nWhat would you like to learn today?`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages([welcomeMessage]);

    // Mock learning paths - in real app, fetch from API
    setLearningPaths([
      {
        id: '1',
        title: 'Advanced JavaScript Concepts',
        difficulty: 'Advanced',
        progress: 65,
        estimatedTime: '2.5 hours',
        topics: ['Closures', 'Async/Await', 'Design Patterns'],
        aiRecommended: true
      },
      {
        id: '2',
        title: 'Data Structures & Algorithms',
        difficulty: 'Intermediate',
        progress: 30,
        estimatedTime: '4 hours',
        topics: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
        aiRecommended: false
      }
    ]);

    // Mock insights
    setInsights([
      {
        type: 'strength',
        title: 'Visual Learning',
        description: 'You excel with visual explanations and diagrams',
        actionable: false,
        icon: '👁️'
      },
      {
        type: 'recommendation',
        title: 'Study Time Optimization',
        description: 'Your peak focus time is 10 AM - 12 PM',
        actionable: true,
        icon: '⏰'
      }
    ]);
  };
  const loadUserProgress = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/learning-stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudyStreak(data.learningStats?.studyStreak || 0);
        setTotalStudyTime(data.learningStats?.totalStudyTime || 0);
        setPersonalityType(data.learningStats?.personalityType || 'Visual');
      } else {
        console.error('Failed to fetch user learning stats');
        // Fallback to default values
        setStudyStreak(0);
        setTotalStudyTime(0);
        setPersonalityType('Visual');
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Fallback to default values
      setStudyStreak(0);
      setTotalStudyTime(0);
      setPersonalityType('Visual');
    }
  };

  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCurrentMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Speech recognition error');
      };
    }
  };

  const setupSpeechSynthesis = () => {
    synthesisRef.current = window.speechSynthesis;
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakMessage = (text: string) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      synthesisRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };
  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Update study activity
    await updateStudyActivity('chat');

    try {
      // Enhanced AI response with learning context
      const response = await fetch(`${API_BASE_URL}/api/ai/learning-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          context: `Learning style: ${personalityType}, Study streak: ${studyStreak} days, Current paths: ${learningPaths.length}`,
          learningPath: learningPaths.length > 0 ? learningPaths[0].title : 'General Studies'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('AI Chat API Error:', response.status, errorData);
        throw new Error(`Failed to get AI response: ${response.status}`);
      }

      const data = await response.json();
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        type: data.type || 'text',
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-speak AI responses if enabled
      if (data.response && data.response.length < 200) {
        setTimeout(() => speakMessage(data.response), 500);
      }

    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment!",
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const startLearningPath = async (pathId: string) => {
    const path = learningPaths.find(p => p.id === pathId);
    if (path) {
      const session: StudySession = {
        id: Date.now().toString(),
        topic: path.title,
        startTime: new Date(),
        duration: 0,
        progress: 0,
        insights: []
      };
      setCurrentSession(session);
      toast.success(`Started learning: ${path.title}`);
      
      // Update study activity for starting a learning path
      await updateStudyActivity('learning_path');
    }
  };

  const updateStudyActivity = async (activityType: string = 'chat') => {
    try {
      await fetch(`${API_BASE_URL}/api/user/learning-stats`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learningStats: {
            studyActivity: true,
            totalStudyTime: totalStudyTime + 5, // Add 5 minutes for activity
          }
        }),
      });
      
      // Update local state
      setTotalStudyTime(prev => prev + 5);
      
      // Refresh user stats to get updated streak
      loadUserProgress();
    } catch (error) {
      console.error('Error updating study activity:', error);
    }
  };

  const generateQuickQuiz = async (topic: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-quiz-arena`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          subject: topic, 
          difficulty: 'medium', 
          questionCount: 3,
          gameMode: 'classic'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Quick Quiz API Error:', response.status, errorData);
        throw new Error(`Failed to generate quiz: ${response.status}`);
      }

      const quiz = await response.json();
      
      const quizMessage: AIMessage = {
        id: Date.now().toString(),
        content: `Here's a quick quiz on ${topic}! 🎯`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'quiz',
        metadata: quiz
      };

      setMessages(prev => [...prev, quizMessage]);
    } catch (error) {
      toast.error('Failed to generate quiz');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  return (
    <AppLayout pageTitle="AI Learning Companion">
      <div className="h-full flex flex-col p-6 space-y-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-4 text-white"
          >
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Study Streak</p>
                <p className="text-2xl font-bold">{studyStreak} days</p>
              </div>
            </div>
          </motion.div>          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-4 text-white"
          >
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Total Study Time</p>
                <p className="text-2xl font-bold">{Math.floor(totalStudyTime / 60)}h {totalStudyTime % 60}m</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl p-4 text-white"
          >
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">Learning Style</p>
                <p className="text-2xl font-bold">{personalityType}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl p-4 text-white"
          >
            <div className="flex items-center space-x-3">
              <Sparkles className="h-8 w-8" />
              <div>
                <p className="text-sm opacity-90">AI Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-6 w-6 text-purple-500" />
                    <span>AI Learning Chat</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isSpeaking ? stopSpeaking : () => {}}
                      className={isSpeaking ? 'bg-red-100 dark:bg-red-900/30' : ''}
                    >
                      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-96">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {message.type === 'quiz' && message.metadata ? (
                            <div className="space-y-2">
                              <p className="font-medium">{message.content}</p>
                              <Button 
                                size="sm" 
                                onClick={() => window.open('/ai/quiz-arena', '_blank')}
                                className="w-full"
                              >
                                Take Quiz <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>                          ) : (
                            <div className="space-y-2">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                              {message.sender === 'ai' && (                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => speakMessage(message.content)}
                                  disabled={isSpeaking}
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                  {isSpeaking ? (
                                    <>
                                      <VolumeX className="h-3 w-3 mr-1" />
                                      Speaking...
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="h-3 w-3 mr-1" />
                                      Read aloud
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isLoading && (                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-lg">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask me anything about learning..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="pr-12"
                    />                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={isListening ? stopListening : startListening}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                        isListening ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>                  <Button 
                    onClick={sendMessage} 
                    disabled={!currentMessage.trim() || isLoading}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  {isSpeaking && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopSpeaking}
                      className="text-red-500 border-red-300 hover:bg-red-50"
                    >
                      <VolumeX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Paths & Insights */}
          <div className="space-y-6">
            
            {/* Current Session */}
            {currentSession && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Play className="h-5 w-5" />
                      <span>Current Session</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{currentSession.topic}</p>
                    <p className="text-sm opacity-90">
                      Started: {currentSession.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <Progress value={currentSession.progress} className="mt-2 bg-green-400" />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                  <span>Learning Paths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningPaths.map((path) => (
                    <motion.div
                      key={path.id}
                      whileHover={{ scale: 1.02 }}
                      className="p-3 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => startLearningPath(path.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{path.title}</h4>
                        {path.aiRecommended && (
                          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Pick
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>{path.difficulty}</span>
                        <span>{path.estimatedTime}</span>
                      </div>
                      <Progress value={path.progress} className="h-2 mb-2" />
                      <div className="flex flex-wrap gap-1">
                        {path.topics.slice(0, 2).map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {path.topics.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{path.topics.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span>AI Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}                      className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <span className="text-lg">{insight.icon}</span>
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{insight.description}</p>
                        {insight.actionable && (
                          <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">
                            Take Action <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => generateQuickQuiz('Current Topic')}
                    className="flex flex-col h-auto py-3"
                  >
                    <Target className="h-4 w-4 mb-1" />
                    <span className="text-xs">Quick Quiz</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex flex-col h-auto py-3"
                  >
                    <TrendingUp className="h-4 w-4 mb-1" />
                    <span className="text-xs">Progress</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex flex-col h-auto py-3"
                  >
                    <Star className="h-4 w-4 mb-1" />
                    <span className="text-xs">Achievements</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex flex-col h-auto py-3"
                  >
                    <RefreshCw className="h-4 w-4 mb-1" />
                    <span className="text-xs">Refresh</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AILearningCompanion;
