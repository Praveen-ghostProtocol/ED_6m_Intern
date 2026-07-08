import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import type { Profile } from "@/types/auth";

type NavigationItem = {
  label: string;
  href: string;
};

type PortalShellProps = {
  title: string;
  subtitle: string;
  profile: Profile;
  navigation: NavigationItem[];
  children: React.ReactNode;
};

export function PortalShell({ title, subtitle, profile, navigation, children }: PortalShellProps) {
  const displayName = profile.full_name || profile.email;

  return (
    <main className="min-h-screen bg-portal-canvas text-portal-ink">
      <div className="mx-auto grid min-h-screen max-w-7xl md:grid-cols-[260px_1fr]">
        <aside className="border-b border-portal-line bg-white px-5 py-5 md:border-b-0 md:border-r">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-portal bg-portal-sky text-portal-blue">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">ED Internships</p>
              <p className="text-xs capitalize text-portal-muted">{profile.role} portal</p>
            </div>
          </div>

          <nav className="mt-8 flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
            {navigation.map((item) => (
              <Link
                className="whitespace-nowrap rounded-portal px-3 py-2 text-sm font-medium text-portal-muted transition hover:bg-portal-sky hover:text-portal-blue"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="flex flex-col gap-4 border-b border-portal-line bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-portal-muted">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                <p className="text-xs capitalize text-portal-muted">{profile.role}</p>
              </div>
              <form action={signOut}>
                <button
                  aria-label="Sign out"
                  className="flex h-10 w-10 items-center justify-center rounded-portal border border-portal-line bg-white text-portal-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  title="Sign out"
                  type="submit"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </header>

          <div className="flex-1 px-6 py-6">{children}</div>
        </section>
      </div>
    </main>
  );
}