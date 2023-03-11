import Srt from './srt';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config.js';

export default function Home() {
  return (
    <Srt></Srt>
  )
}

export async function getStaticProps({ locale }: {locale:string}) {
  return {
      props: {
          ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
      }
  }
}
