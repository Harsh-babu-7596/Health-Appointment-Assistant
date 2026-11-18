import { site } from "@/config/site";

export interface Lead {
  name: string;
  clinic: string;
  email: string;
  phone: string;
  size: string;
  plan: string;
  message: string;
}

export type SubmitResult = { kind: "sent" } | { kind: "mailto" };

/**
 * Sends a demo request. Posts to the configured form endpoint (Formspree / Web3Forms)
 * when one is set, otherwise opens the visitor's email client with a pre-filled message.
 */
export async function submitLead(lead: Lead): Promise<SubmitResult> {
  const { endpoint, web3formsKey } = site.form;

  if (!endpoint) {
    const body = Object.entries(lead)
      .map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v}`)
      .join("\n");
    const subject = `Demo request: ${lead.clinic}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return { kind: "mailto" };
  }

  const payload: Record<string, string> = { ...lead, subject: `New demo request: ${lead.clinic}` };
  if (web3formsKey) payload.access_key = web3formsKey;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Lead submission failed with status ${res.status}`);
  return { kind: "sent" };
}
