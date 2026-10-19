import { requireUser } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo";
import { AccountPanel } from "@/features/account/account-panel";
import { getAccountSessions } from "@/features/account/server/sessions";

export const metadata = buildMetadata({ title: "Account", noIndex: true });

export default async function AccountPage() {
  const user = await requireUser();
  const sessions = await getAccountSessions().then(
    (data) => ({ data, error: false }),
    () => ({ data: [], error: true }),
  );
  return (
    <AccountPanel
      user={{ name: user.name, email: user.email, imageUrl: user.image ?? "" }}
      sessions={sessions.data}
      sessionsError={sessions.error}
    />
  );
}
