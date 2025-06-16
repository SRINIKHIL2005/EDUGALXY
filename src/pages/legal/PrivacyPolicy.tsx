import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
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
                <Shield className="text-blue-600" />
                Privacy Policy
              </CardTitle>
              <p className="text-gray-600">Last updated: {currentDate}</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6">
                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Eye className="text-blue-600" size={20} />
                    Information We Collect
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Personal Information:</strong> Name, email address, student ID, department information, and academic records.</p>
                    <p><strong>Usage Data:</strong> Login timestamps, page views, feature usage, and interaction patterns.</p>
                    <p><strong>Technical Data:</strong> IP address, browser type, device information, and cookies.</p>
                    <p><strong>Academic Data:</strong> Feedback submissions, grades, attendance records, and course enrollments.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Database className="text-green-600" size={20} />
                    How We Use Your Information
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Educational Services:</strong> Providing personalized learning experiences and academic feedback.</p>
                    <p><strong>Communication:</strong> Sending important notifications about your academic progress.</p>
                    <p><strong>Analytics:</strong> Improving our platform through usage analysis and performance metrics.</p>
                    <p><strong>Security:</strong> Protecting against fraud, abuse, and unauthorized access.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Lock className="text-red-600" size={20} />
                    Data Protection & Security
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols.</p>
                    <p><strong>Access Controls:</strong> Strict role-based access controls limit data access to authorized personnel only.</p>
                    <p><strong>Regular Audits:</strong> We conduct regular security audits and vulnerability assessments.</p>
                    <p><strong>Data Backup:</strong> Regular automated backups ensure data integrity and availability.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Users className="text-purple-600" size={20} />
                    Data Sharing & Third Parties
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Educational Institution:</strong> We share academic data with your institution as required for educational purposes.</p>
                    <p><strong>Service Providers:</strong> Limited data sharing with trusted service providers under strict confidentiality agreements.</p>
                    <p><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights.</p>
                    <p><strong>No Commercial Use:</strong> We never sell your personal information to third parties for commercial purposes.</p>
                  </div>
                </section>

                <section>
                  <h2 className="flex items-center gap-2 text-xl font-semibold mb-4 text-gray-800">
                    <Gavel className="text-orange-600" size={20} />
                    Your Rights
                  </h2>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Access:</strong> Request access to your personal data and how it's being used.</p>
                    <p><strong>Correction:</strong> Request correction of inaccurate or incomplete personal data.</p>
                    <p><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements).</p>
                    <p><strong>Portability:</strong> Request a copy of your data in a portable format.</p>
                    <p><strong>Objection:</strong> Object to certain types of data processing.</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      For any privacy-related questions or concerns, please contact our Data Protection Officer:
                    </p>
                    <p className="mt-2 text-gray-700">
                      <strong>Email:</strong> privacy@efg-platform.edu<br />
                      <strong>Address:</strong> Educational Feedback Galaxy, Privacy Department<br />
                      <strong>Phone:</strong> +1 (555) 123-4567
                    </p>
                  </div>
                </section>

                <section className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Policy Updates</h3>
                  <p className="text-gray-700">
                    We may update this Privacy Policy periodically. We will notify you of any material changes 
                    by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                    Your continued use of our services after any changes constitutes acceptance of the updated policy.
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

export default PrivacyPolicyPage;
