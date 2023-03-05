const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: "https://example.org",
  changeOrigin: true,
  pathRewrite: {
    "^/api/proxy": "" // strip "/api" from the URL
  },
  onProxyRes(proxyRes) {
    // proxyRes.headers['x-added'] = 'foobar'; // add new header to response
    // delete proxyRes.headers['x-removed']; // remove header from response
  }
});

// Expose the proxy on the "/api/*" endpoint.
function handle(req, res) {
  return apiProxy(req, res);
};

//const http = require('http');
//http.createServer(handle).listen(3344);

export default handle;