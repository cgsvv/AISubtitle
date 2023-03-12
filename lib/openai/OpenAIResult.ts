// TODO: maybe chat with video?
export type ChatGPTAgent = "user" | "system" | "assistant";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}
export interface OpenAIStreamPayload {
  api_key?: string;
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
  res_keys?: number[];
}
import { checkOpenaiApiKeys } from "./openai";
import { sample } from "../../utils/fp";

function formatResult(result: any) {
    const answer = result.choices[0].message?.content || "";
    if (answer.startsWith("\n\n")) {
      return answer.substring(2);
    }   
    return answer;
}

function selectApiKey(apiKey: string | undefined) {
    if (apiKey && checkOpenaiApiKeys(apiKey)) {
        const userApiKeys = apiKey.split(",");
        return sample(userApiKeys);
    }

    // don't need to validate anymore, already verified in middleware?
    const myApiKeyList = process.env.OPENAI_API_KEY;
    const luckyApiKey = sample(myApiKeyList?.split(","));
    return luckyApiKey || "";
}

export async function OpenAIResult(
    payload: OpenAIStreamPayload,
    apiKey?: string
  ) {
    const openai_api_key = selectApiKey(apiKey);
    
    payload.res_keys = undefined;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openai_api_key ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
  
    if (res.status !== 200) {
      throw new Error("OpenAI API: " + res.statusText);
    }
  
    if (!payload.stream) {
      const result = await res.json();
      return formatResult(result);
    }
}