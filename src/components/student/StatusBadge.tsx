import type { ApplicationStatus, ResumeStatus } from "@/types/student";

type StatusBadgeProps = {
  status: ResumeStatus | ApplicationStatus;
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  shortlisted: "border-blue-200 bg-blue-50 text-blue-700",
  selected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  offer_given: "border-teal-200 bg-teal-50 text-teal-700",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-600"
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  shortlisted: "Shortlisted",
  selected: "Selected",
  offer_given: "Offer Given",
  not_applicable: "Not Applicable"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}