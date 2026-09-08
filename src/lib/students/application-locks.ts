const lockedStudentRollNumbers = new Set(["ed23b074"]);

export function isStudentApplicationLockedByRoll(rollNumber: string | null | undefined) {
  return Boolean(rollNumber && lockedStudentRollNumbers.has(rollNumber.toLowerCase()));
}
