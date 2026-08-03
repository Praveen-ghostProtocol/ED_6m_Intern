# Internship Portal Test Cases

This document is the manual QA checklist for the Engineering Design internship portal. Automated Playwright tests cover the repeatable smoke, RBAC, and regression checks, but this checklist should still be used before launch or after major workflow changes.

## Test Environment

Use dedicated test accounts. Do not run destructive tests with real student/company data unless the action is intentionally part of production operations.

Recommended automated test variables:

```text
TEST_BASE_URL=http://127.0.0.1:3000
TEST_STUDENT_EMAIL=student.test@ed-internships.local
TEST_STUDENT_PASSWORD=<test-password>
TEST_COMPANY_EMAIL=recruiter.test@ed-internships.local
TEST_COMPANY_PASSWORD=<test-password>
TEST_ORGANIZER_EMAIL=organizer.test@ed-internships.local
TEST_ORGANIZER_PASSWORD=<test-password>
TEST_VERIFIER_EMAIL=verifier.test@ed-internships.local
TEST_VERIFIER_PASSWORD=<test-password>
```

`TEST_COMPANY_EMAIL` can also be provided as `TEST_RECRUITER_EMAIL`; `TEST_COMPANY_PASSWORD` can also be provided as `TEST_RECRUITER_PASSWORD`.

Apply `supabase/migrations/008_verifier_role.sql` and `supabase/migrations/009_master_resume_and_verifiers.sql` before provisioning verifier test accounts.

Create or reset the dedicated automated test accounts with:

```powershell
npm.cmd --silent run provision:e2e-test-users > test-user-credentials.csv
```

This creates `student.test@ed-internships.local`, `recruiter.test@ed-internships.local`, `verifier.test@ed-internships.local`, and `organizer.test@ed-internships.local`, marks them ready for testing, assigns the test student to the verifier, and seeds one demo company role/application plus one master resume entry. The generated credential CSV is local-only and ignored by Git.

## Release Gate

Before sharing the portal broadly, all Critical and High severity cases below should pass.

| Severity | Meaning |
| --- | --- |
| Critical | Data leak, broken login, wrong role access, upload privacy failure, or unusable core workflow. |
| High | Student/company/organizer core workflow broken but no data leak. |
| Medium | Secondary workflow issue with a workaround. |
| Low | Cosmetic or minor content issue. |

## Authentication And RBAC

| ID | Severity | Steps | Expected Result |
| --- | --- | --- | --- |
| AUTH-001 | Critical | Open `/student`, `/recruiter`, `/organizer` while logged out. | User is redirected to `/login`. |
| AUTH-002 | Critical | Log in as student and open `/organizer`. | Student is redirected away and cannot see organizer data. |
| AUTH-003 | Critical | Log in as student and open `/recruiter`. | Student is redirected away and cannot see company data. |
| AUTH-004 | Critical | Log in as company account and open `/student`. | Company account is redirected away and cannot see student-only pages. |
| AUTH-005 | Critical | Log in as company account and open `/organizer`. | Company account is redirected away and cannot see organizer data. |
| AUTH-006 | Critical | Log in as organizer and open `/student` or `/recruiter`. | Organizer is redirected away from role-specific portals. |
| AUTH-007 | High | Use an inactive account. | Login is rejected or redirected to login. |
| AUTH-008 | High | Log in with an account where `must_change_password = true`. | User is forced to `/change-password`. |
| AUTH-009 | Medium | Click sign out from each role. | Session ends and user returns to `/login`. |

## Student Portal

