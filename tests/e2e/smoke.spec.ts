import { expect, test } from "@playwright/test";
import { loginAs, signOut, skipWithoutCredentials } from "../helpers/auth";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Internship Portal" })).toBeVisible();
  await expect(page.getByRole("link", { name: /student portal/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /verifier portal/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Internship Portal Login" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test.describe("student smoke", () => {
  skipWithoutCredentials("student");

  test("student can sign in and reach the student area", async ({ page }) => {
    await loginAs(page, "student", "/student");
    await expect(page).toHaveURL(/\/student(?:\/profile)?/);
    await expect(page.getByText("ED Internships")).toBeVisible();
    await expect(page.getByRole("link", { name: "My Resumes" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Master Resume" })).toBeVisible();
    await signOut(page);
  });
});

test.describe("company smoke", () => {
  skipWithoutCredentials("company");

  test("company can sign in and reach the company dashboard", async ({ page }) => {
    await loginAs(page, "company", "/recruiter");
    await expect(page).toHaveURL(/\/recruiter$/);
    await expect(page.getByRole("heading", { name: "Company Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Company Roles" })).toBeVisible();
    await signOut(page);
  });
});

test.describe("organizer smoke", () => {
  skipWithoutCredentials("organizer");

  test("organizer can sign in and reach the organizer dashboard", async ({ page }) => {
    await loginAs(page, "organizer", "/organizer");
    await expect(page).toHaveURL(/\/organizer$/);
    await expect(page.getByRole("heading", { name: "Organizer Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Students" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Verifiers" })).toBeVisible();
    await signOut(page);
  });
});

test.describe("verifier smoke", () => {
  skipWithoutCredentials("verifier");

  test("verifier can sign in and reach the verifier dashboard", async ({ page }) => {
    await loginAs(page, "verifier", "/verifier");
    await expect(page).toHaveURL(/\/verifier$/);
    await expect(page.getByRole("heading", { name: "Verifier Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Assigned Students" })).toBeVisible();
    await signOut(page);
  });
});