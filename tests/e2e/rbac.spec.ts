import { expect, test } from "@playwright/test";
import { loginAs, skipWithoutCredentials } from "../helpers/auth";

const protectedPaths = ["/student", "/recruiter", "/organizer"];

test.describe("logged-out access", () => {
  for (const path of protectedPaths) {
    test(`logged-out user is redirected from ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("student role access", () => {
  skipWithoutCredentials("student");

  test("student cannot open company or organizer areas", async ({ page }) => {
    await loginAs(page, "student", "/student");

    await page.goto("/recruiter");
    await expect(page).not.toHaveURL(/\/recruiter(?:\/|$)/);

    await page.goto("/organizer");
    await expect(page).not.toHaveURL(/\/organizer(?:\/|$)/);
  });
});

test.describe("company role access", () => {
  skipWithoutCredentials("company");

  test("company cannot open student or organizer areas", async ({ page }) => {
    await loginAs(page, "company", "/recruiter");

    await page.goto("/student");
    await expect(page).not.toHaveURL(/\/student(?:\/|$)/);

    await page.goto("/organizer");
    await expect(page).not.toHaveURL(/\/organizer(?:\/|$)/);
  });
});

test.describe("organizer role access", () => {
  skipWithoutCredentials("organizer");

  test("organizer cannot open student or company areas", async ({ page }) => {
    await loginAs(page, "organizer", "/organizer");

    await page.goto("/student");
    await expect(page).not.toHaveURL(/\/student(?:\/|$)/);

    await page.goto("/recruiter");
    await expect(page).not.toHaveURL(/\/recruiter(?:\/|$)/);
  });
});