const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: "https://api.openai.com",
  changeOrigin: true,
  pathRewrite: (path, req) => {
    let url = req.url;
    if(url.split("?").length>1){
        url = url.split("?")[1];
        const realpath = new URLSearchParams(url).get("realpath");
        if (realpath) {
            return realpath;
        }
    }
    return path;
  }
});

// Expose the proxy on the "/api/*" endpoint.
function handle(req, res) {
  return apiProxy(req, res);
};

// const http = require('http');
// http.createServer(handle).listen(3344);

export default handle;