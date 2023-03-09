import '@/styles/globals.css'
import type { AppProps } from 'next/app';
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {appWithTranslation} from "next-i18next";
import nextI18NextConfig from '../next-i18next.config.js';

function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <Head>
        <title>AI字幕翻译</title>
      </Head>
      <Header></Header>
      <main>
        <Component {...pageProps} />
        <Analytics />
      </main>
      <Footer></Footer>
    </div>
  );
}

export default appWithTranslation(App, nextI18NextConfig);
