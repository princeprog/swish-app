import { PublicLeagueScreen } from "@/components/public/public-league-screen";

export default async function PublicLeaguePage({
  params,
}: {
  params: Promise<{ organizationSlug: string; seasonSlug: string }>;
}) {
  const { organizationSlug, seasonSlug } = await params;
  return (
    <PublicLeagueScreen
      organizationSlug={organizationSlug}
      seasonSlug={seasonSlug}
    />
  );
}
