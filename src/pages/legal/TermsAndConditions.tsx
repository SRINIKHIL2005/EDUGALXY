import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ScrollText, GraduationCap, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsAndConditionsPage = () => {
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
                <ScrollText className="text-blue-600" />
                Terms and Conditions
              </CardTitle>
              <p className="text-gray-600">Last updated: {currentDate}</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6">
                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <GraduationCap className="text-blue-600" size={20} />
                    Academic Integrity Requirements
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Honor Code:</strong> All users must maintain the highest standards of academic integrity.</p>
                    <p><strong>Original Work:</strong> All submissions must be original and properly attributed.</p>
                    <p><strong>Collaboration Guidelines:</strong> Follow institutional policies regarding collaborative work.</p>
                    <p><strong>Citation Standards:</strong> Properly cite all sources and references in academic work.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <CheckCircle className="text-green-600" size={20} />
                    Acceptable Use Guidelines
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Educational Purpose:</strong> Platform use must align with educational objectives.</p>
                    <p><strong>Respectful Communication:</strong> Maintain professional and respectful interactions.</p>
                    <p><strong>Resource Sharing:</strong> Share educational resources appropriately and legally.</p>
                    <p><strong>Technical Compliance:</strong> Follow all technical guidelines and system limitations.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <XCircle className="text-red-600" size={20} />
                    Prohibited Conduct
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Academic Dishonesty:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Plagiarism in any form</li>
                      <li>Unauthorized collaboration on individual assignments</li>
                      <li>Cheating during assessments or quizzes</li>
                      <li>Falsification of academic records</li>
                    </ul>
                    <p><strong>Technical Violations:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Attempting to hack or compromise system security</li>
                      <li>Sharing login credentials with others</li>
                      <li>Automated data scraping or bot usage</li>
                      <li>Overloading system resources</li>
                    </ul>
                    <p><strong>Behavioral Violations:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Harassment, bullying, or discriminatory behavior</li>
                      <li>Sharing inappropriate or offensive content</li>
                      <li>Impersonating other users or staff</li>
                      <li>Commercial solicitation or spam</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Clock className="text-purple-600" size={20} />
                    Platform Usage Policies
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Session Management:</strong> Automatic logout after 30 minutes of inactivity for security.</p>
                    <p><strong>Data Storage:</strong> User data is retained according to institutional policies and legal requirements.</p>
                    <p><strong>Backup Policy:</strong> Regular automated backups ensure data integrity and availability.</p>
                    <p><strong>Maintenance Windows:</strong> Scheduled maintenance may temporarily restrict access with advance notice.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <AlertCircle className="text-orange-600" size={20} />
                    Enforcement Procedures
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Investigation Process:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Automated monitoring for policy violations</li>
                      <li>Manual review of reported incidents</li>
                      <li>Documentation of all violation evidence</li>
                      <li>Fair and timely resolution process</li>
                    </ul>
                    <p><strong>Penalty Structure:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li><strong>Minor Violations:</strong> Warning + mandatory training</li>
                      <li><strong>Moderate Violations:</strong> Temporary suspension (24-72 hours)</li>
                      <li><strong>Severe Violations:</strong> Extended suspension or account termination</li>
                      <li><strong>Critical Violations:</strong> Immediate termination + institutional reporting</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">User Responsibilities</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Account Management:</strong> Keep login credentials secure and report unauthorized access immediately.</p>
                    <p><strong>Content Accuracy:</strong> Ensure all submitted information is accurate and up-to-date.</p>
                    <p><strong>System Resources:</strong> Use platform resources efficiently and responsibly.</p>
                    <p><strong>Policy Compliance:</strong> Stay informed about policy updates and changes.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Platform Obligations</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Service Quality:</strong> Maintain high standards of platform performance and reliability.</p>
                    <p><strong>Data Protection:</strong> Implement robust security measures to protect user data.</p>
                    <p><strong>Fair Treatment:</strong> Apply policies consistently and fairly across all users.</p>
                    <p><strong>Transparency:</strong> Provide clear information about policies and procedures.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Dispute Resolution</h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Internal Appeals:</strong> First-level appeals through platform administration.</p>
                    <p><strong>Institutional Review:</strong> Second-level appeals through academic institution processes.</p>
                    <p><strong>External Mediation:</strong> Third-party mediation for unresolved disputes.</p>
                    <p><strong>Timeline:</strong> All appeals must be submitted within 14 days of the initial decision.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      For questions about these Terms and Conditions:
                    </p>
                    <p className="mt-2 text-gray-700">
                      <strong>Academic Affairs:</strong> academic@efg-platform.edu<br />
                      <strong>Technical Support:</strong> support@efg-platform.edu<br />
                      <strong>Policy Questions:</strong> policy@efg-platform.edu<br />
                      <strong>Phone:</strong> +1 (555) 123-4567
                    </p>
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Policy Updates</h3>
                  <p className="text-gray-700">
                    These Terms and Conditions may be updated periodically to reflect changes in our services, 
                    legal requirements, or institutional policies. Users will be notified of significant changes 
                    and may be required to re-accept updated terms.
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

export default TermsAndConditionsPage;
