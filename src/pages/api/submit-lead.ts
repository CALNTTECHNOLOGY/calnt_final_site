import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const { name, phone, email, city, propertyType, monthlyBill, message } = body;

    // Basic validation
    if (!name || !phone) {
      return new Response(JSON.stringify({ success: false, error: 'Name and phone are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const scriptUrl = import.meta.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      console.error('GOOGLE_SCRIPT_URL is not set');
      return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      name: name ?? '',
      phone: phone ?? '',
      email: email ?? '',
      city: city ?? '',
      propertyType: propertyType ?? '',
      monthlyBill: monthlyBill ?? '',
      message: message ?? '',
    });

    const scriptRes = await fetch(`${scriptUrl}?${params.toString()}`, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!scriptRes.ok) {
      console.error('Apps Script responded with status:', scriptRes.status);
      return new Response(JSON.stringify({ success: false, error: 'Failed to save lead.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-lead error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Unexpected server error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
