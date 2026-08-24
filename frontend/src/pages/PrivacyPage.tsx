import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Shield,
  Database,
  Lock,
  Eye,
  Server,
  Key,
  HardDrive,
  UserCheck,
  Trash2,
  Baby,
  ExternalLink,
  HelpCircle,
  Clock,
  Layers,
  Cpu,
} from 'lucide-react'
import { LegalLayout, type TocSection } from '@/components/layout/LegalLayout'

const SECTIONS: TocSection[] = [
  { id: 'introduction', title: 'Introduction', icon: FileText },
  { id: 'information-collected', title: 'Information We Collect', icon: Database },
  { id: 'how-we-use-info', title: 'How We Use Information', icon: Cpu },
  { id: 'how-we-share-info', title: 'How We Share Information', icon: Layers },
  { id: 'service-providers', title: 'Service Providers & Integrations', icon: Server },
  { id: 'storage-security', title: 'Data Storage & Security', icon: Lock },
  { id: 'authentication-security', title: 'Authentication & Account Security', icon: Key },
  { id: 'cookies-localstorage', title: 'Local Storage & Client State', icon: HardDrive },
  { id: 'data-retention', title: 'Data Retention Policies', icon: Clock },
  { id: 'user-rights', title: 'User Rights & Choices', icon: UserCheck },
  { id: 'account-deletion', title: 'Account Deletion & Data Requests', icon: Trash2 },
  { id: 'children-privacy', title: "Children's Privacy", icon: Baby },
  { id: 'third-party-links', title: 'Third-Party Links & Services', icon: ExternalLink },
  { id: 'policy-changes', title: 'Changes to This Privacy Policy', icon: FileText },
  { id: 'contact-info', title: 'Contact Information', icon: HelpCircle },
]

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="Learn how PropertyPro collects, protects, processes, and respects your personal and tenancy information."
      lastUpdated="August 21, 2026"
      sections={SECTIONS}
    >
      {/* 1. Introduction */}
      <section id="introduction" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">1. Introduction</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          At <strong className="text-text font-semibold">PropertyPro</strong>, we are committed to safeguarding your privacy and protecting the confidentiality of your personal, financial, and tenancy information. This Privacy Policy outlines how PropertyPro collects, uses, stores, shares, and protects information when you access or use our property management platform, public marketplace, APIs, and associated web services.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          By accessing or using PropertyPro, you acknowledge the data collection and processing practices described in this Privacy Policy. If you do not agree with our policies and practices, please do not use our platform.
        </p>
      </section>

      {/* 2. Information We Collect */}
      <section id="information-collected" className="scroll-mt-28 space-y-5 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">2. Information We Collect</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro collects information directly provided by you, generated through your use of platform features, or automatically transmitted by your web browser:
        </p>

        <div className="space-y-4 pt-2">
          {/* Account Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Account & Profile Information
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              When registering or managing your profile, we collect your full name, email address, cryptographic password hash (passwords are never stored in plain text), telephone number, assigned user role (such as Tenant, Owner, Admin, or Super Admin), and account approval status.
            </p>
          </div>

          {/* Property & Listing Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Property & Listing Information
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              For property owners and managers, we collect property names, physical addresses, unit numbers, total unit capacities, monthly rental prices, security deposit requirements, square footage, bedroom/bathroom configurations, amenity checklists, and property photos uploaded to our cloud media service.
            </p>
          </div>

          {/* Rental Request Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Rental Request & Application Information
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              When you submit a &ldquo;Request For Rent&rdquo; or purchase inquiry, we collect applicant contact details, current city of residence, desired move-in parameters, requested unit identifier, and application submission timestamps.
            </p>
          </div>

          {/* Tenancy & Lease Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Tenancy & Lease Information
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              When an application is approved and active tenancies are established, we record lease commencement dates, lease end dates, assigned unit specifications, monthly rent obligations, security deposit amounts, and tenancy status (e.g., Active, Expired, Terminated).
            </p>
          </div>

          {/* Payment Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Payment & Invoice Records
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              We track invoice numbers, payment due dates, recorded transaction amounts, payment methods, transaction timestamps, overdue indicators, and generated receipt records. Sensitive credit card or bank account credentials are not stored on PropertyPro servers.
            </p>
          </div>

          {/* Maintenance Requests */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Maintenance Requests & Issue Reports
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              When submitting maintenance tickets, we collect ticket issue titles, detailed descriptions, severity ratings, assigned unit numbers, uploaded photo URLs showing issue conditions, technician notes, and ticket lifecycle timestamps.
            </p>
          </div>

          {/* Communications and Notifications */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Communications & In-App Notifications
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              We store system alerts, rental approval notices, payment reminders, overdue notifications, maintenance ticket updates, and direct tenancy ping messages exchanged between owners and tenants.
            </p>
          </div>

          {/* Device / Technical Information */}
          <div className="rounded-xl border border-border/60 bg-surface/70 p-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Technical & Device Information
            </h3>
            <p className="text-xs text-text2 mt-1.5 leading-relaxed">
              When accessing PropertyPro, server logs automatically capture IP addresses, browser user-agent strings, operating system details, session activity timestamps, and security audit events.
            </p>
          </div>
        </div>
      </section>

      {/* 3. How We Use Information */}
      <section id="how-we-use-info" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Cpu className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">3. How We Use Information</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We use the information collected for specific operational purposes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li><strong>Platform Functionality:</strong> Providing authentication, property discovery, rental application processing, and lease tracking.</li>
          <li><strong>Communication Delivery:</strong> Sending transactional alerts, rent invoices, maintenance status updates, and administrative notices.</li>
          <li><strong>Occupancy & Ledger Tracking:</strong> Calculating multi-unit occupancy rates, maintaining financial ledgers, and recording payment histories.</li>
          <li><strong>Security & Fraud Prevention:</strong> Authenticating user identities, verifying owner accounts, maintaining system audit logs, and detecting unauthorized activity.</li>
          <li><strong>Service Improvement:</strong> Analyzing aggregate platform metrics to enhance user experience and software reliability.</li>
        </ul>
      </section>

      {/* 4. How We Share Information */}
      <section id="how-we-share-info" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">4. How We Share Information</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro shares information only in the operational contexts necessary to fulfill tenancy and marketplace workflows:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li><strong>Between Tenants and Property Owners:</strong> When an applicant submits a rental request or lease is created, necessary contact and tenancy details are shared with the property owner to manage the lease.</li>
          <li><strong>Platform Administrators:</strong> Super Admins and authorized administrators have access to platform records for verification, moderation, and technical support.</li>
          <li><strong>Legal Compliance:</strong> We may disclose information if required by law, subpoena, or lawful governmental request.</li>
        </ul>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-text2 mt-2">
          <strong>No Data Selling:</strong> PropertyPro does not sell, rent, or trade your personal information to third-party advertisers or data brokers.
        </div>
      </section>

      {/* 5. Service Providers */}
      <section id="service-providers" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Server className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">5. Service Providers & Integrations</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We engage trusted third-party service providers to facilitate platform operations:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li><strong>ImageKit:</strong> Used for secure cloud image hosting, media optimization, and delivery of property gallery photos and maintenance ticket attachments.</li>
          <li><strong>Database Infrastructure:</strong> Enterprise cloud MongoDB clusters with encrypted data storage.</li>
          <li><strong>Hosting & API Infrastructure:</strong> Secure cloud application servers providing HTTPS encrypted endpoints.</li>
        </ul>
      </section>

      {/* 6. Data Storage and Security */}
      <section id="storage-security" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">6. Data Storage & Security</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We implement technical and organizational security controls aligned with industry standards:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text2 pt-1">
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3.5 space-y-1">
            <strong className="text-text block font-semibold">Encryption in Transit</strong>
            <span>All API communications and browser traffic are encrypted using TLS/HTTPS encryption protocols.</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3.5 space-y-1">
            <strong className="text-text block font-semibold">Bcrypt Password Hashing</strong>
            <span>User passwords are salted and hashed using bcrypt with industry-standard work factors.</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3.5 space-y-1">
            <strong className="text-text block font-semibold">Role-Based Access Control (RBAC)</strong>
            <span>Strict server-side route middleware ensures users only access data permitted for their role.</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface/60 p-3.5 space-y-1">
            <strong className="text-text block font-semibold">Audit Logging</strong>
            <span>Administrative actions and security events are logged for operational traceability.</span>
          </div>
        </div>
      </section>

      {/* 7. Authentication and Account Security */}
      <section id="authentication-security" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Key className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">7. Authentication & Account Security</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro utilizes JSON Web Tokens (JWT) for stateless API session authentication. Authentication tokens are issued upon valid credential verification and refreshed securely. User sessions enforce idle expiration policies to protect accounts against unattended terminal misuse.
        </p>
      </section>

      {/* 8. Cookies / Local Storage */}
      <section id="cookies-localstorage" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HardDrive className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">8. Local Storage & Client State</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro uses browser storage mechanisms (<code className="text-xs bg-surface px-1.5 py-0.5 rounded border border-border text-primary">localStorage</code> and <code className="text-xs bg-surface px-1.5 py-0.5 rounded border border-border text-primary">sessionStorage</code>) strictly for essential functionality:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li><strong>Authentication Persistence:</strong> Storing active user session metadata and token references.</li>
          <li><strong>User Interface Preferences:</strong> Remembering selected theme preferences (light/dark mode) and sidebar collapse state.</li>
          <li><strong>Remember Me Feature:</strong> Caching the user&apos;s email address when the &ldquo;Remember me&rdquo; checkbox is explicitly selected on the login page.</li>
        </ul>
      </section>

      {/* 9. Data Retention */}
      <section id="data-retention" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">9. Data Retention Policies</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We retain your personal and tenancy data for as long as your account remains active and as necessary to fulfill the purposes outlined in this policy. Certain financial records, lease histories, and audit logs are retained in accordance with statutory accounting and property management requirements.
        </p>
      </section>

      {/* 10. User Rights */}
      <section id="user-rights" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">10. User Rights & Choices</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Depending on your jurisdiction, you have specific rights regarding your personal information:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li><strong>Access & Review:</strong> You can review your profile, listed properties, rental applications, and payment records directly within the dashboard.</li>
          <li><strong>Rectification:</strong> You may update or correct inaccurate profile details and property configurations at any time.</li>
          <li><strong>Export:</strong> You can download and export transaction receipts and tenancy summaries from your account ledger.</li>
        </ul>
      </section>

      {/* 11. Account Deletion / Data Requests */}
      <section id="account-deletion" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Trash2 className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">11. Account Deletion & Data Requests</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Users may request account deactivation or deletion by contacting platform administration. When an account is deleted, personal profile information is purged from active databases, subject to any ongoing legal, lease, or financial retention obligations.
        </p>
      </section>

      {/* 12. Children's Privacy */}
      <section id="children-privacy" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Baby className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">12. Children&apos;s Privacy</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro is not intended for or directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If we discover that a minor has provided us with personal information, we will take immediate steps to delete such data.
        </p>
      </section>

      {/* 13. Third-Party Links */}
      <section id="third-party-links" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ExternalLink className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">13. Third-Party Links & Services</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices or content of external sites. We encourage users to read the privacy statements of any external service visited.
        </p>
      </section>

      {/* 14. Changes to This Privacy Policy */}
      <section id="policy-changes" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">14. Changes to This Privacy Policy</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We may update this Privacy Policy from time to time to reflect changes in our technology, regulatory requirements, or business operations. Material changes will be accompanied by an updated &ldquo;Last Updated&rdquo; date at the top of this page.
        </p>
      </section>

      {/* 15. Contact Information */}
      <section id="contact-info" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">15. Contact Information</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          If you have questions, comments, or data privacy requests regarding this Privacy Policy:
        </p>
        <div className="rounded-xl border border-border/70 bg-surface/80 p-5 text-sm space-y-2">
          <p className="font-semibold text-text">PropertyPro Privacy & Compliance</p>
          <p className="text-muted text-xs">
            Contact information will be provided by PropertyPro.
          </p>
          <p className="text-muted text-xs">
            For privacy rights inquiries or account data assistance, please submit a request through the platform administrator.
          </p>
        </div>
      </section>
    </LegalLayout>
  )
}
