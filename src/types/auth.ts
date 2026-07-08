import type { AppRole } from "@/lib/rbac";

export type Profile = {
  id: string;
  email: string;
  role: AppRole;
  full_name: string | null;
  must_change_password: boolean;
  is_active: boolean;
};