| ID | Severity | Steps | Expected Result |
| --- | --- | --- | --- |
| STU-001 | High | Log in as student. | Student lands in `/student` or `/student/profile` if profile is incomplete. |
| STU-002 | High | Complete profile with valid required values. | Profile saves and student can access portal pages. |
| STU-003 | Medium | Leave required profile fields empty. | Clear validation error appears; invalid data is not saved. |
| STU-004 | High | Upload a valid PDF resume. | Resume appears in My Resumes with pending verification. |
| STU-005 | High | Upload more than three resumes. | Fourth upload is rejected. |
| STU-006 | High | Upload a non-PDF resume. | Upload is rejected. |
| STU-007 | High | Open Companies tab. | Open company roles are listed. |
| STU-008 | Critical | Inspect Companies tab and JD details. | Stipend is not visible anywhere to students. |
| STU-009 | High | Click `View JD`. | JD opens separately as a signed/private PDF link when uploaded. |
| STU-010 | High | Click `Register`. | Registration is separate from JD viewing. |
| STU-011 | Critical | Register before any verified resume exists. | No unverified resumes appear; registration cannot proceed. |
| STU-012 | High | Register using a verified resume. | Application is created and appears in Applied Companies. |
| STU-013 | High | Update selected resume before deadline. | Application keeps same role and uses updated verified resume. |
| STU-014 | High | Remove registration before deadline. | Application is removed; Register is available again before deadline. |
| STU-015 | High | Try update/remove after deadline. | Update/remove actions are disabled or rejected. |
| STU-016 | High | Open Applied Companies before status upload. | Resume shortlist, test attended, test shortlist, GD, and offer show `-` initially. |
| STU-017 | High | Refresh after company/organizer uploads statuses. | Updated statuses are visible in Applied Companies. |

## Company Portal

| ID | Severity | Steps | Expected Result |
| --- | --- | --- | --- |
| COM-001 | High | Log in as company account. | Company Dashboard opens. |
| COM-002 | High | Open Company Roles. | Role creation form and existing company roles are visible. |
| COM-003 | High | Create draft role with JD PDF. | Role is created for the company only; JD link is private/signed. |
| COM-004 | High | Create open role with stipend. | Stipend is stored and visible to company/organizer, not students. |
| COM-005 | High | Open Applications. | Company sees role cards first. |
| COM-006 | High | Click a role card. | Applicants for only that role are listed. |
| COM-007 | Critical | Open an unassigned/company-other role by URL. | Access is denied or data is not visible. |
| COM-008 | High | Open applicant resume link. | Signed resume link opens for assigned role applicants only. |
| COM-009 | High | Set resume shortlist, test attended, test shortlist, GD, and offer values. | Values remain editable in the role form until saved. |
| COM-010 | High | Click `Save and upload statuses`. | Statuses persist and become visible to students. |
| COM-011 | Medium | GD is not applicable for a role. | GD status remains not applicable and cannot be changed meaningfully. |

## Organizer Portal

| ID | Severity | Steps | Expected Result |
| --- | --- | --- | --- |
| ORG-001 | High | Log in as organizer. | Organizer Dashboard opens. |
| ORG-002 | High | Open Students page. | Student rows, account status, profile status, resumes, and applications counts appear. |
| ORG-003 | High | Verify a pending resume. | Resume status becomes verified and can be used for applications. |
| ORG-004 | High | Reject a pending resume with note. | Resume status becomes rejected and student can see rejected status/note. |
| ORG-005 | High | Create company. | Company appears in roles/company account workflows. |
| ORG-006 | High | Create role with JD PDF. | Role is created with private JD link. |
| ORG-007 | High | Assign company account to role. | Company can see/manage assigned role. |
| ORG-008 | High | Open Applications. | Organizer sees role cards first. |
| ORG-009 | High | Click a role card. | Organizer sees applicants for that role. |
| ORG-010 | High | Update application statuses and click `Save and upload statuses`. | Statuses persist and reflect to students. |
| ORG-011 | Medium | Open Reports. | Summary counts match underlying applications. |

## File Privacy

| ID | Severity | Steps | Expected Result |
| --- | --- | --- | --- |
| FILE-001 | Critical | Open resume link as authorized organizer/company/student. | Signed resume link opens. |
| FILE-002 | Critical | Open resume link after expiry or as unauthorized account. | File is not accessible. |
| FILE-003 | Critical | Open JD link as authenticated student/company/organizer. | Signed JD link opens. |
| FILE-004 | Critical | Try to guess storage URL directly. | File is not public. |

## Automated Test Commands

Install the Playwright browser once per machine:

```powershell
npx.cmd playwright install chromium
```

```powershell
npm.cmd run test:e2e
npm.cmd run test:e2e:headed
npm.cmd run test:e2e:ui
npm.cmd run test:e2e:report
```

For local testing, Playwright starts `npm run dev` automatically when `TEST_BASE_URL` is unset or points to localhost.

For deployed testing, set:

```powershell
$env:TEST_BASE_URL="https://edinterns.vercel.app"
```

Then run:

```powershell
npm.cmd run test:e2e
```