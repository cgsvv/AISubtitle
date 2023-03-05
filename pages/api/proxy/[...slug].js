import { createProxyMiddleware } from "http-proxy-middleware";

export const config = {
    api: {
      bodyParser: false,
    },
}

export default createProxyMiddleware({
  target: "https://api.openai.com",
  changeOrigin: true,
  pathRewrite: {[`^/api/proxy`]: ''},
});