
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ThankYou = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        switch (user.role) {
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'teacher':
            navigate('/teacher-dashboard');
            break;
          case 'hod':
            navigate('/hod-dashboard');
            break;
          default:
            navigate('/');
        }
      } else {
        navigate('/login');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center p-8 bg-white rounded-lg shadow-lg animate-scale-in">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-green-100">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
        
        <p className="text-gray-600 mb-8">
          Your action has been successfully completed. You'll be redirected to your dashboard in a few seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          
          <Button 
            className="bg-edu-primary hover:bg-edu-primary/90"
            onClick={() => {
              if (user) {
                switch (user.role) {
                  case 'student':
                    navigate('/student-dashboard');
                    break;
                  case 'teacher':
                    navigate('/teacher-dashboard');
                    break;
                  case 'hod':
                    navigate('/hod-dashboard');
                    break;
                  default:
                    navigate('/');
                }
              } else {
                navigate('/login');
              }
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
