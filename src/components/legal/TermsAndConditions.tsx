import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface TermsAndConditionsProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  showAcceptButton?: boolean;
  asDialog?: boolean;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({
  isOpen,
  onClose,
  onAccept,
  showAcceptButton = false,
  asDialog = true
}) => {
  const currentDate = new Date().toLocaleDateString();

  const content = (
    <div className="space-y-6 text-sm">
      <div>
        <p className="text-xs text-gray-500 mb-4">Last updated: {currentDate}</p>
      </div>

      <section>
        <h3 className="font-semibold text-lg mb-3">1. Acceptance of Terms</h3>
        <p className="mb-2">
          By accessing and using the Educational Feedback & Grading (E-F-G) platform, you agree to be bound by these Terms and Conditions and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">2. User Accounts and Responsibilities</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>Users must provide accurate and complete information during registration</li>
          <li>Users are responsible for maintaining the confidentiality of their account credentials</li>
          <li>Users must notify administration immediately of any unauthorized use of their account</li>
          <li>Each user account is personal and non-transferable</li>
          <li>Users must not share account credentials with others</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">3. Acceptable Use Policy</h3>
        <p className="mb-2">Users agree to use the platform responsibly and in accordance with academic integrity policies. Prohibited activities include:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Submitting false or plagiarized content</li>
          <li>Attempting to access unauthorized areas of the platform</li>
          <li>Interfering with other users' access to the platform</li>
          <li>Using the platform for commercial purposes without authorization</li>
          <li>Violating any applicable laws or regulations</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">4. Academic Integrity</h3>
        <p>
          Users must adhere to all academic integrity policies of their educational institution. This includes but is not limited to avoiding plagiarism, cheating, unauthorized collaboration, and any form of academic dishonesty. Violations may result in immediate account suspension and reporting to relevant academic authorities.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">5. Privacy and Data Protection</h3>
        <p>
          Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using the platform, you consent to our data practices as described in the Privacy Policy.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">6. Intellectual Property</h3>
        <p className="mb-2">
          The platform and its content are protected by intellectual property laws. Users retain ownership of their submitted content but grant the platform necessary rights to provide educational services.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">7. Service Availability</h3>
        <p>
          While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to the platform. Maintenance, updates, or technical issues may temporarily affect service availability.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">8. Limitation of Liability</h3>
        <p>
          The platform is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">9. Account Termination</h3>
        <p>
          We reserve the right to suspend or terminate user accounts for violations of these terms, academic misconduct, or other reasonable causes. Users may request account deletion in accordance with our Privacy Policy.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">10. Modifications to Terms</h3>
        <p>
          These terms may be updated periodically to reflect changes in our services or legal requirements. Users will be notified of significant changes and continued use constitutes acceptance of modified terms.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">11. Governing Law</h3>
        <p>
          These Terms and Conditions are governed by and construed in accordance with the laws of the jurisdiction where the educational institution is located.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-lg mb-3">12. Contact Information</h3>
        <p>
          For questions about these Terms and Conditions, contact:
          <br />Email: edugalxy@gmail
          <br />Phone: +91 9014189362
        </p>
      </section>
    </div>
  );

  if (!asDialog) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Terms and Conditions</h1>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
          {content}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showAcceptButton && onAccept && (
            <Button onClick={onAccept}>
              Accept Terms
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {content}
        </ScrollArea>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {showAcceptButton && onAccept && (
            <Button onClick={onAccept}>
              Accept Terms
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAndConditions;
