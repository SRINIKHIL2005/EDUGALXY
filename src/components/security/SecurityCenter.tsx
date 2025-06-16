import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  Lock, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Globe,
  Monitor,
  History,
  Flag,
  UserX,
  FileText,
  Settings,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordChangeRequired: boolean;
  privacyMode: boolean;
  dataSharing: boolean;
  auditLogAccess: boolean;
  securityAlerts: boolean;
  suspiciousActivityNotifications: boolean;
  deviceManagement: boolean;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'password_change' | 'failed_login' | 'suspicious_activity' | 'violation_reported';
  timestamp: string;
  location: string;
  ipAddress: string;
  device: string;
  status: 'success' | 'failed' | 'warning' | 'critical';
  description?: string;
}

interface ViolationReport {
  reportedUser: string;
  violationType: string;
  description: string;
  evidence?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const SecurityCenter: React.FC = () => {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    sessionTimeout: 30,
    passwordChangeRequired: false,
    privacyMode: false,
    dataSharing: false,
    auditLogAccess: true,
    securityAlerts: true,
    suspiciousActivityNotifications: true,
    deviceManagement: true
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Violation reporting states
  const [showViolationDialog, setShowViolationDialog] = useState(false);
  const [violationReport, setViolationReport] = useState<ViolationReport>({
    reportedUser: '',
    violationType: '',
    description: '',
    evidence: '',
    priority: 'medium'
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      status: 'success'
    },
    {
      id: '2',
      type: 'failed_login',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      location: 'Unknown',
      ipAddress: '203.123.45.67',
      device: 'Unknown Browser',
      status: 'failed'
    },
    {
      id: '3',
      type: 'password_change',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      device: 'Chrome on Windows',
      status: 'success'
    }
  ]);

