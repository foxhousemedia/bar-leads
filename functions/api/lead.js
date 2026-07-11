// POST /api/lead — stores a qualify-form submission in D1
export async function onRequestPost({ request, env }) {
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
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: 'server' }, { status: 500 });
  }
}
