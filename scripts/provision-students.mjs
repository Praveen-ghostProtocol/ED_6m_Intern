import {
  createOrResetAuthUser,
  listAllAuthUsers,
  printCredentialHeader,
  printCredentialRow,
  readStudentSeed,
  requireSupabaseAdmin,
  temporaryPassword,
  upsertProfile
} from "./provision-lib.mjs";

const supabase = requireSupabaseAdmin();
const students = readStudentSeed();
const users = await listAllAuthUsers(supabase);
const userIndex = new Map(users.map((user) => [user.email?.toLowerCase(), user]).filter(([email]) => Boolean(email)));

printCredentialHeader();

for (const student of students) {
  const password = temporaryPassword();
  const { user, created, passwordReset } = await createOrResetAuthUser(supabase, userIndex, {
    email: student.email,
    password,
    role: "student"
  });

  await upsertProfile(supabase, {
    id: user.id,
    email: student.email,
    role: "student"
  });

  const { error } = await supabase.from("students").upsert(
    {
      profile_id: user.id,
      roll_number: student.roll_number,
      branch: "Engineering Design"
    },
    { onConflict: "roll_number" }
  );

  if (error) throw error;

  printCredentialRow({
    email: student.email,
    role: "student",
    password,
    linkedRecord: student.roll_number,
    status: created ? "created" : passwordReset ? "existing_password_reset" : "existing"
  });
}