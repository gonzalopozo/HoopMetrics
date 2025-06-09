import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
                <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Acceptance of Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            By accessing and using HoopMetrics ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                            If you do not agree to abide by the above, please do not use this service.
                        </p>
                        <p>
                            These Terms of Service ("Terms") govern your use of our website located at hoopmetrics.com and our mobile application 
                            (together or individually "Service") operated by HoopMetrics ("us", "we", or "our").
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>2. Description of Service</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            HoopMetrics provides NBA statistics, analytics, and basketball-related data visualization services. 
                            Our platform offers various subscription tiers:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong>Free:</strong> Basic player and team statistics with limited features</li>
                            <li><strong>Premium:</strong> Advanced analytics, derived statistics, and enhanced visualizations</li>
                            <li><strong>Ultimate:</strong> Complete access to all features, including advanced impact metrics and unlimited favorites</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>3. User Accounts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            To access certain features of the Service, you must register for an account. You agree to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Provide accurate, current, and complete information during registration</li>
                            <li>Maintain and update your account information</li>
                            <li>Maintain the security of your password and account</li>
                            <li>Accept responsibility for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized use of your account</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>4. Subscription and Payment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            <strong>Billing:</strong> Subscription fees are billed in advance on a monthly or annual basis. 
                            Payment is processed through our secure payment provider Stripe.
                        </p>
                        <p>
                            <strong>Refunds:</strong> We offer a 14-day money-back guarantee for all paid subscriptions. 
                            Refund requests must be made within 14 days of the initial purchase.
                        </p>
                        <p>
                            <strong>Cancellation:</strong> You may cancel your subscription at any time from your account settings. 
                            Cancellation takes effect at the end of your current billing period.
                        </p>
                        <p>
                            <strong>Price Changes:</strong> We reserve the right to modify subscription pricing with 30 days advance notice.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>5. Acceptable Use</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>You agree not to use the Service to:</p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit harmful, offensive, or inappropriate content</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Use automated scripts or bots to scrape data</li>
                            <li>Resell or redistribute our data without permission</li>
                            <li>Interfere with or disrupt the Service</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>6. Data and Privacy</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Your privacy is important to us. Our collection and use of personal information is governed by our 
                            Privacy Policy, which is incorporated into these Terms by reference.
                        </p>
                        <p>
                            We use NBA statistics and data from publicly available sources. All statistical data is provided for 
                            informational and entertainment purposes only.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>7. Intellectual Property</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            The Service and its original content, features, and functionality are owned by HoopMetrics and are 
                            protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                        <p>
                            NBA team names, logos, and statistics are the property of the National Basketball Association and 
                            respective teams. We use this information under fair use for statistical and informational purposes.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>8. Disclaimer and Limitation of Liability</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, 
                            completeness, or reliability of any statistical data or analytics.
                        </p>
                        <p>
                            To the maximum extent permitted by law, HoopMetrics shall not be liable for any indirect, incidental, 
                            special, consequential, or punitive damages resulting from your use of the Service.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>9. Termination</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            We may terminate or suspend your account and access to the Service immediately, without prior notice, 
                            for any reason, including if you breach these Terms.
                        </p>
                        <p>
                            Upon termination, your right to use the Service will cease immediately. All provisions that should 
                            survive termination will remain in effect.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>10. Changes to Terms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify users of any material changes 
                            via email or through the Service. Continued use of the Service after changes constitutes acceptance 
                            of the new Terms.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>11. Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            If you have any questions about these Terms of Service, please contact us at:
                        </p>
                        <div className="mt-4 space-y-1">
                            <p><strong>Email:</strong> legal@hoopmetrics.com</p>
                            <p><strong>Address:</strong> HoopMetrics Legal Department</p>
                            <p>123 Basketball Avenue</p>
                            <p>Sports City, SC 12345</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}