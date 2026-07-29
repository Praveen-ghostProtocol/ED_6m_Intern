import { expect, test } from "@playwright/test";
import { loginAs, skipWithoutCredentials } from "../helpers/auth";

test.describe("student portal regressions", () => {
  skipWithoutCredentials("student");

  test("students do not see stipend in the Companies tab", async ({ page }) => {
    await loginAs(page, "student", "/student/companies");
    await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
    await expect(page.getByText(/stipend/i)).toHaveCount(0);
  });

  test("Applied Companies exposes the current status columns", async ({ page }) => {
    await loginAs(page, "student", "/student/applications");
    await expect(page.getByRole("heading", { name: "Applied Companies" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Resume Shortlist" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Test Attended" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Test Shortlist" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "GD Shortlist" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Offer" })).toBeVisible();
  });

  test("JD and registration controls are separated when open roles exist", async ({ page }) => {
    await loginAs(page, "student", "/student/companies");
    const registerButtons = page.getByRole("button", { name: /register|update/i });
    const registerCount = await registerButtons.count();

    test.skip(registerCount === 0, "No open company roles are available for this regression check.");

    await expect(registerButtons.first()).toBeVisible();
    const jdLinks = await page.getByRole("link", { name: /view jd/i }).count();
    const detailButtons = await page.getByRole("button", { name: /details/i }).count();
    expect(jdLinks + detailButtons).toBeGreaterThan(0);
  });
});

test.describe("company portal regressions", () => {
  skipWithoutCredentials("company");

  test("company can view role creation and role-wise applications", async ({ page }) => {
    await loginAs(page, "company", "/recruiter/roles");
    await expect(page.getByRole("heading", { name: "Company Roles" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create Company Role" })).toBeVisible();
    await expect(page.getByLabel("JD PDF")).toBeVisible();

    await page.goto("/recruiter/applications");
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();
  });
});

test.describe("organizer portal regressions", () => {
  skipWithoutCredentials("organizer");

  test("organizer can view core operational pages", async ({ page }) => {
    await loginAs(page, "organizer", "/organizer");

    await page.goto("/organizer/resumes");
    await expect(page.getByRole("heading", { name: "Resume Verification" })).toBeVisible();

    await page.goto("/organizer/roles");
    await expect(page.getByRole("heading", { name: "Companies & Roles" })).toBeVisible();
    await expect(page.getByLabel("JD PDF")).toBeVisible();

    await page.goto("/organizer/applications");
    await expect(page.getByRole("heading", { name: "Applications" })).toBeVisible();

    await page.goto("/organizer/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  });
});