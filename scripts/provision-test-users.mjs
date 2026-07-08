import {
  createOrResetAuthUser,
  defaultOrganizerEmail,
  defaultRecruiterEmail,
  listAllAuthUsers,
  printCredentialHeader,
  printCredentialRow,
  requireSupabaseAdmin,
  temporaryPassword,
  upsertProfile
} from "./provision-lib.mjs";

const supabase = requireSupabaseAdmin();
const users = await listAllAuthUsers(supabase);
const userIndex = new Map(users.map((user) => [user.email?.toLowerCase(), user]).filter(([email]) => Boolean(email)));
const testUsers = [
  { email: defaultOrganizerEmail, role: "organizer", fullName: "Organizer Test" },
  { email: defaultRecruiterEmail, role: "recruiter", fullName: "Recruiter Test" }
];

printCredentialHeader();

for (const testUser of testUsers) {
  const password = temporaryPassword();
  const { user, created, passwordReset } = await createOrResetAuthUser(supabase, userIndex, {
    email: testUser.email,
    password,
    role: testUser.role
  });

  await upsertProfile(supabase, {
    id: user.id,
    email: testUser.email,
    role: testUser.role,
    fullName: testUser.fullName
  });

  printCredentialRow({
    email: testUser.email,
    role: testUser.role,
    password,
    linkedRecord: testUser.fullName,
    status: created ? "created" : passwordReset ? "existing_password_reset" : "existing"
  });
}