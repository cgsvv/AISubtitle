export const sample = (arr: any[] = []) => {
    const len = arr === null ? 0 : arr.length;
    return len ? arr[Math.floor(Math.random() * len)] : undefined;
  };

 export function getRandomInt(min: number, max: number): number  {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  export async function digestMessage(message: string) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("").substring(0, 40); // convert bytes to hex string
    return hashHex;
  }