function apiOrigin() {
  const value = process.env.API_URL?.trim();
  if (!value && process.env.VERCEL === '1') {
    throw new Error('Set API_URL to your Render API HTTPS origin in Vercel environment settings, then redeploy.');
  }
  const url = new URL(value || 'http://127.0.0.1:4000');
  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error('API_URL must be an HTTP(S) origin, without a path, query, or credentials.');
  }
  if (process.env.VERCEL === '1' && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('Vercel API_URL must be the publicly reachable HTTPS origin of your Render API.');
  }
  return url.origin;
}
export default {
  allowedDevOrigins: ['127.0.0.1'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin()}/:path*` }];
  }
};