  // Password strength calculation
  useEffect(() => {
    const calculateStrength = (password: string) => {
      let strength = 0;
      if (password.length >= 8) strength += 20;
      if (password.length >= 12) strength += 10;
      if (/[a-z]/.test(password)) strength += 15;
      if (/[A-Z]/.test(password)) strength += 15;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[^A-Za-z0-9]/.test(password)) strength += 25;
      return Math.min(strength, 100);
    };
    
    setPasswordStrength(calculateStrength(newPassword));
  }, [newPassword]);

  const handleSettingChange = (setting: keyof SecuritySettings, value: boolean | number) => {
    setSecuritySettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    // Simulate API call to save settings
    toast.success(`Security setting updated: ${setting}`);
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordStrength < 60) {
      toast.error('Password is too weak. Please choose a stronger password.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Add to security events
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: 'password_change',
        timestamp: new Date().toISOString(),
        location: 'Current Location',
        ipAddress: '192.168.1.100',
        device: 'Current Device',
        status: 'success'
      };
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async () => {
    setIsLoading(true);
    try {
      // Simulate 2FA setup process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
      toast.success('Two-Factor Authentication enabled successfully');
    } catch (error) {
      toast.error('Failed to enable 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  // Violation reporting functions
  const handleViolationReport = async () => {
    if (!violationReport.reportedUser || !violationReport.violationType || !violationReport.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmittingReport(true);
    try {
      // Simulate API call to submit violation report
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to security events
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: 'violation_reported',
        timestamp: new Date().toISOString(),
        location: 'Current Location',
        ipAddress: '192.168.1.100',
        device: 'Current Device',
        status: 'warning',
        description: `Violation reported: ${violationReport.violationType} by ${violationReport.reportedUser}`
      };
      setSecurityEvents(prev => [newEvent, ...prev]);
      
      toast.success('Violation report submitted successfully. Our security team will investigate.');
      setShowViolationDialog(false);
      setViolationReport({
        reportedUser: '',
        violationType: '',
        description: '',
        evidence: '',
        priority: 'medium'
      });
    } catch (error) {
      toast.error('Failed to submit violation report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const violationTypes = [
    'Academic Dishonesty',
    'Harassment/Bullying',
    'Inappropriate Content',
    'Security Breach Attempt',
    'Spam/Excessive Messaging',
    'Impersonation',
    'Privacy Violation',
    'Platform Abuse',
    'Other'
  ];

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'logout': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'password_change': return <Key className="w-4 h-4 text-purple-500" />;
      case 'failed_login': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'suspicious_activity': return <Shield className="w-4 h-4 text-orange-500" />;
      case 'violation_reported': return <Flag className="w-4 h-4 text-yellow-500" />;
      default: return <Monitor className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                {securitySettings.twoFactorEnabled ? 
                  <CheckCircle className="w-8 h-8 text-green-500" /> :
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                }
              </div>
              <h3 className="font-medium">2FA Status</h3>
              <p className="text-sm text-gray-600">
                {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Lock className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="font-medium">Session Security</h3>
              <p className="text-sm text-gray-600">{securitySettings.sessionTimeout}min timeout</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="font-medium">Privacy Mode</h3>
              <p className="text-sm text-gray-600">
                {securitySettings.privacyMode ? 'Enhanced' : 'Standard'}
              </p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="flex justify-center mb-2">
                <History className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="font-medium">Audit Logs</h3>
              <p className="text-sm text-gray-600">{securityEvents.length} recent events</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowViolationDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Flag className="w-4 h-4" />
              Report Violation
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Advanced Settings
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Security Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Password Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Password Strength:</span>
                    <span className={passwordStrength < 30 ? 'text-red-500' : passwordStrength < 60 ? 'text-yellow-500' : passwordStrength < 80 ? 'text-blue-500' : 'text-green-500'}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              disabled={isLoading || passwordStrength < 60}
              className="w-full"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Two-Factor Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!securitySettings.twoFactorEnabled ? (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Two-Factor Authentication is not enabled. Your account is more vulnerable to unauthorized access.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Benefits of 2FA:</h4>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Extra layer of security for your account</li>
                    <li>Protection against password breaches</li>
                    <li>Required for accessing sensitive features</li>
                    <li>Compliance with security best practices</li>
                  </ul>
                </div>

                <Button onClick={enable2FA} disabled={isLoading} className="w-full">
                  {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                </Button>
              </>
            ) : (
              <>
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Two-Factor Authentication is active and protecting your account.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    View Recovery Codes
                  </Button>
                  <Button variant="outline" className="w-full">
                    Reconfigure 2FA
                  </Button>
                  <Button variant="destructive" className="w-full">
                    Disable 2FA
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Privacy & Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Notifications</p>
                  <p className="text-sm text-gray-600">Get notified of account logins</p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => handleSettingChange('loginNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Security Alerts</p>
                  <p className="text-sm text-gray-600">Receive security-related notifications</p>
                </div>
                <Switch
                  checked={securitySettings.securityAlerts}
                  onCheckedChange={(checked) => handleSettingChange('securityAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Privacy Mode</p>
                  <p className="text-sm text-gray-600">Enhanced privacy protection</p>
                </div>
                <Switch
                  checked={securitySettings.privacyMode}
                  onCheckedChange={(checked) => handleSettingChange('privacyMode', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Audit Log Access</p>
                  <p className="text-sm text-gray-600">Allow access to audit logs</p>
                </div>
                <Switch
                  checked={securitySettings.auditLogAccess}
                  onCheckedChange={(checked) => handleSettingChange('auditLogAccess', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                <Input
                  id="session-timeout"
                  type="number"
                  min="5"
                  max="120"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Security Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium capitalize">
                        {event.type.replace('_', ' ')}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {event.location} • {event.ipAddress} • {event.device}
                      </span>
                    </div>
                  </div>
                  <Badge variant={
                    event.status === 'success' ? 'default' :
                    event.status === 'failed' ? 'destructive' : 
                    event.status === 'critical' ? 'destructive' : 'secondary'
                  }>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Violation Reporting Dialog */}
      <Dialog open={showViolationDialog} onOpenChange={setShowViolationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              Report Violation
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reported-user">User to Report</Label>
              <Input
                id="reported-user"
                placeholder="Email or username"
                value={violationReport.reportedUser}
                onChange={(e) => setViolationReport(prev => ({
                  ...prev,
                  reportedUser: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violation-type">Violation Type</Label>
              <select
                id="violation-type"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={violationReport.violationType}
                onChange={(e) => setViolationReport(prev => ({
                  ...prev,
                  violationType: e.target.value
                }))}
              >
                <option value="">Select violation type</option>
                {violationTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violation-priority">Priority</Label>
              <select
                id="violation-priority"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={violationReport.priority}
                onChange={(e) => setViolationReport(prev => ({
                  ...prev,
                  priority: e.target.value as ViolationReport['priority']
                }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="violation-description">Description</Label>
              <Textarea
                id="violation-description"
                placeholder="Describe the violation in detail..."
                value={violationReport.description}
                onChange={(e) => setViolationReport(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="violation-evidence">Evidence (Optional)</Label>
              <Textarea
                id="violation-evidence"
                placeholder="Any evidence or additional information..."
                value={violationReport.evidence}
                onChange={(e) => setViolationReport(prev => ({
                  ...prev,
                  evidence: e.target.value
                }))}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowViolationDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleViolationReport}
                disabled={isSubmittingReport}
                className="flex-1"
              >
                {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SecurityCenter;
