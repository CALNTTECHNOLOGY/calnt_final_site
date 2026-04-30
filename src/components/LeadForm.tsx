import { useState } from 'react';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const PROPERTY_TYPES = [
  'Residential – Individual House',
  'Residential – Apartment',
  'Commercial – Shop / Office',
  'Commercial – Factory / Warehouse',
  'Agricultural',
];

const BILL_RANGES = [
  'Below ₹1,000',
  '₹1,000 – ₹3,000',
  '₹3,000 – ₹6,000',
  '₹6,000 – ₹10,000',
  'Above ₹10,000',
];

export default function LeadForm() {
  const [status, setStatus] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name') as string,
      phone: fd.get('phone') as string,
      email: fd.get('email') as string,
      city: fd.get('city') as string,
      propertyType: fd.get('propertyType') as string,
      monthlyBill: fd.get('monthlyBill') as string,
      message: fd.get('message') as string,
    };

    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Submission failed');
      }
      // Fire Google Ads conversion
      if (typeof (window as any).gtag === 'function') {
        (window as any).gtag('event', 'ads_conversion_Submit_lead_form_1', {});
      }
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="form-success">
        <div className="form-success-icon">☀️</div>
        <h3>Thank you! We'll be in touch shortly.</h3>
        <p>Our solar advisor will contact you within 24 hours to discuss your requirements and schedule a free site assessment.</p>
      </div>
    );
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="lf-name">Full Name *</label>
          <input id="lf-name" name="name" type="text" placeholder="Your name" required />
        </div>
        <div className="form-field">
          <label htmlFor="lf-phone">Phone Number *</label>
          <input id="lf-phone" name="phone" type="tel" placeholder="+91 98765 43210" required />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="lf-email">Email Address</label>
          <input id="lf-email" name="email" type="email" placeholder="you@example.com" />
        </div>
        <div className="form-field">
          <label htmlFor="lf-city">City / District</label>
          <input id="lf-city" name="city" type="text" placeholder="e.g. Hyderabad" />
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="lf-property">Property Type</label>
          <select id="lf-property" name="propertyType">
            <option value="">Select property type</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="lf-bill">Monthly Electricity Bill</label>
          <select id="lf-bill" name="monthlyBill">
            <option value="">Select bill range</option>
            {BILL_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="lf-message">Additional Notes</label>
        <textarea id="lf-message" name="message" rows={3} placeholder="Anything else you'd like us to know…" />
      </div>

      {status === 'error' && (
        <p className="form-error">{errorMsg}</p>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-lg form-submit"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Sending…' : 'Get Free Assessment →'}
      </button>

      <p className="form-legal">
        By submitting, you agree to be contacted by CALNT Technology regarding solar solutions. We respect your privacy.
      </p>
    </form>
  );
}
