import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Database, Cpu, Zap, Globe, Mail, Phone, MapPin, Clock } from 'lucide-react';

interface PrivacyPolicyProps {
  isOpen: boolean;
  onClose: () => void;
  asDialog?: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ isOpen, onClose, asDialog = true }) => {
  const [glitchActive, setGlitchActive] = useState(false);
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 8000);

    return () => clearInterval(glitchInterval);
  }, []);

  const content = (
    <div className="space-y-8 text-sm relative text-gray-200">
      {/* Classification Header */}
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-400/30 rounded-lg p-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-2">
          <Lock className="w-4 h-4" />
          CLASSIFICATION: PUBLIC ACCESS | SECURITY LEVEL: MAXIMUM
        </div>
        <p className="text-cyan-200 font-mono text-sm">
          This document outlines the quantum-secured privacy protocols governing the collection, 
          processing, and protection of user data within our AI-powered educational neural network.
        </p>
      </div>

      {/* Section 1 */}
      <section className="bg-slate-800/50 border border-purple-400/20 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-purple-400 flex items-center gap-2">
          <Database className="w-6 h-6" />
          1. DATA ACQUISITION MATRIX
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded p-4 border border-blue-400/20">
            <h4 className="font-semibold mb-3 text-blue-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              BIOMETRIC & IDENTITY DATA:
            </h4>
            <ul className="space-y-2 text-gray-300 font-mono text-xs">
              <li>→ Neural ID signatures (name, email, student/employee ID)</li>
              <li>→ Academic classification data (department, role, clearance level)</li>
              <li>→ Communication vectors (phone, address, preferences)</li>
              <li>→ Behavioral pattern matrices</li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded p-4 border border-green-400/20">
            <h4 className="font-semibold mb-3 text-green-400 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              ACADEMIC NEURAL NETWORK DATA:
            </h4>
            <ul className="space-y-2 text-gray-300 font-mono text-xs">
              <li>→ Learning pathway enrollments & progress tracking</li>
              <li>→ Assignment submissions & neural evaluation data</li>
              <li>→ AI-powered feedback algorithms & scoring matrices</li>
              <li>→ Quantum attendance verification logs</li>
            </ul>
          </div>
        </div>

        <div className="mt-4 bg-slate-900/50 rounded p-4 border border-cyan-400/20">
          <h4 className="font-semibold mb-3 text-cyan-400 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            SYSTEM TELEMETRY & INTERACTION DATA:
          </h4>
          <ul className="space-y-2 text-gray-300 font-mono text-xs">
            <li>→ Login timestamps & neural session analytics</li>
            <li>→ Navigation patterns & interface optimization metrics</li>
            <li>→ Device fingerprints & quantum security tokens</li>
            <li>→ Error reports & system diagnostic logs</li>
          </ul>
        </div>
      </section>

      {/* Section 2 */}
      <section className="bg-slate-800/50 border border-green-400/20 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-green-400 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          2. NEURAL DATA PROCESSING PROTOCOLS
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded p-4 border border-yellow-400/20">
            <div className="text-yellow-400 font-semibold mb-2">⚡ REAL-TIME ANALYTICS</div>
            <div className="text-gray-300 font-mono text-xs">AI-powered learning pattern analysis for personalized education delivery</div>
          </div>
          <div className="bg-slate-900/50 rounded p-4 border border-purple-400/20">
            <div className="text-purple-400 font-semibold mb-2">🧠 NEURAL ALGORITHMS</div>
            <div className="text-gray-300 font-mono text-xs">Advanced machine learning for academic performance optimization</div>
          </div>
          <div className="bg-slate-900/50 rounded p-4 border border-cyan-400/20">
            <div className="text-cyan-400 font-semibold mb-2">🔐 QUANTUM ENCRYPTION</div>
            <div className="text-gray-300 font-mono text-xs">Military-grade protection for all data transmission and storage</div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-400/30 rounded">
          <h4 className="text-blue-400 font-semibold mb-3">🎯 LEGAL BASIS FOR PROCESSING:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300 font-mono text-xs">
            <div>
              <strong className="text-green-400">Academic Contract:</strong> Essential for educational service delivery
            </div>
            <div>
              <strong className="text-yellow-400">Legitimate Interest:</strong> Platform optimization & security monitoring
            </div>
            <div>
              <strong className="text-purple-400">Legal Compliance:</strong> Regulatory requirements & audit trails
            </div>
            <div>
              <strong className="text-cyan-400">Consent:</strong> Marketing communications & optional features
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 - Data Sharing */}
      <section className="bg-slate-800/50 border border-red-400/20 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-red-400 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          3. QUANTUM DATA SHARING MATRIX
        </h3>
        
        <div className="bg-red-900/20 border border-red-400/30 rounded p-4 mb-4">
          <div className="text-red-400 font-bold mb-2">🚨 ZERO-TRUST POLICY</div>
          <p className="text-gray-300 font-mono text-sm">
            Your data is NEVER sold, traded, or shared for commercial purposes. Our quantum-secured 
            architecture ensures maximum protection with minimal necessary disclosure.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 rounded p-4 border border-green-400/20">
            <h4 className="text-green-400 font-semibold mb-3">✅ AUTHORIZED PARTNERS:</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-xs">
              <li>→ Educational institutions (for academic verification only)</li>
              <li>→ Quantum cloud infrastructure providers (encrypted data only)</li>
              <li>→ AI processing partners (anonymized analytics only)</li>
              <li>→ Legal authorities (court orders & emergency situations only)</li>
            </ul>
          </div>

          <div className="bg-slate-900/50 rounded p-4 border border-red-400/20">
            <h4 className="text-red-400 font-semibold mb-3">❌ PROHIBITED SHARING:</h4>
            <ul className="space-y-2 text-gray-300 font-mono text-xs">
              <li>→ Third-party advertisers or marketing companies</li>
              <li>→ Data brokers or commercial aggregators</li>
              <li>→ Social media platforms or external networks</li>
              <li>→ Non-educational commercial entities</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 4 - User Rights */}
      <section className="bg-slate-800/50 border border-cyan-400/20 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-cyan-400 flex items-center gap-2">
          <Lock className="w-6 h-6" />
          4. YOUR NEURAL RIGHTS & CONTROLS
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4 border border-blue-400/20">
              <div className="text-blue-400 font-semibold mb-2">📊 ACCESS & PORTABILITY</div>
              <div className="text-gray-300 font-mono text-xs">Request complete data export in machine-readable format</div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 border border-green-400/20">
              <div className="text-green-400 font-semibold mb-2">✏️ RECTIFICATION</div>
              <div className="text-gray-300 font-mono text-xs">Update or correct any inaccurate personal information</div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 border border-red-400/20">
              <div className="text-red-400 font-semibold mb-2">🗑️ ERASURE ("RIGHT TO BE FORGOTTEN")</div>
              <div className="text-gray-300 font-mono text-xs">Complete data deletion with quantum-level verification</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900/50 rounded p-4 border border-purple-400/20">
              <div className="text-purple-400 font-semibold mb-2">⏸️ PROCESSING RESTRICTION</div>
              <div className="text-gray-300 font-mono text-xs">Limit how your data is processed while maintaining account</div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 border border-yellow-400/20">
              <div className="text-yellow-400 font-semibold mb-2">🚫 OBJECTION</div>
              <div className="text-gray-300 font-mono text-xs">Opt-out of specific data processing activities</div>
            </div>
            <div className="bg-slate-900/50 rounded p-4 border border-blue-400/20">
              <div className="text-blue-400 font-semibold mb-2">📉 DATA MINIMIZATION</div>
              <div className="text-gray-300 font-mono text-xs">Collection limited to essential data only - zero waste policy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - With Real Info */}
      <section className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border-2 border-cyan-400/50 rounded-lg p-6">
        <h3 className="font-bold text-2xl mb-4 text-cyan-400 flex items-center gap-2">
          <Mail className="w-8 h-8" />
          SECURE COMMUNICATION CHANNELS
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900/70 rounded-lg p-4 border border-cyan-400/30">
            <div className="flex items-center gap-2 text-cyan-400 font-bold mb-3">
              <Shield className="w-5 h-5" />
              CHIEF DATA PROTECTION OFFICER
            </div>
            <div className="space-y-3 text-gray-300 font-mono">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>your.email@example.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>Your Address, City, State, ZIP</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span>Available: 24/7 Quantum Response</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/70 rounded-lg p-4 border border-purple-400/30">
            <div className="text-purple-400 font-bold mb-3">🔐 EMERGENCY PROTOCOLS</div>
            <div className="space-y-2 text-gray-300 font-mono text-xs">
              <div>→ Immediate Response: &lt;1 hour</div>
              <div>→ Data Breach Notification: &lt;72 hours</div>
              <div>→ Quantum-encrypted communication channels</div>
              <div>→ Secure voice verification protocols</div>
              <div>→ Neural priority escalation matrix</div>
            </div>
            
            <div className="mt-4 p-3 bg-red-900/30 border border-red-400/30 rounded">
              <div className="text-red-400 font-semibold text-sm">🚨 EMERGENCY PRIVACY BREACH</div>
              <div className="text-red-300 font-mono text-xs mt-1">
                Contact immediately for quantum-level security incidents
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-slate-900/50 rounded-lg p-4 border border-yellow-400/20">
          <div className="text-yellow-400 font-semibold mb-2">⚖️ SUPERVISORY AUTHORITY</div>
          <p className="text-gray-300 font-mono text-sm">
            You have the right to lodge a complaint with your local data protection authority 
            if you believe your neural privacy rights have been compromised. Our quantum legal 
            compliance matrix ensures full cooperation with all regulatory investigations.
          </p>
        </div>
      </section>

      {/* Final Section */}
      <section className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-400/30 rounded-lg p-6">
        <h3 className="font-bold text-xl mb-4 text-green-400 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          NEURAL PROTOCOL UPDATES
        </h3>
        <p className="text-gray-300 mb-4">
          Privacy protocol modifications are transmitted through quantum-encrypted channels:
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900/50 rounded p-3 border border-cyan-400/20">
            <div className="text-cyan-400 font-semibold">📧 Neural Email</div>
            <div className="text-gray-300 font-mono text-xs mt-1">Instant notifications to all users</div>
          </div>
          <div className="bg-slate-900/50 rounded p-3 border border-purple-400/20">
            <div className="text-purple-400 font-semibold">🚨 Platform Alerts</div>
            <div className="text-gray-300 font-mono text-xs mt-1">Prominent system-wide notices</div>
          </div>
          <div className="bg-slate-900/50 rounded p-3 border border-green-400/20">
            <div className="text-green-400 font-semibold">📅 Version Control</div>
            <div className="text-gray-300 font-mono text-xs mt-1">Updated timestamp verification</div>
          </div>
        </div>
      </section>
    </div>
  );

  if (!asDialog) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/30 text-white rounded-lg">
        {/* Matrix-style background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-purple-400/10"></div>
        </div>

        <div className="relative">
          <div className={`text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3 mb-4 ${glitchActive ? 'animate-pulse' : ''}`}>
            <Shield className="w-8 h-8 text-cyan-400" />
            NEURAL PRIVACY PROTOCOLS
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-cyan-300 font-mono text-sm mb-6">
            🔒 QUANTUM-ENCRYPTED DATA PROTECTION MATRIX | LAST UPDATED: {currentDate}
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-4 relative">
          {/* Scan lines effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
          </div>
          {content}
        </div>

        <div className="flex justify-end mt-6 relative">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono px-8 py-3 text-lg"
          >
            NEURAL PROTOCOL ACKNOWLEDGED
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/30 text-white">
        {/* Matrix-style background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-purple-400/10"></div>
        </div>

        <DialogHeader className="relative">
          <DialogTitle className={`text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3 ${glitchActive ? 'animate-pulse' : ''}`}>
            <Shield className="w-8 h-8 text-cyan-400" />
            NEURAL PRIVACY PROTOCOLS
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </DialogTitle>
          <p className="text-cyan-300 font-mono text-sm mt-2">
            🔒 QUANTUM-ENCRYPTED DATA PROTECTION MATRIX | LAST UPDATED: {currentDate}
          </p>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4 relative bg-transparent">
          {/* Scan lines effect */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
          </div>
          {content}
        </ScrollArea>
        
        <div className="flex justify-end mt-6 relative">
          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-mono px-8 py-3 text-lg"
          >
            NEURAL PROTOCOL ACKNOWLEDGED
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicy;
