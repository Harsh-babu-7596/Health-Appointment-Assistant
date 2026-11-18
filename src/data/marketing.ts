import type { Faq, Feature, Plan, Step, Testimonial } from "@/types";

export const heroStats = [
  { value: 40, suffix: "%", label: "fewer no-shows with automated reminders" },
  { value: 3, suffix: "x", label: "more online bookings vs. phone-only" },
  { value: 14, suffix: " days", label: "typical time to go live" },
  { value: 24, suffix: "/7", label: "booking, even when the front desk is closed" },
];

export const clientLogos = ["✚ CityCare Clinics", "◎ Lotus Hospitals", "◆ SmileDent", "✦ NovaDiagnostics", "❖ Apollo Kids", "● HealWell"];

export const withoutProduct = [
  "Patients wait on hold, then book elsewhere",
  "Double bookings and overlapping schedules",
  "15–30% no-shows with no reminders",
  "Reception spends hours on calls and registers",
  "No visibility into revenue or doctor utilisation",
];

export const withProduct = [
  "Patients book in 30 seconds, 24/7, from any device",
  "Real-time availability across every doctor & branch",
  "Automatic SMS, WhatsApp & email reminders",
  "Digital check-in, queue and prescription handling",
  "Live dashboards for revenue, utilisation & growth",
];

export const portals = [
  {
    icon: "user",
    tone: "blue",
    title: "Patient App",
    description: "A simple booking experience your patients will actually enjoy using.",
    points: ["Search by doctor, specialty or symptom", "Live slot availability & instant booking", "Pay online, reschedule or cancel", "Video consults, prescriptions & reports", "Family profiles & visit history"],
  },
  {
    icon: "stethoscope",
    tone: "teal",
    title: "Doctor Portal",
    description: "Everything a doctor needs for the day, on one screen.",
    points: ["Daily schedule & live patient queue", "Set availability, breaks & leave", "Patient history & consultation notes", "E-prescriptions in one click", "Personal earnings & performance"],
  },
  {
    icon: "chart",
    tone: "violet",
    title: "Admin Dashboard",
    description: "Run every doctor, branch and rupee from a single control centre.",
    points: ["Real-time analytics & revenue reports", "Manage doctors, staff & branches", "No-show, utilisation & growth insights", "Roles, permissions & audit logs", "Export to Excel / PDF"],
  },
] as const;

export const features: Feature[] = [
  { icon: "calendar", title: "Smart scheduling", description: "Slot rules, buffers, breaks, leave and overbooking controls per doctor and branch." },
  { icon: "bell", title: "SMS & WhatsApp reminders", description: "Automatic confirmations and reminders that cut no-shows by up to 40%." },
  { icon: "card", title: "Online payments", description: "UPI, cards and wallets via Razorpay or Stripe, with advance fees and refunds." },
  { icon: "video", title: "Video consultations", description: "Secure built-in teleconsults with no extra apps for patients to install." },
  { icon: "file", title: "E-prescriptions & records", description: "Digital prescriptions, lab reports and visit history available to patients instantly." },
  { icon: "building", title: "Multi-branch ready", description: "Run multiple locations with central control and per-branch reporting." },
  { icon: "palette", title: "Fully white-label", description: "Your logo, colours, domain and app-store listing. Patients only see your brand." },
  { icon: "shield", title: "Secure & compliant", description: "Encrypted data, role-based access, audit logs, and DPDP/HIPAA-aligned practices." },
  { icon: "phone", title: "Android & iOS apps", description: "Native-feel mobile apps for patients and doctors, published under your name." },
];

export const steps: Step[] = [
  { title: "Discovery call", description: "We learn your workflows, specialties, branches and goals in a free 30-minute call.", when: "Day 1" },
  { title: "Brand & configure", description: "We apply your branding, set up doctors, slots, fees, payments and reminders.", when: "Week 1" },
  { title: "Train & launch", description: "Staff training, data import and go-live on web, Android and iOS.", when: "Week 2–3" },
  { title: "Grow & support", description: "Ongoing updates, priority support and monthly performance reviews.", when: "Ongoing" },
];

export const plans: Plan[] = [
  {
    name: "Starter",
    description: "For single-doctor and small clinics.",
    monthly: { inr: "₹1,999", usd: "$29" },
    setup: { inr: "₹14,999", usd: "$199" },
    features: ["Up to 3 doctors", "Patient web booking", "Doctor & admin portals", "SMS & email reminders", "Basic analytics", "Email support"],
    cta: "Get started",
  },
  {
    name: "Growth",
    description: "For growing multi-specialty clinics.",
    monthly: { inr: "₹4,999", usd: "$69" },
    setup: { inr: "₹39,999", usd: "$499" },
    features: ["Up to 15 doctors", "Branded Android & iOS apps", "WhatsApp reminders", "Online payments & video consults", "Advanced analytics & exports", "Priority WhatsApp support"],
    cta: "Book a demo",
    featured: true,
  },
  {
    name: "Enterprise",
    description: "For hospitals and clinic chains.",
    monthly: null,
    setup: null,
    features: ["Unlimited doctors & branches", "Custom features & integrations", "HIS / EHR / lab integration", "Dedicated server option", "SLA & dedicated manager", "On-site training"],
    cta: "Talk to sales",
  },
];

export const testimonials: Testimonial[] = [
  { quote: "Our reception used to be flooded with calls every morning. Now 70% of bookings come through the app, and no-shows have almost halved.", name: "Dr. Rakesh Sharma", role: "Director, CityCare Clinics", initials: "RS", tone: "av--1" },
  { quote: "The admin dashboard finally shows me which doctors and branches are performing. We were live in under three weeks.", name: "Meera Iyer", role: "Operations Head, Lotus Hospitals", initials: "MI", tone: "av--2" },
  { quote: "Patients love seeing our own clinic's app on their phone. The WhatsApp reminders alone paid for the subscription.", name: "Dr. Aisha Khan", role: "Founder, SmileDent", initials: "AK", tone: "av--3" },
];

export const faqs: Faq[] = [
  { question: "How long does it take to go live?", answer: "Most clinics are live within 2–3 weeks. That covers branding, configuration, data import and staff training. Enterprise projects with custom integrations usually take 4–8 weeks." },
  { question: "Will the app carry my clinic's brand?", answer: "Yes. The platform is fully white-label. Your logo, colours and domain (e.g. book.yourclinic.com) are used everywhere, and on Growth and above we publish the mobile apps under your own name on Play Store and App Store." },
  { question: "Is patient data secure?", answer: "All data is encrypted in transit and at rest, access is role-based, and every action is audit-logged. We follow DPDP Act (India) and HIPAA-aligned practices, and Enterprise clients can opt for a dedicated server." },
  { question: "Can I import my existing patient records?", answer: "Yes. We import patient lists, doctor schedules and past appointments from Excel, CSV or most existing clinic software at no extra cost during setup." },
  { question: "Which payment gateways and messaging channels do you support?", answer: "Razorpay, Stripe, PayU and Cashfree for payments; SMS, email and the official WhatsApp Business API for messaging. Other providers can be added on request." },
  { question: "Is there a long-term contract?", answer: "No. Plans are month-to-month after setup. You can cancel anytime, and we'll export all your data for you." },
];
