import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

export type PortalRole = "student" | "company" | "organizer";

type Credentials = {
  email: string;
  password: string;
};

const credentialKeys: Record<PortalRole, { email: string[]; password: string[] }> = {
  student: {
    email: ["TEST_STUDENT_EMAIL"],
    password: ["TEST_STUDENT_PASSWORD"]
  },
  company: {
    email: ["TEST_COMPANY_EMAIL", "TEST_RECRUITER_EMAIL"],
    password: ["TEST_COMPANY_PASSWORD", "TEST_RECRUITER_PASSWORD"]
  },
  organizer: {
    email: ["TEST_ORGANIZER_EMAIL"],
    password: ["TEST_ORGANIZER_PASSWORD"]
  }
};

function firstEnv(keys: string[]) {
  return keys.map((key) => process.env[key]).find((value): value is string => Boolean(value));
}

export function credentialsFor(role: PortalRole): Credentials | null {
  const keys = credentialKeys[role];
  const email = firstEnv(keys.email);
  const password = firstEnv(keys.password);

  return email && password ? { email, password } : null;
}

export function skipWithoutCredentials(role: PortalRole) {
  const keys = credentialKeys[role];
  test.skip(
    !credentialsFor(role),
    `Set ${keys.email.join(" or ")} and ${keys.password.join(" or ")} to run ${role} tests.`
  );
}

export async function loginAs(page: Page, role: PortalRole, nextPath?: string) {
  const credentials = credentialsFor(role);

  if (!credentials) {
    throw new Error(`Missing ${role} test credentials.`);
  }

  const loginPath = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  await page.goto(loginPath);
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();

  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
  await expect(page).not.toHaveURL(/\/change-password(?:\?|$)/);
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/);
}