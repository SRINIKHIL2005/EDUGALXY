import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, Scale, Shield, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-3xl">
                <FileText className="text-blue-600" />
                Terms of Service
              </CardTitle>
              <p className="text-gray-600">Last updated: {currentDate}</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6">
                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Users className="text-blue-600" size={20} />
                    Acceptance of Terms
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p>By accessing or using the Educational Feedback Galaxy platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
                    <p>If you do not agree with any of these terms, you are prohibited from using or accessing this platform.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Settings className="text-green-600" size={20} />
                    Use License & Restrictions
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Permitted Use:</strong> Educational purposes, feedback submission, attendance tracking, and academic collaboration.</p>
                    <p><strong>Prohibited Activities:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Unauthorized access to other users' accounts or data</li>
                      <li>Distribution of malware, viruses, or harmful code</li>
                      <li>Harassment, bullying, or inappropriate behavior</li>
                      <li>Academic dishonesty, including cheating or plagiarism</li>
                      <li>Commercial use without explicit permission</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <AlertTriangle className="text-red-600" size={20} />
                    Violation Policy & Enforcement
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Three-Strike System:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>First Violation:</strong> Warning with mandatory policy review</li>
                      <li><strong>Second Violation:</strong> 48-hour account suspension</li>
                      <li><strong>Third Violation:</strong> Permanent account termination</li>
                    </ul>
                    <p><strong>Severe Violations:</strong> Actions involving security breaches, harassment, or academic dishonesty may result in immediate suspension or termination.</p>
                    <p><strong>Appeal Process:</strong> Users may appeal violations within 7 days through our formal review process.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Shield className="text-purple-600" size={20} />
                    Security & Privacy
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Account Security:</strong> Users are responsible for maintaining the confidentiality of their login credentials.</p>
                    <p><strong>Data Protection:</strong> We implement industry-standard security measures to protect user data.</p>
                    <p><strong>Privacy Compliance:</strong> Our data handling practices comply with applicable privacy laws and regulations.</p>
                    <p><strong>Incident Reporting:</strong> Security incidents must be reported immediately to our security team.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Scale className="text-orange-600" size={20} />
                    Liability & Disclaimers
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Service Availability:</strong> While we strive for 99.9% uptime, we cannot guarantee uninterrupted service availability.</p>
                    <p><strong>Data Accuracy:</strong> Users are responsible for the accuracy of information they provide.</p>
                    <p><strong>Third-Party Integration:</strong> We are not liable for issues arising from third-party services or integrations.</p>
                    <p><strong>Educational Outcomes:</strong> The platform is a tool to support education but does not guarantee specific academic outcomes.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Intellectual Property</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Platform Content:</strong> All original content, features, and functionality are owned by Educational Feedback Galaxy.</p>
                    <p><strong>User Content:</strong> Users retain ownership of their submitted content but grant us license to use it for platform operations.</p>
                    <p><strong>Academic Work:</strong> Student submissions remain the intellectual property of the student and educational institution.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Termination</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>User Termination:</strong> Users may terminate their account at any time through account settings.</p>
                    <p><strong>Platform Termination:</strong> We reserve the right to terminate accounts that violate these terms.</p>
                    <p><strong>Data Retention:</strong> Upon termination, personal data will be deleted within 30 days, except as required by law.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      For questions about these Terms of Service:
                    </p>
                    <p className="mt-2 text-gray-700">
                      <strong>Email:</strong> legal@efg-platform.edu<br />
                      <strong>Address:</strong> Educational Feedback Galaxy, Legal Department<br />
                      <strong>Phone:</strong> +1 (555) 123-4567
                    </p>
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Changes to Terms</h3>
                  <p className="text-gray-700">
                    We reserve the right to modify these terms at any time. Users will be notified of material changes 
                    via email and platform notifications. Continued use of the platform after changes constitutes 
                    acceptance of the updated terms.
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
