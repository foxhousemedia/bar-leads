// POST /api/lead — stores a qualify-form submission in D1 + emails via Web3Forms
const W3F_KEY = '1684b9ce-b1a6-4345-be29-ab83bb52cfda'; // public form id

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const data = await request.json();
    const venue = String(data.venue || '').trim().slice(0, 200);
    const city = String(data.city || '').trim().slice(0, 100);
    const type = String(data.type || '').trim().slice(0, 50);
    const email = String(data.email || '').trim().slice(0, 200);
    if (!venue || !city || !type || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json({ ok: false, error: 'invalid' }, { status: 400 });
    }
    await env.DB.prepare(
      'INSERT INTO leads (venue, city, venue_type, email, user_agent) VALUES (?1, ?2, ?3, ?4, ?5)'
    ).bind(venue, city, type, email, request.headers.get('user-agent') || '').run();

    // email notification — non-blocking; D1 is the source of truth
    context.waitUntil(fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        access_key: W3F_KEY,
        subject: `New venue lead: ${venue} (${city})`,
        from_name: 'BarLeads Site',
        email,
        'Venue': venue,
        'City': city,
        'Venue type': type,
        'Contact email': email
      })
    }).catch(() => {}));

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
