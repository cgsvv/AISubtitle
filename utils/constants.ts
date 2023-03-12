export const RATE_LIMIT_COUNT = 5;
export const CHECKOUT_URL = "https://coolapps.lemonsqueezy.com/checkout/buy/f53d875a-4424-4ea3-8398-f3559dfaef98";
export const ENABLE_SHOP = process.env.NEXT_PUBLIC_ENABLE_SHOP === "true";
export const DEFAULT_PROMPT = "你是一个专业的翻译。请逐行翻译下面的文本到{{target_lang}}，注意保留数字和换行符，请勿自行创建内容，除了翻译，不要输出任何其他文本。"