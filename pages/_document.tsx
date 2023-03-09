import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {

  let description = "AI字幕翻译/格式转化小工具, translate subtilte, caption, close caption, using chatGPT AI";
  //let ogimage = `${BASE_DOMAIN}/og-image.png`;
  let sitename = "ai.cgsv.top";
  let title = "AI字幕翻译";

  return (
    <Html lang="en">
      <Head>
        <link
            rel="icon"
            href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐣</text></svg>"
          />
          <meta name="description" content={description} />
          <meta property="og:site_name" content={sitename} />
          <meta property="og:description" content={description} />
          <meta property="og:title" content={title} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={description} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
