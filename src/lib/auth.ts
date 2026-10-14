import { headers } from "next/headers";

export type CurrentUser = {
  name: string;
  email?: string;
  // Ends the App Service session. Absent where there is no sign-in.
  signOutUrl?: string;
};

// Used where there is no App Service sign-in, such as on localhost.
const localUser: CurrentUser = { name: "Vaibhav Srivastava" };

type ClientPrincipal = {
  claims?: { typ: string; val: string }[];
};

// The signed-in user. On App Service, built-in authentication (see
// scripts/azure-auth.sh) signs people in with Microsoft Entra ID and passes
// the user to the app in X-MS-CLIENT-PRINCIPAL headers, replacing any a client
// sends. Returns undefined there when nobody is signed in.
export async function getCurrentUser(): Promise<CurrentUser | undefined> {
  // Read first, even locally, so the user is never baked into a static page.
  const requestHeaders = await headers();
  if (!process.env.WEBSITE_SITE_NAME) return localUser;

  const encoded = requestHeaders.get("x-ms-client-principal");
  if (!encoded) return undefined;

  let principal: ClientPrincipal;
  try {
    principal = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
  const claim = (type: string) =>
    principal.claims?.find((entry) => entry.typ === type)?.val;

  const email =
    claim("preferred_username") ??
    requestHeaders.get("x-ms-client-principal-name") ??
    undefined;
  const name = claim("name") ?? email;
  return name ? { name, email, signOutUrl: "/.auth/logout" } : undefined;
}
