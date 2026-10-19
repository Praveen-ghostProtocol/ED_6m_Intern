export function isSiemensHealthineers(companyName: string | null | undefined) {
  return companyName?.trim().toLowerCase() === "siemens healthineers";
}
