// netlify/functions/callback.js
// Exchanges a Spotify authorization code for an access token.
// Set these in Netlify → Site Settings → Environment Variables:
//   SPOTIFY_CLIENT_ID
//   SPOTIFY_CLIENT_SECRET
//   SPOTIFY_REDIRECT_URI  (e.g. https://your-site.netlify.app/.netlify/functions/callback)

exports.handler = async (event) => {
  const { code } = event.queryStringParameters || {};

  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing code parameter' }) };
  }

  const clientId     = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri  = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing environment variables' }) };
  }

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: data.error_description || 'Token exchange failed' }) };
    }

    // Redirect back to the app with the token in the URL hash
    // (frontend reads it from window.location.hash)
    const appUrl = redirectUri.replace('/.netlify/functions/callback', '');
    return {
      statusCode: 302,
      headers: {
        Location: `${appUrl}/#access_token=${data.access_token}&expires_in=${data.expires_in}`,
      },
      body: '',
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};