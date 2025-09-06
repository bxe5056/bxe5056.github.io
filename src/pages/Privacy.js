import React from "react";
import PageContainer from "../components/common/PageContainer";
import { FaShieldAlt, FaCookie, FaDatabase, FaUserShield, FaEnvelope, FaCalendar } from "react-icons/fa";

const Privacy = () => {
  const sections = [
    {
      title: "Information We Collect",
      icon: FaDatabase,
      content: [
        "Personal information you provide when contacting me through forms or email",
        "Usage data including pages visited, time spent, and browser information",
        "Technical information such as IP address, device type, and operating system",
        "Analytics data to understand website performance and user behavior"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: FaUserShield,
      content: [
        "To respond to your inquiries and professional communications",
        "To improve website functionality and user experience",
        "To analyze website traffic and usage patterns",
        "To maintain website security and prevent abuse"
      ]
    },
    {
      title: "Information Sharing",
      icon: FaShieldAlt,
      content: [
        "I do not sell or trade your personal information to third parties for marketing purposes",
        "Information may be shared with trusted third-party service providers (like analytics tools) who assist in website operation",
        "Data may be disclosed if required by law or to protect rights and safety",
        "Anonymous, aggregated data may be used for professional portfolio or statistical purposes"
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: FaCookie,
      content: [
        "This website uses cookies to enhance user experience and gather analytics",
        "Analytics cookies help understand how visitors interact with the website",
        "You can disable cookies in your browser settings, though some features may be limited",
        "Third-party services may set their own cookies"
      ]
    },
    {
      title: "Data Security",
      icon: FaShieldAlt,
      content: [
        "I implement appropriate security measures to protect your personal information",
        "Data transmission is secured using industry-standard encryption",
        "Access to personal information is restricted to authorized personnel only",
        "Regular security assessments are conducted to maintain data protection"
      ]
    },
    {
      title: "Your Rights",
      icon: FaUserShield,
      content: [
        "You have the right to access, update, or delete your personal information (that said, I probably don't have any to begin with)",
        "You can opt-out of communications at any time",
        "You can request information about how your data is being used",
        "You can file complaints with relevant data protection authorities"
      ]
    }
  ];

  const lastUpdated = "September 5, 2025";

  return (
    <PageContainer
      title="Privacy Policy"
      subtitle="How I collect, use, and protect your personal information"
    >
      <div className="max-w-4xl mx-auto">
        {/* Last Updated */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-2 text-blue-800">
            <FaCalendar className="text-sm" />
            <span className="font-medium">Last Updated: {lastUpdated}</span>
          </div>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            This Privacy Policy describes how Benjamin Eppinger ("I", "me", or "my") collects, 
            uses, and protects information when you visit this portfolio website and any subdomains. I am committed 
            to ensuring that your privacy is protected and that any information you provide is 
            handled responsibly and in accordance with applicable privacy laws.
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <section.icon className="text-xl text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
              </div>
              <ul className="space-y-3">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-600 leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Third-Party Services */}
        <div className="bg-white rounded-xl shadow-md p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Third-Party Services</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Analytics Services</h3>
              <p className="text-gray-600 leading-relaxed">
                This website uses analytics services such as PostHog and LogRocket to understand 
                user behavior and improve the website experience. These services may collect 
                information about your visit, including pages viewed, time spent, and technical 
                information about your device. Additionally, unless you specifically opt-in or 
                it is otherwise noted or assumed (like a contact form), any files or text that 
                you enter into the website is generally obscured or otherwise hidden from the 
                analytics services.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Hosting Services</h3>
              <p className="text-gray-600 leading-relaxed">
                This website is hosted on GitHub Pages and routed through Namecheap, which may 
                collect standard web server logs including IP addresses, browser information, 
                and access times as part of their service operation.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl shadow-md p-8 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <FaEnvelope className="text-2xl text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-800">Questions or Concerns?</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have any questions about this Privacy Policy or how your information is 
            handled, please don't hesitate to contact me:
          </p>
          <div className="space-y-2">
            <p className="text-gray-700">
              <strong>Email:</strong> <a href="mailto:privacy@bentheitguy.me" className="text-primary-600 hover:text-primary-700 ml-1 underline">privacy@bentheitguy.me</a>
            </p>
            <p className="text-gray-700">
              <strong>LinkedIn:</strong> 
              <a 
                href="https://www.linkedin.com/in/benjamindeppingerpsu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 ml-1 underline"
              >
                Let's Connect
              </a>
            </p>
          </div>
        </div>

        {/* Changes to Policy */}
        <div className="bg-white rounded-xl shadow-md p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            I may update this Privacy Policy from time to time to reflect changes in my practices 
            or for other operational, legal, or regulatory reasons. When I make changes, I will 
            update the "Last Updated" date at the top of this policy. I encourage you to review 
            this Privacy Policy periodically to stay informed about how I am protecting your information.
          </p>
        </div>

        {/* Consent */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">
          <p className="text-green-800 leading-relaxed">
            <strong>By using this website, you consent to the collection and use of information 
            in accordance with this Privacy Policy.</strong> If you do not agree with this policy, 
            please do not use this website.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Privacy;
