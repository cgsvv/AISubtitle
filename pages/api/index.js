const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: "https://api.openai.com",
  changeOrigin: true,
  pathRewrite: {
    "^/api/proxy": "" // strip "/api" from the URL
  }
});

// Expose the proxy on the "/api/*" endpoint.
function handle(req, res) {
  return apiProxy(req, res);
};

//const http = require('http');
//http.createServer(handle).listen(3344);

export default handle;