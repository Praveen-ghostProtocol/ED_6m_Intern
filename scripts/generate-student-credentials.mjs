import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const inputPath = process.argv[2] ?? "supabase/seed/students.csv";
const csv = readFileSync(inputPath, "utf8").trim();
const [header, ...rows] = csv.split(/\r?\n/);
const columns = header.split(",");
const rollIndex = columns.indexOf("roll_number");
const emailIndex = columns.indexOf("email");

if (rollIndex === -1 || emailIndex === -1) {
  throw new Error("CSV must contain roll_number,email headers.");
}

function password() {
  return `ED-${randomBytes(9).toString("base64url")}-Tmp1`;
}

console.log("email,role,temporary_password,roll_number,must_change_password");
for (const row of rows) {
  const values = row.split(",");
  console.log(`${values[emailIndex]},student,${password()},${values[rollIndex]},true`);
}