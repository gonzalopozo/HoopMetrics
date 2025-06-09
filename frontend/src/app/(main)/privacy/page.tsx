import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Introduction</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            HoopMetrics ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                            explains how we collect, use, disclose, and safeguard your information when you visit our website 
                            and use our services.
                        </p>
                        <p>
                            Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, 
                            please do not access or use our Service.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Information We Collect</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h4 className="font-semibold">Personal Information</h4>
                        <p>We may collect the following personal information when you register or use our Service:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Username and email address</li>
                            <li>Password (encrypted)</li>
                            <li>Profile picture (optional)</li>
                            <li>Subscription and billing information</li>
                            <li>Favorite players and teams preferences</li>
                        </ul>

                        <h4 className="font-semibold mt-6">Usage Information</h4>
                        <p>We automatically collect certain information about your device and usage patterns:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>IP address and browser type</li>
                            <li>Device information and operating system</li>
                            <li>Pages visited and time spent on the Service</li>
                            <li>Search queries and interaction patterns</li>
                            <li>API usage and feature access logs</li>
                        </ul>

                        <h4 className="font-semibold mt-6">Cookies and Tracking</h4>
                        <p>We use cookies and similar technologies to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Maintain your login session</li>
                            <li>Remember your preferences and settings</li>
                            <li>Analyze usage patterns and improve our Service</li>
                            <li>Provide personalized content and recommendations</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. How We Use Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We use the collected information for the following purposes:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Service Provision:</strong> To provide, maintain, and improve our basketball analytics platform</li>
                            <li><strong>Account Management:</strong> To create and manage your user account and subscription</li>
                            <li><strong>Personalization:</strong> To customize your experience and provide relevant content</li>
                            <li><strong>Communication:</strong> To send service updates, newsletters, and important notifications</li>
                            <li><strong>Payment Processing:</strong> To process subscription payments through our payment provider</li>
                            <li><strong>Analytics:</strong> To analyze usage patterns and improve our features</li>
                            <li><strong>Security:</strong> To detect fraud, abuse, and ensure platform security</li>
                            <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. Information Sharing and Disclosure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We do not sell, trade, or rent your personal information. We may share your information only in the following circumstances:</p>
                        
                        <h4 className="font-semibold">Service Providers</h4>
                        <p>We work with trusted third-party service providers:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Stripe:</strong> For secure payment processing</li>
                            <li><strong>Cloud Hosting:</strong> For data storage and application hosting</li>
                            <li><strong>Analytics Tools:</strong> For usage analytics and performance monitoring</li>
                        </ul>

                        <h4 className="font-semibold mt-6">Legal Requirements</h4>
                        <p>We may disclose your information if required by law or to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Comply with legal processes or government requests</li>
                            <li>Protect our rights, property, or safety</li>
                            <li>Investigate potential violations of our Terms of Service</li>
                            <li>Prevent fraud or security threats</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Data Security</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We implement appropriate technical and organizational measures to protect your information:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Encryption of data in transit and at rest</li>
                            <li>Secure authentication using JWT tokens</li>
                            <li>Regular security audits and updates</li>
                            <li>Access controls and monitoring</li>
                            <li>Secure payment processing through PCI-compliant providers</li>
                        </ul>
                        <p className="mt-4">
                            However, no method of transmission over the internet or electronic storage is 100% secure. 
                            While we strive to protect your information, we cannot guarantee absolute security.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>6. Data Retention</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We retain your information for as long as necessary to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide our services and maintain your account</li>
                            <li>Comply with legal obligations</li>
                            <li>Resolve disputes and enforce our agreements</li>
                            <li>Improve our services through analytics</li>
                        </ul>
                        <p className="mt-4">
                            When you delete your account, we will delete or anonymize your personal information within 30 days, 
                            except as required for legal compliance or legitimate business purposes.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Your Rights and Choices</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You have the following rights regarding your personal information:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                            <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                            <li><strong>Portability:</strong> Request your data in a portable format</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                            <li><strong>Cookie Control:</strong> Manage cookie preferences in your browser</li>
                        </ul>
                        <p className="mt-4">
                            To exercise these rights, please contact us at privacy@hoopmetrics.com or through your account settings.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Children's Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Our Service is not intended for children under 13 years of age. We do not knowingly collect 
                            personal information from children under 13. If you are a parent or guardian and believe your 
                            child has provided personal information, please contact us to have the information removed.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>9. International Data Transfers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Your information may be transferred to and processed in countries other than your own. 
                            We ensure that such transfers comply with applicable data protection laws and implement 
                            appropriate safeguards to protect your information.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>10. Changes to This Privacy Policy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            We may update this Privacy Policy periodically to reflect changes in our practices or for 
                            legal, operational, or regulatory reasons. We will notify you of any material changes by:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Posting the updated policy on our website</li>
                            <li>Sending an email notification to registered users</li>
                            <li>Displaying a prominent notice on our Service</li>
                        </ul>
                        <p className="mt-4">
                            Your continued use of the Service after the effective date constitutes acceptance of the updated Privacy Policy.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>11. Contact Us</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, 
                            please contact us:
                        </p>
                        <div className="mt-4 space-y-1">
                            <p><strong>Email:</strong> privacy@hoopmetrics.com</p>
                            <p><strong>Data Protection Officer:</strong> dpo@hoopmetrics.com</p>
                            <p><strong>Address:</strong> HoopMetrics Privacy Team</p>
                            <p>123 Basketball Avenue</p>
                            <p>Sports City, SC 12345</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}