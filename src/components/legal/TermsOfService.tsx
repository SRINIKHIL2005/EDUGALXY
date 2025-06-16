import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface TermsOfServiceProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  asDialog?: boolean;
}

const TermsOfService: React.FC<TermsOfServiceProps> = ({ 
  isOpen, 
  onClose, 
  onAccept, 
  showAcceptButton = false,
  asDialog = true 
}) => {
  const content = (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-6">
          Effective Date: January 1, 2025 | Last Updated: June 15, 2025 | Version: 1.0
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">1. Platform Usage and Conduct</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            By using our Educational Feedback System, you agree to maintain professional conduct and use the platform responsibly.
          </p>
          <div>
            <h3 className="font-medium mb-2">Acceptable Use:</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Provide honest and constructive feedback</li>
              <li>Respect other users' privacy and opinions</li>
              <li>Use the platform for educational purposes only</li>
              <li>Report security issues or violations promptly</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">2. Prohibited Activities & Violations</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            The following activities are strictly prohibited and will result in enforcement action:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-800 mb-2">Severe Violations:</h3>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              <li><strong>Harassment or Bullying:</strong> Targeting individuals with offensive content</li>
              <li><strong>Academic Dishonesty:</strong> Cheating, plagiarism, or unauthorized collaboration</li>
              <li><strong>Impersonation:</strong> Pretending to be another person or entity</li>
              <li><strong>Security Threats:</strong> Attempting to breach system security</li>
            </ul>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-2">Moderate Violations:</h3>
            <ul className="list-disc list-inside text-sm text-orange-700 space-y-1">
              <li><strong>Spam:</strong> Posting irrelevant or repetitive content</li>
              <li><strong>Inappropriate Content:</strong> Sharing offensive or unsuitable material</li>
              <li><strong>Platform Abuse:</strong> Misusing system features or resources</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">3. Violation Enforcement & Consequences</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Violations are handled through a progressive enforcement system:
          </p>
          <div className="space-y-3">
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-yellow-800">1st Violation: Warning</h4>
              <p className="text-sm text-yellow-700">Official warning with educational resources</p>
            </div>
            <div className="border-l-4 border-orange-400 pl-4">
              <h4 className="font-medium text-orange-800">2nd Violation: Temporary Restriction</h4>
              <p className="text-sm text-orange-700">Limited access for 7-30 days</p>
            </div>
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="font-medium text-red-800">3rd Violation: Account Suspension</h4>
              <p className="text-sm text-red-700">Account suspended for review (30-90 days)</p>
            </div>
            <div className="border-l-4 border-gray-800 pl-4">
              <h4 className="font-medium text-gray-800">Severe/Repeated: Permanent Ban</h4>
              <p className="text-sm text-gray-700">Account permanently disabled</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">4. Reporting & Appeals</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Users can report violations through the Security Center. All reports are reviewed by our security team.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Appeal Process:</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Submit appeals within 30 days of enforcement action</li>
              <li>Provide evidence and explanation for your case</li>
              <li>Appeals are reviewed by a different team member</li>
              <li>Decisions are communicated within 5-10 business days</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">5. Data Security & Privacy</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            We implement comprehensive security measures to protect your data and maintain platform integrity.
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>End-to-end encryption for sensitive data</li>
            <li>Regular security audits and monitoring</li>
            <li>Violation tracking for safety purposes</li>
            <li>Compliance with educational data protection standards</li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">6. Platform Modifications</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            We reserve the right to modify these Terms of Service with advance notice. Users will be notified of significant changes and may need to re-accept updated terms.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">7. Contact Information</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            For questions about these terms, violations, or appeals:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Security Team: edugalxy@gmail.com</li>
            <li>Legal Team: edugalxy@gmail.com</li>
            <li>Appeals: edugalxy@gmail.com</li>
          </ul>
        </div>
      </section>

      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          By using this platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and all applicable violation policies.
        </p>
      </div>
    </div>
  );

  if (!asDialog) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {content}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service & Violation Policies</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          {content}
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showAcceptButton && onAccept && (
            <Button onClick={onAccept} className="bg-blue-600 hover:bg-blue-700">
              Accept Terms of Service
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfService;
