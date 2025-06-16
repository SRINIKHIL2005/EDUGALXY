import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  AlertTriangle, 
  Flag, 
  Activity, 
  Settings, 
  Eye, 
  Lock,
  UserCheck,
  FileText,
  Clock
} from 'lucide-react';

const SecurityCenter: React.FC = () => {
  const [violationReport, setViolationReport] = useState({
    type: '',
    description: '',
    priority: 'medium',
    evidence: ''
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [accountStatus, setAccountStatus] = useState(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  useEffect(() => {
    fetchAccountStatus();
    fetchSecurityLogs();
  }, []);

  const fetchAccountStatus = async () => {
    try {
      const response = await fetch('/api/security/account/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAccountStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const response = await fetch('/api/security/logs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityLogs(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      const response = await fetch('/api/security/violations/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(violationReport)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setViolationReport({ type: '', description: '', priority: 'medium', evidence: '' });
        setIsReportDialogOpen(false);
        // Refresh logs
        fetchSecurityLogs();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Failed to submit report:', error);
      setSubmitStatus('error');
    }
  };

  const violationTypes = [
    { value: 'harassment', label: 'Harassment or Bullying' },
    { value: 'spam', label: 'Spam or Unsolicited Content' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'security_threat', label: 'Security Threat' },
    { value: 'academic_dishonesty', label: 'Academic Dishonesty' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'platform_abuse', label: 'Platform Abuse' },
    { value: 'other', label: 'Other' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-2">Manage your account security and report violations</p>
        </div>
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Flag className="w-4 h-4 mr-2" />
              Report Violation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report a Security Violation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <Label htmlFor="violation-type">Violation Type</Label>
                <Select 
                  value={violationReport.type} 
                  onValueChange={(value) => setViolationReport(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select violation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {violationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select 
                  value={violationReport.priority} 
                  onValueChange={(value) => setViolationReport(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={violationReport.description}
                  onChange={(e) => setViolationReport(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the violation in detail..."
                  className="min-h-24"
                  required
                />
              </div>

              <div>
                <Label htmlFor="evidence">Evidence (URLs, screenshots description, etc.)</Label>
                <Textarea
                  id="evidence"
                  value={violationReport.evidence}
                  onChange={(e) => setViolationReport(prev => ({ ...prev, evidence: e.target.value }))}
                  placeholder="Provide any evidence or additional context..."
                  className="min-h-16"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitStatus === 'submitting' || !violationReport.type || !violationReport.description}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {submitStatus === 'success' && (
        <Alert className="border-green-500 bg-green-50">
          <AlertTriangle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Violation report submitted successfully. Our security team will review it shortly.
          </AlertDescription>
        </Alert>
      )}

      {submitStatus === 'error' && (
        <Alert className="border-red-500 bg-red-50" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to submit report. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Security Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Account Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {accountStatus ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account Status</span>
                  <Badge className={accountStatus.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {accountStatus.status || 'Active'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Security Score</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {accountStatus.securityScore || 95}/100
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Violations</span>
                  <Badge className="bg-gray-100 text-gray-800">
                    {accountStatus.violationCount || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Security Check</span>
                  <span className="text-sm text-gray-600">
                    {accountStatus.lastSecurityCheck ? new Date(accountStatus.lastSecurityCheck).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">Loading security status...</div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Two-Factor Authentication</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Login Notifications</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Account Verification</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Verified</Badge>
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Settings className="w-4 h-4 mr-2" />
              Manage Security Settings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Security Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Security Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityLogs.length > 0 ? (
            <div className="space-y-3">
              {securityLogs.slice(0, 10).map((log: any, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(log.severity || 'low')}`} />
                    <div>
                      <p className="text-sm font-medium">{log.action || 'Security Event'}</p>
                      <p className="text-xs text-gray-600">{log.details || 'Security monitoring activity'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recently'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent security activity</p>
              <p className="text-sm">Your account security is being monitored</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityCenter;
