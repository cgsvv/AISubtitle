export async function activateLicenseKey(licenseKey: string, uid?: string) {
    // https://docs.lemonsqueezy.com/help/licensing/license-api
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/licenses/activate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LEMON_API_KEY ?? ""}`,
        },
        body: JSON.stringify({
          license_key: licenseKey,
          instance_name: uid || "ai.cgsv.top",
        }),
      }
    );
    const result = await response.json();
    return result.activated;
  }