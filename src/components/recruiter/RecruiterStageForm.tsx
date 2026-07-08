import { updateRecruiterApplicationStage } from "@/app/recruiter/actions";
import type { ApplicationStatus } from "@/types/student";

const statusLabels: Record<ApplicationStatus, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  not_applicable: "Not Applicable",
  selected: "Selected",
  offer_given: "Offer Given"
};

const baseStatuses: ApplicationStatus[] = ["pending", "shortlisted", "rejected"];
const gdStatuses: ApplicationStatus[] = ["pending", "shortlisted", "rejected", "not_applicable"];
const offerStatuses: ApplicationStatus[] = ["pending", "selected", "offer_given", "rejected"];

type RecruiterStageFormProps = {
  applicationId: string;
  fieldName: "resume_shortlist_status" | "test_status" | "gd_status" | "offer_status";
  value: ApplicationStatus;
  gdApplicable?: boolean;
};

function statusesFor(fieldName: RecruiterStageFormProps["fieldName"], gdApplicable?: boolean) {
  if (fieldName === "offer_status") return offerStatuses;
  if (fieldName === "gd_status") return gdApplicable ? gdStatuses : ["not_applicable" as ApplicationStatus];
  return baseStatuses;
}

export function RecruiterStageForm({ applicationId, fieldName, value, gdApplicable }: RecruiterStageFormProps) {
  const options = statusesFor(fieldName, gdApplicable);
  const disabled = fieldName === "gd_status" && !gdApplicable;

  return (
    <form action={updateRecruiterApplicationStage} className="mt-2 flex gap-2">
      <input name="applicationId" type="hidden" value={applicationId} />
      <input name="fieldName" type="hidden" value={fieldName} />
      <select
        className="h-8 rounded-portal border border-portal-line px-2 text-xs"
        disabled={disabled}
        name="status"
        defaultValue={value}
      >
        {options.map((status) => (
          <option key={status} value={status}>
            {statusLabels[status]}
          </option>
        ))}
      </select>
      <button
        className="h-8 rounded-portal border border-portal-line px-2 text-xs font-semibold text-portal-blue disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        type="submit"
      >
        Save
      </button>
    </form>
  );
}