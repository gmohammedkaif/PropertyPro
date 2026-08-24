import React from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Shield,
  UserCheck,
  Building,
  Key,
  CreditCard,
  Wrench,
  Bell,
  Ban,
  AlertTriangle,
  Scale,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react'
import { LegalLayout, type TocSection } from '@/components/layout/LegalLayout'

const SECTIONS: TocSection[] = [
  { id: 'introduction', title: 'Introduction', icon: FileText },
  { id: 'acceptance', title: 'Acceptance of Terms', icon: CheckCircle2 },
  { id: 'description', title: 'Description of PropertyPro', icon: Building },
  { id: 'accounts', title: 'User Accounts & Security', icon: UserCheck },
  { id: 'eligibility', title: 'User Eligibility', icon: Shield },
  { id: 'responsibilities', title: 'User Responsibilities', icon: Scale },
  { id: 'listings', title: 'Property Listings', icon: Building },
  { id: 'owners', title: 'Property Owners & Landlords', icon: Key },
  { id: 'tenants', title: 'Tenants & Renters', icon: UserCheck },
  { id: 'rental-requests', title: 'Rental Requests & Applications', icon: FileText },
  { id: 'tenancy-leases', title: 'Tenancy and Lease Information', icon: FileText },
  { id: 'payments', title: 'Payments, Rent & Security Deposits', icon: CreditCard },
  { id: 'accuracy', title: 'Property Information Accuracy', icon: AlertTriangle },
  { id: 'notifications', title: 'Communications & Notifications', icon: Bell },
  { id: 'maintenance', title: 'Maintenance Requests', icon: Wrench },
  { id: 'prohibited', title: 'Prohibited Activities', icon: Ban },
  { id: 'termination', title: 'Account Suspension & Termination', icon: AlertTriangle },
  { id: 'intellectual-property', title: 'Intellectual Property', icon: Shield },
  { id: 'third-party', title: 'Third-Party Services', icon: ExternalLink },
  { id: 'disclaimer', title: 'Disclaimer of Warranties', icon: AlertTriangle },
  { id: 'liability', title: 'Limitation of Liability', icon: Scale },
  { id: 'indemnification', title: 'Indemnification', icon: Shield },
  { id: 'changes', title: 'Changes to These Terms', icon: FileText },
  { id: 'governing-law', title: 'Governing Law', icon: Scale },
  { id: 'contact', title: 'Contact Information', icon: HelpCircle },
]

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="Please read these Terms of Service carefully before creating an account or using PropertyPro."
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
          Welcome to <strong className="text-text font-semibold">PropertyPro</strong>. These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;User&rdquo;, &ldquo;you&rdquo;, or &ldquo;your&rdquo;) and PropertyPro (&ldquo;PropertyPro&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), governing your access to and use of the PropertyPro web application, services, application programming interfaces (APIs), and digital property management platform.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro provides digital software infrastructure designed to connect property owners, property managers, tenants, prospective renters, and buyers, enabling streamlined property listing, rental application processing, lease administration, maintenance tracking, and payment ledger management.
        </p>
      </section>

      {/* 2. Acceptance of Terms */}
      <section id="acceptance" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">2. Acceptance of Terms</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          By browsing our marketplace, registering an account, clicking &ldquo;Sign in&rdquo;, &ldquo;Get Started&rdquo;, &ldquo;Create an account&rdquo;, or otherwise accessing or using PropertyPro, you acknowledge that you have read, understood, and agree to be bound by these Terms and our{' '}
          <Link to="/privacy" className="font-semibold text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-text2">
          <strong>Important Note:</strong> If you do not agree to all of the provisions set forth in these Terms, you must immediately discontinue use of the PropertyPro platform and services.
        </div>
      </section>

      {/* 3. Description of PropertyPro */}
      <section id="description" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">3. Description of PropertyPro</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro operates as an independent software-as-a-service (SaaS) platform facilitating real estate and tenancy management workflows. Core platform features include:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-text2 pt-1">
          <li className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface/60 p-3">
            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong>Public Marketplace:</strong> Search, filter, and inspect verified rental listings and property specifications.</span>
          </li>
          <li className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface/60 p-3">
            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong>Rental Application System:</strong> Digital application submissions with unit-level selection and review.</span>
          </li>
          <li className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface/60 p-3">
            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong>Tenancy & Lease Management:</strong> Transparent recording of active leases, rent terms, and deposit balances.</span>
          </li>
          <li className="flex items-start gap-2 rounded-lg border border-border/50 bg-surface/60 p-3">
            <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong>Maintenance Ticketing:</strong> Issue triage, photo evidence submission, and real-time status management.</span>
          </li>
        </ul>
        <p className="text-xs text-muted pt-2">
          PropertyPro is a technology platform and does not act as a real estate broker, landlord, tenant, escrow agent, or insurer unless explicitly declared otherwise in writing.
        </p>
      </section>

      {/* 4. User Accounts */}
      <section id="accounts" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">4. User Accounts & Security</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          To access authenticated features (such as applying for a lease, listing a property, or submitting maintenance requests), you must register for an account. You agree to provide accurate, current, and complete registration information and keep your profile details updated.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          You are solely responsible for maintaining the confidentiality of your account credentials (including passwords and session tokens). You agree to notify PropertyPro immediately of any unauthorized access, breach of security, or suspected account compromise. PropertyPro cannot and will not be liable for any loss or damage arising from your failure to safeguard your account.
        </p>
      </section>

      {/* 5. User Eligibility */}
      <section id="eligibility" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">5. User Eligibility</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          You must be at least 18 years of age (or the legal age of majority in your jurisdiction) and fully capable and competent to enter into the terms, conditions, obligations, affirmations, representations, and warranties set forth in these Terms.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          By registering, you represent and warrant that you have not been previously suspended or removed from PropertyPro, and that your use of the platform complies with all applicable local, national, and international laws.
        </p>
      </section>

      {/* 6. User Responsibilities */}
      <section id="responsibilities" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">6. User Responsibilities & Conduct</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          As a condition of using PropertyPro, you agree to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>Provide truthful, accurate, and non-misleading information across all forms, listings, and applications.</li>
          <li>Comply with all fair housing regulations, tenancy acts, and local property laws.</li>
          <li>Respect the privacy and personal information of other platform participants.</li>
          <li>Promptly pay all valid rental charges, deposits, and service obligations agreed to in your active leases.</li>
          <li>Use platform communication tools (pings, maintenance tickets, notices) professionally and courteously.</li>
        </ul>
      </section>

      {/* 7. Property Listings */}
      <section id="listings" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">7. Property Listings</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Property owners and authorized managers may publish property listings on PropertyPro. When publishing a listing, you represent and warrant that:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>You hold legal title, ownership, or authorized management rights for the listed property.</li>
          <li>All listed details—including unit counts, monthly rent amounts, security deposits, bedroom/bathroom counts, square footage, and amenities—are accurate and current.</li>
          <li>Photos and media uploaded do not infringe upon any third-party copyrights or misrepresent property condition.</li>
          <li>You will promptly update property status when units become occupied or unavailable.</li>
        </ul>
      </section>

      {/* 8. Property Owners / Landlords */}
      <section id="owners" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Key className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">8. Property Owners / Landlords</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Property owners undergo review and approval by platform Super Administrators prior to full platform activation. Owners are responsible for:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>Maintaining property habitability in accordance with statutory building codes.</li>
          <li>Reviewing tenant rental applications fairly and without unlawful discrimination.</li>
          <li>Honoring the exact monthly rent and security deposit amounts published on unit listings.</li>
          <li>Responding to submitted maintenance issues within reasonable commercial timeframes.</li>
        </ul>
      </section>

      {/* 9. Tenants / Renters */}
      <section id="tenants" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserCheck className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">9. Tenants / Renters</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Tenants are users who search for, apply to, or occupy rental units managed through PropertyPro. Tenants agree to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>Provide legitimate identity and contact information when submitting rental requests.</li>
          <li>Abide by the terms and covenants of any active lease agreement executed through or tracked on PropertyPro.</li>
          <li>Submit accurate maintenance tickets with clear descriptions to assist prompt triage.</li>
          <li>Fulfill monthly rent and financial commitments in accordance with lease schedules.</li>
        </ul>
      </section>

      {/* 10. Rental Requests */}
      <section id="rental-requests" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">10. Rental Requests & Applications</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Submitting a digital &ldquo;Request For Rent&rdquo; constitutes an expression of interest and an application to enter into a lease. Submitting an application requires an active, authenticated user account.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          A submitted rental request does <strong className="text-text font-semibold">not</strong> create a binding tenancy or guarantee unit availability until the property owner or administrator formally reviews and approves the application and initializes the lease record.
        </p>
      </section>

      {/* 11. Tenancy and Lease Information */}
      <section id="tenancy-leases" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">11. Tenancy and Lease Information</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          When an application is approved, a tenancy record is generated within PropertyPro reflecting the lease commencement date, expiry date, assigned unit, monthly rent, and security deposit.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          Multi-unit buildings automatically synchronize occupied and available capacity. Users agree that leases recorded in PropertyPro reflect the authoritative operational parameters agreed between the tenant and property owner.
        </p>
      </section>

      {/* 12. Payments */}
      <section id="payments" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">12. Payments, Rent & Security Deposits</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro provides financial ledger tracking, rent invoice management, payment recording, and receipt generation. All rent amounts and security deposit calculations are established directly by property owners on their unit configurations.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro tracks payment statuses (e.g., Paid, Pending, Overdue). Users are responsible for ensuring that payments are transmitted accurately and that any external bank transactions, UPI transfers, or receipts correspond to their digital invoice records.
        </p>
      </section>

      {/* 13. Property Information Accuracy */}
      <section id="accuracy" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">13. Property Information Accuracy</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro aggregates listing information provided by property owners and managers. While PropertyPro implements validation rules and moderation features, we do not inspect physical premises or independently verify all property claims, square footage measurements, or amenity conditions.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          Tenants are encouraged to inspect physical units, verify utility connections, and review documentation before entering into binding agreements.
        </p>
      </section>

      {/* 14. Communications and Notifications */}
      <section id="notifications" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">14. Communications & Notifications</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro delivers critical system notifications, rental request updates, payment receipts, maintenance status alerts, and tenancy pings through in-app notifications and registered email communications.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          By using the platform, you consent to receive electronic communications relating to your account activity, service updates, and legal notices.
        </p>
      </section>

      {/* 15. Maintenance Requests */}
      <section id="maintenance" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wrench className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">15. Maintenance Requests & Issue Tracking</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          Tenants can submit digital maintenance tickets specifying issue category, severity level, description, and photographic evidence. Owners and administrators can review, assign, update progress, and mark issues resolved.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro facilitates ticket coordination but is not responsible for the physical repair work, contractor scheduling, or workmanship quality provided by property owners or third-party tradespeople.
        </p>
      </section>

      {/* 16. Prohibited Activities */}
      <section id="prohibited" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Ban className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">16. Prohibited Activities</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          You agree not to engage in any of the following prohibited behaviors:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>Posting fraudulent, fictitious, duplicate, or deceptive property listings.</li>
          <li>Attempting to bypass role-based security guards (RBAC) or access unauthorized administrative endpoints.</li>
          <li>Interfering with, disrupting, or scraping platform servers, APIs, or databases.</li>
          <li>Submitting fake rental applications, fraudulent payment confirmations, or false maintenance claims.</li>
          <li>Harassing, threatening, or defaming other users, owners, tenants, or administrators.</li>
          <li>Uploading files containing malware, viruses, or malicious scripts.</li>
        </ul>
      </section>

      {/* 17. Account Suspension / Termination */}
      <section id="termination" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">17. Account Suspension & Termination</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro reserves the right, in its sole discretion and without prior notice, to suspend, restrict, or terminate any user account if we determine that:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-text2 pl-2">
          <li>You have violated any provision of these Terms or applicable laws.</li>
          <li>Your account has engaged in fraudulent, abusive, or unauthorized behavior.</li>
          <li>Your owner application was rejected or your credentials pose a security risk to the platform.</li>
        </ul>
      </section>

      {/* 18. Intellectual Property */}
      <section id="intellectual-property" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">18. Intellectual Property</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          All right, title, and interest in and to PropertyPro—including user interfaces, visual design, source code, algorithms, brand logos, and database schemas—are and will remain the exclusive property of PropertyPro and its licensors.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          You retain ownership of any media, images, and text content you upload. By uploading content to PropertyPro, you grant PropertyPro a non-exclusive, worldwide, royalty-free license to host, display, and distribute such content solely for the purpose of operating the platform.
        </p>
      </section>

      {/* 19. Third-Party Services */}
      <section id="third-party" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ExternalLink className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">19. Third-Party Services</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro integrates with third-party service providers—such as ImageKit for media storage and image optimization, as well as cloud database infrastructure. Your use of features reliant on third-party services is subject to the respective terms and policies of those external providers.
        </p>
      </section>

      {/* 20. Disclaimer of Warranties */}
      <section id="disclaimer" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">20. Disclaimer of Warranties</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2 uppercase text-xs font-mono">
          THE PROPERTYPRO PLATFORM AND ALL ASSOCIATED SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-sm leading-relaxed text-text2">
          PropertyPro makes no warranty that the service will meet your specific business requirements, operate without interruption, or be completely error-free.
        </p>
      </section>

      {/* 21. Limitation of Liability */}
      <section id="liability" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">21. Limitation of Liability</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          To the maximum extent permitted by applicable law, in no event shall PropertyPro, its directors, employees, or agents be liable for any indirect, punitive, incidental, special, consequential, or exemplary damages—including damages for loss of profits, goodwill, data, or physical property damages—arising out of or relating to your use of or inability to use the platform.
        </p>
      </section>

      {/* 22. Indemnification */}
      <section id="indemnification" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">22. Indemnification</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          You agree to defend, indemnify, and hold harmless PropertyPro and its affiliates from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with your breach of these Terms, your property listings, or your conduct as a landlord or tenant.
        </p>
      </section>

      {/* 23. Changes to These Terms */}
      <section id="changes" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">23. Changes to These Terms</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          We reserve the right to revise or modify these Terms at any time. When changes are published, we will update the &ldquo;Last Updated&rdquo; date at the top of this document. Continued use of PropertyPro following notice of changes constitutes your acceptance of the revised Terms.
        </p>
      </section>

      {/* 24. Governing Law */}
      <section id="governing-law" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Scale className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">24. Governing Law & Dispute Resolution</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the jurisdiction in which PropertyPro operates, without regard to its conflict of law principles.
        </p>
      </section>

      {/* 25. Contact Information */}
      <section id="contact" className="scroll-mt-28 space-y-4 rounded-2xl border border-border/70 bg-surface/40 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-bold tracking-tight text-text">25. Contact Information</h2>
        </div>
        <p className="text-sm leading-relaxed text-text2">
          If you have questions, inquiries, or notices regarding these Terms of Service or PropertyPro platform policies:
        </p>
        <div className="rounded-xl border border-border/70 bg-surface/80 p-5 text-sm space-y-2">
          <p className="font-semibold text-text">PropertyPro Platform Administration</p>
          <p className="text-muted text-xs">
            Contact information will be provided by PropertyPro.
          </p>
          <p className="text-muted text-xs">
            For technical support or account inquiries, please use the in-app support channels or contact your property administrator.
          </p>
        </div>
      </section>
    </LegalLayout>
  )
}
