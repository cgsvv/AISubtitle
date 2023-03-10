const suportedLang = `
Albanian
Arabic
Armenian
Awadhi
Azerbaijani
Bashkir
Basque
Belarusian
Bengali
Bhojpuri
Bosnian
Brazilian Portuguese
Bulgarian
Cantonese (Yue)
Catalan
Chhattisgarhi
Chinese
Croatian
Czech
Danish
Dogri
Dutch
English
Estonian
Faroese
Finnish
French
Galician
Georgian
German
Greek
Gujarati
Haryanvi
Hindi
Hungarian
Indonesian
Irish
Italian
Japanese
Javanese
Kannada
Kashmiri
Kazakh
Konkani
Korean
Kyrgyz
Latvian
Lithuanian
Macedonian
Maithili
Malay
Maltese
Mandarin
Mandarin Chinese
Marathi
Marwari
Min Nan
Moldovan
Mongolian
Montenegrin
Nepali
Norwegian
Oriya
Pashto
Persian (Farsi)
Polish
Portuguese
Punjabi
Rajasthani
Romanian
Russian
Sanskrit
Santali
Serbian
Sindhi
Sinhala
Slovak
Slovene
Slovenian
Spanish
Swahili
Swedish
Tajik
Tamil
Tatar
Telugu
Thai
Turkish
Turkmen
Ukrainian
Urdu
Uzbek
Vietnamese
Welsh
Wu
`.trim().split("\n");



const suportedLangZh = `
阿尔巴尼亚语
阿拉伯语
亚美尼亚语
阿瓦德语
阿塞拜疆语
巴什基尔语
巴斯克语
白俄罗斯语
孟加拉语
博杰普尔语
波斯尼亚语
巴西葡萄牙语
保加利亚语
粤语（粤语）
加泰罗尼亚语
查蒂斯加里语
中文
克罗地亚语
捷克语
丹麦语
多格里语
荷兰语
英语
爱沙尼亚语
法罗语
芬兰语
法语
加利西亚语
格鲁吉亚语
德语
希腊语
古吉拉特语
哈里亚纳语
印地语
匈牙利语
印度尼西亚语
爱尔兰语
意大利语
日语
爪哇语
卡纳达语
克什米尔语
哈萨克语
孔卡尼语
韩语
吉尔吉斯语
拉脱维亚语
立陶宛语
马其顿语
迈蒂利语
马来语
马耳他语
普通话
普通话（普通话）
马拉地语
马尔瓦里语
闽南语
摩尔多瓦语
蒙古语
黑山语
尼泊尔语
挪威语
奥里亚语
普什图语
波斯语（法斯语）
波兰语
葡萄牙语
旁遮普语
拉贾斯坦语
罗马尼亚语
俄语
梵语
桑塔利语
塞尔维亚语
信德语
僧伽罗语
斯洛伐克语
斯洛文尼亚语
斯洛文尼亚语()
西班牙语
斯瓦希里语
瑞典语
塔吉克语
泰米尔语
鞑靼语
特拉古语
泰语
土耳其语
土库曼语
乌克兰语
乌尔都语
乌兹别克语
越南语
威尔士语
吴语
`.trim().split("\n");

const locales = `
Albanian - sq
Arabic - ar
Armenian - hy
Awadhi - awa
Azerbaijani - az
Bashkir - ba
Basque - eu
Belarusian - be
Bengali - bn
Bhojpuri - bho
Bosnian - bs
Brazilian Portuguese - pt-BR
Bulgarian - bg
Cantonese (Yue) - yue
Catalan - ca
Chhattisgarhi - hne
Chinese - zh-CN
Croatian - hr
Czech - cs
Danish - da
Dogri - doi
Dutch - nl
English - en
Estonian - et
Faroese - fo
Finnish - fi
French - fr
Galician - gl
Georgian - ka
German - de
Greek - el
Gujarati - gu
Haryanvi - bgc
Hindi - hi
Hungarian - hu
Indonesian - id
Irish - ga
Italian - it
Japanese - ja
Javanese - jv
Kannada - kn
Kashmiri - ks
Kazakh - kk
Konkani - kok
Korean - ko
Kyrgyz - ky
Latvian - lv
Lithuanian - lt
Macedonian - mk
Maithili - mai
Malay - ms
Maltese - mt
Mandarin - zh-CN
Mandarin Chinese - zh-CN
Marathi - mr
Marwari - mwr
Min Nan - nan
Moldovan - mo
Mongolian - mn
Montenegrin - cnr
Nepali - ne
Norwegian - no
Oriya - or
Pashto - ps
Persian (Farsi) - fa
Polish - pl
Portuguese - pt
Punjabi - pa
Rajasthani - raj
Romanian - ro
Russian - ru
Sanskrit - sa
Santali - sat
Serbian - sr
Sindhi - sd
Sinhala - si
Slovak - sk
Slovene - sl
Slovenian - sl
Spanish - es
Swahili - sw
Swedish - sv
Tajik - tg
Tamil - ta
Tatar - tt
Telugu - te
Thai - th
Turkish - tr
Turkmen - tk
Ukrainian - uk
Urdu - ur
Uzbek - uz
Vietnamese - vi
Welsh - cy
Wu - wuu
`.trim().split("\n").map(line => line.split(" - "));

const commonLangZh = `
中文
英语
西班牙语
阿拉伯语
印地语
葡萄牙语
俄语
日语
法语
德语
韩语
意大利语
土耳其语
孟加拉语
`.trim().split("\n");

const langBiMap = (() => {
    const res = new Map<string, string>();
    for (let i = 0; i < suportedLang.length; i++) {
        res.set(suportedLang[i], suportedLangZh[i]);
        res.set(suportedLangZh[i], suportedLang[i]);
    }
    return res;
})();

const langLocaleBiMap = (() => {
    const res = new Map<string, string>();
    for (const words of locales) {
        res.set(words[0], words[1]);
        res.set(words[1], words[0]);
    }
    return res;
})();

function getLocale(lang: string): string | undefined {
    let res = langLocaleBiMap.get(lang);
    if (!res) {
        const lang1 = langBiMap.get(lang);
        if (lang1) {
            res = langLocaleBiMap.get(lang1);
        }
    }
    return res;
}

export {suportedLang, suportedLangZh, commonLangZh, getLocale, langBiMap, langLocaleBiMap};