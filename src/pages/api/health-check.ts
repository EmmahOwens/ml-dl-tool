
// This is a virtual endpoint that doesn't actually get called
// The app checks if network requests are possible using this endpoint
// If requests fail, offline mode is activated

export default function handler() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
