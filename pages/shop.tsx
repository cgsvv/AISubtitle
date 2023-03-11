import { CHECKOUT_URL, RATE_LIMIT_COUNT } from "../utils/constants";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18nextConfig from '../next-i18next.config.js';

export default function Shop() {
  const { t } = useTranslation("common");
  const [msg0, msg1, msg2] = t("ShopTip").replace("{}", String(RATE_LIMIT_COUNT)).split("---");

  return (
    <div>
      <h2 style={{margin: "20px", textAlign: "center", fontSize: "32px", lineHeight: "40px"}}  >
        {msg0}
        <span style={{color: "green"}}>
          <a
            style={{textDecorationLine: "underline"}}
            href={CHECKOUT_URL}
          >
            {msg1}
          </a>
        </span>
        {msg2}
        {/* <div className="mt-8">
          或者
          <a
            href="/wechat.jpg"
            className="text-green-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            「加我微信」
          </a>
        </div> */}
      </h2>
      <div>
        <iframe src={CHECKOUT_URL} width="100%" height="1024px"></iframe>
      </div>
    </div>
  );
};

export async function getStaticProps({ locale }: {locale:string}) {
  return {
      props: {
          ...(await serverSideTranslations(locale, ['common'], nextI18nextConfig)),
      }
  }
}
