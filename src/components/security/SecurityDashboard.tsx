import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Lock,
  Activity,
  Users,
  FileText,
  Settings
} from 'lucide-react';

interface SecurityMetrics {
  securityScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeThreats: number;
  blockedAttempts: number;
  recentViolations: number;
  accountsUnderReview: number;
}

interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  status: 'active' | 'resolved' | 'investigating';
}

interface ViolationSummary {
  type: string;
  count: number;
  severity: string;
  trend: 'up' | 'down' | 'stable';
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    securityScore: 85,
    threatLevel: 'low',
    activeThreats: 2,
    blockedAttempts: 147,
    recentViolations: 5,
    accountsUnderReview: 3
  });

  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'failed_login',
      severity: 'medium',
      description: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      userId: 'user123',
      userName: 'john.doe@university.edu',
      status: 'investigating'
    },
    {
      id: '2',
      type: 'rate_limit_exceeded',
      severity: 'low',
      description: 'API rate limit exceeded',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      userId: 'user456',
      userName: 'jane.smith@university.edu',
      status: 'resolved'
    },
    {
      id: '3',
      type: 'suspicious_activity',
      severity: 'high',
      description: 'Unusual access pattern detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      userId: 'user789',
      userName: 'suspicious.user@university.edu',
      status: 'active'
    }
  ]);

  const [violationSummary, setViolationSummary] = useState<ViolationSummary[]>([
    { type: 'Failed Login Attempts', count: 23, severity: 'medium', trend: 'down' },
    { type: 'Rate Limit Violations', count: 15, severity: 'low', trend: 'stable' },
    { type: 'Academic Misconduct', count: 2, severity: 'high', trend: 'down' },
    { type: 'Inappropriate Content', count: 8, severity: 'medium', trend: 'up' },
    { type: 'Security Violations', count: 1, severity: 'critical', trend: 'stable' }
  ]);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage platform security across all users and systems
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Security Settings
          </Button>
          <Button size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSecurityScoreColor(metrics.securityScore)}`}>
              {metrics.securityScore}%
            </div>
            <Progress value={metrics.securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Overall platform security health
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge className={getThreatLevelColor(metrics.threatLevel)}>
                {metrics.threatLevel.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current security threat assessment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Threats</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.activeThreats}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Threats requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Attempts</CardTitle>
            <Lock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.blockedAttempts}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Attacks prevented in last 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  {getSeverityIcon(event.severity)}
                  <div>
                    <div className="font-medium">{event.description}</div>
                    <div className="text-sm text-gray-600">
                      {event.userName && `User: ${event.userName} • `}
                      Type: {event.type.replace('_', ' ')} • 
                      {event.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={event.status === 'active' ? 'destructive' : 
                           event.status === 'investigating' ? 'default' : 'secondary'}
                  >
                    {event.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Investigate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Violation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Violation Summary (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {violationSummary.map((violation, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{violation.type}</h4>
                  <span className="text-2xl">{getTrendIcon(violation.trend)}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl font-bold">{violation.count}</span>
                  <Badge className={getThreatLevelColor(violation.severity)}>
                    {violation.severity}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  Trend: {violation.trend} compared to previous week
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <div className="space-y-3">
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Security Notice:</strong> Unusual login patterns detected from multiple IP addresses. 
            Consider enabling additional authentication requirements.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>System Update:</strong> Security patches applied successfully. 
            All known vulnerabilities have been addressed.
          </AlertDescription>
        </Alert>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Security Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Lock className="w-6 h-6" />
              <span>Force Password Reset</span>
              <span className="text-xs text-gray-600">For suspicious accounts</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Users className="w-6 h-6" />
              <span>Review Flagged Users</span>
              <span className="text-xs text-gray-600">{metrics.accountsUnderReview} accounts pending</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <Activity className="w-6 h-6" />
              <span>Run Security Scan</span>
              <span className="text-xs text-gray-600">Full system check</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
