import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Shield, Lock, AlertTriangle, CheckCircle, Mail, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import TermsAndConditions from '@/components/legal/TermsAndConditions';
import TermsOfService from '@/components/legal/TermsOfService';
import PrivacyPolicy from '@/components/legal/PrivacyPolicy';

interface SecureSignUpFormProps {
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  error?: string;
}

const SecureSignUpForm: React.FC<SecureSignUpFormProps> = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'student',
    phone: ''
  });
    const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedTermsOfService, setAcceptedTermsOfService] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [userCaptchaAnswer, setUserCaptchaAnswer] = useState('');

  // Generate simple math CAPTCHA
  React.useEffect(() => {
    const generateCaptcha = () => {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const operators = ['+', '-', '*'];
      const operator = operators[Math.floor(Math.random() * operators.length)];
      
      let question = `${num1} ${operator} ${num2}`;
      let answer;
      
      switch (operator) {
        case '+': answer = num1 + num2; break;
        case '-': answer = num1 - num2; break;
        case '*': answer = num1 * num2; break;
        default: answer = num1 + num2;
      }
      
      setCaptchaQuestion(question);
      setCaptchaAnswer(answer.toString());
      setCaptchaVerified(false);
      setUserCaptchaAnswer('');
    };
    
    generateCaptcha();
  }, []);

  // Verify CAPTCHA
  const verifyCaptcha = (userAnswer: string) => {
    const isCorrect = userAnswer.trim() === captchaAnswer;
    setCaptchaVerified(isCorrect);
    return isCorrect;
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&]/.test(password),
      password.length >= 12
    ];
    strength = (checks.filter(Boolean).length / checks.length) * 100;
    return Math.round(strength);
  };

  // Input validation
  const validateField = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (name) {
      case 'name':
        if (!value.trim()) errors.name = 'Name is required';
        else if (value.length < 2) errors.name = 'Name must be at least 2 characters';
        else if (!/^[a-zA-Z\s]+$/.test(value)) errors.name = 'Name can only contain letters and spaces';
        break;
      
      case 'email':
        if (!value) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Invalid email format';
        break;
      
      case 'password':
        if (!value) errors.password = 'Password is required';
        else if (value.length < 8) errors.password = 'Password must be at least 8 characters';
        else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
          errors.password = 'Password must contain uppercase, lowercase, number, and special character';
        }
        break;
      
      case 'confirmPassword':
        if (!value) errors.confirmPassword = 'Please confirm your password';
        else if (value !== formData.password) errors.confirmPassword = 'Passwords do not match';
        break;
      
      case 'department':
        if (!value.trim()) errors.department = 'Department is required';
        break;
      
      case 'phone':
        if (value && !/^\+?[\d\s\-\(\)]+$/.test(value)) errors.phone = 'Invalid phone number format';
        break;
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, ...fieldError }));
    
    // Update password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'bg-red-500';
    if (passwordStrength < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const allErrors: Record<string, string> = {};
    Object.keys(formData).forEach(key => {
      const fieldError = validateField(key, formData[key as keyof typeof formData]);
      Object.assign(allErrors, fieldError);
    });
    
    // Check CAPTCHA
    if (!captchaVerified) {
      if (!userCaptchaAnswer) {
        allErrors.captcha = 'Please solve the CAPTCHA';
      } else if (!verifyCaptcha(userCaptchaAnswer)) {
        allErrors.captcha = 'Incorrect CAPTCHA answer';
      }
    }
    
    // Check required consents
    if (!acceptedTerms) allErrors.terms = 'You must accept the Terms and Conditions';
    if (!acceptedTermsOfService) allErrors.termsOfService = 'You must accept the Terms of Service';
    if (!acceptedPrivacy) allErrors.privacy = 'You must accept the Privacy Policy';
    if (!dataProcessingConsent) allErrors.dataProcessing = 'Data processing consent is required';
    
    setFieldErrors(allErrors);
    
    if (Object.keys(allErrors).length === 0) {
      // Check email uniqueness before submitting
      try {
        const emailCheckResponse = await fetch(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`);
        const emailData = await emailCheckResponse.json();
        
        if (!emailData.available) {
          setFieldErrors({ email: 'This email is already registered. Please use a different email or try logging in.' });
          return;
        }
      } catch (error) {
        console.error('Email check failed:', error);
      }
      
      onSubmit({
        ...formData,
        consents: {
          terms: acceptedTerms,
          termsOfService: acceptedTermsOfService,
          privacy: acceptedPrivacy,
          dataProcessing: dataProcessingConsent,
          marketing: marketingConsent
        }
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-900">Secure Registration</h2>
        <p className="text-gray-600">Create your secure account</p>
      </div>

      {error && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className={fieldErrors.name ? 'border-red-500' : ''}
            placeholder="Enter your full name"
            required
          />
          {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Email Field */}
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={fieldErrors.email ? 'border-red-500' : ''}
            placeholder="Enter your email"
            required
          />
          {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              className={fieldErrors.password ? 'border-red-500 pr-10' : 'pr-10'}
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Password Strength:</span>
                <span className={`font-medium ${passwordStrength < 40 ? 'text-red-500' : passwordStrength < 70 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {getPasswordStrengthText()}
                </span>
              </div>
              <Progress value={passwordStrength} className="h-2" />
            </div>
          )}
          {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={fieldErrors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
              placeholder="Confirm your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>}
        </div>

        {/* Department */}
        <div>
          <Label htmlFor="department">Department *</Label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded-md ${fieldErrors.department ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="">Select Department</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Engineering">Engineering</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
          </select>
          {fieldErrors.department && <p className="text-red-500 text-sm mt-1">{fieldErrors.department}</p>}
        </div>

        {/* Role */}
        <div>
          <Label htmlFor="role">Role *</Label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="hod">Head of Department</option>
          </select>
        </div>

        {/* Phone (Optional) */}
        <div>
          <Label htmlFor="phone">Phone Number (Optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className={fieldErrors.phone ? 'border-red-500' : ''}
            placeholder="+1 (555) 123-4567"
          />
          {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
        </div>

        {/* Legal Consents */}
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-medium text-gray-900">Legal Agreements & Consents</h3>
            {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="terms" className="cursor-pointer">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 hover:underline"
                >
                  Terms and Conditions
                </button>{' '}
                *
              </label>
              {fieldErrors.terms && <p className="text-red-500 text-xs mt-1">{fieldErrors.terms}</p>}
            </div>
          </div>

          {/* Terms of Service */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="termsOfService"
              checked={acceptedTermsOfService}
              onCheckedChange={(checked) => setAcceptedTermsOfService(checked === true)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="termsOfService" className="cursor-pointer">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowTermsOfService(true)}
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service & Violation Policies
                </button>{' '}
                *
              </label>
              {fieldErrors.termsOfService && <p className="text-red-500 text-xs mt-1">{fieldErrors.termsOfService}</p>}
            </div>
          </div>          {/* Privacy Policy */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="privacy" className="cursor-pointer">
                I accept the{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacy(true)}
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </button>{' '}
                *
              </label>
              {fieldErrors.privacy && <p className="text-red-500 text-xs mt-1">{fieldErrors.privacy}</p>}
            </div>
          </div>

          {/* Data Processing Consent */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="dataProcessing"
              checked={dataProcessingConsent}
              onCheckedChange={(checked) => setDataProcessingConsent(checked === true)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="dataProcessing" className="cursor-pointer">
                I consent to the processing of my personal data for educational purposes as described in the Privacy Policy *
              </label>
              {fieldErrors.dataProcessing && <p className="text-red-500 text-xs mt-1">{fieldErrors.dataProcessing}</p>}
            </div>
          </div>

          {/* Marketing Consent (Optional) */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketing"
              checked={marketingConsent}
              onCheckedChange={(checked) => setMarketingConsent(checked === true)}
              className="mt-1"
            />
            <div className="text-sm">
              <label htmlFor="marketing" className="cursor-pointer text-gray-600">
                I would like to receive educational updates and newsletters (optional)
              </label>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Security Notice</p>
              <p>Your data is encrypted and protected. We follow industry standards for data security and privacy.</p>
            </div>
          </div>        </div>

        {/* CAPTCHA Verification */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <Label htmlFor="captcha" className="text-sm font-medium mb-2 block">
            Security Verification *
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="bg-white border-2 border-gray-300 rounded px-3 py-2 font-mono text-lg">
                {captchaQuestion} = ?
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Regenerate CAPTCHA
                  const num1 = Math.floor(Math.random() * 10) + 1;
                  const num2 = Math.floor(Math.random() * 10) + 1;
                  const operators = ['+', '-', '*'];
                  const operator = operators[Math.floor(Math.random() * operators.length)];
                  
                  let question = `${num1} ${operator} ${num2}`;
                  let answer;
                  
                  switch (operator) {
                    case '+': answer = num1 + num2; break;
                    case '-': answer = num1 - num2; break;
                    case '*': answer = num1 * num2; break;
                    default: answer = num1 + num2;
                  }
                  
                  setCaptchaQuestion(question);
                  setCaptchaAnswer(answer.toString());
                  setCaptchaVerified(false);
                  setUserCaptchaAnswer('');
                }}
              >
                🔄 New
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="captcha"
                type="number"
                value={userCaptchaAnswer}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserCaptchaAnswer(value);
                  if (value && verifyCaptcha(value)) {
                    setFieldErrors(prev => ({ ...prev, captcha: '' }));
                  }
                }}
                className={`w-20 ${fieldErrors.captcha ? 'border-red-500' : captchaVerified ? 'border-green-500' : ''}`}
                placeholder="Answer"
                required
              />
              {captchaVerified && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {fieldErrors.captcha && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
            </div>
            {fieldErrors.captcha && (
              <p className="text-red-500 text-xs">{fieldErrors.captcha}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}        <Button
          type="submit"
          className="w-full"
          disabled={
            isLoading || 
            !acceptedTerms || 
            !acceptedTermsOfService || 
            !acceptedPrivacy || 
            !dataProcessingConsent ||
            !captchaVerified
          }
        >
          {isLoading ? 'Creating Account...' : 'Create Secure Account'}
        </Button>
      </form>      {/* Legal Documents Modals */}
      <TermsAndConditions
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTerms(false);
        }}
        showAcceptButton={!acceptedTerms}
      />

      <TermsOfService
        isOpen={showTermsOfService}
        onClose={() => setShowTermsOfService(false)}
        onAccept={() => {
          setAcceptedTermsOfService(true);
          setShowTermsOfService(false);
        }}
        showAcceptButton={!acceptedTermsOfService}
        asDialog={true}
      />

      <PrivacyPolicy
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </motion.div>
  );
};

export default SecureSignUpForm;
