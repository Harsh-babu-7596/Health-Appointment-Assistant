export const site = {
  agencyName: "Nexora",
  agencyTagline: "Health Labs",
  agencyFullName: "Nexora Health Labs",
  logoInitial: "N",
  productName: "MediSlot",
  email: "hello@nexorahealth.com",
  phoneDisplay: "+91 99999 99999",
  phoneE164: "+919999999999",
  whatsappNumber: "919999999999",
  whatsappMessage: "Hi, I'd like a demo of MediSlot",
  location: "Bengaluru, India",
  form: {
    endpoint: import.meta.env.VITE_FORM_ENDPOINT ?? "",
    web3formsKey: import.meta.env.VITE_WEB3FORMS_KEY ?? "",
  },
} as const;

export const navLinks = [
  { href: "#product", label: "Product" },
  { href: "#demo", label: "Live demo" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
] as const;
