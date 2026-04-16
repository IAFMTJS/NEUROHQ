export function isLocalFirstHubEnabled(): boolean {
  return process.env.NEXT_PUBLIC_LOCAL_FIRST_HUB === "1";
}

