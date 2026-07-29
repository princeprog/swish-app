import { ScorekeeperGameDetailScreen } from "@/components/organizations/scorekeeper/scorekeeper-game-detail-screen";

type ScorekeeperGameDetailPageProps = {
  params: Promise<{
    gameId: string;
    slug: string;
  }>;
};

export default async function ScorekeeperGameDetailPage({
  params,
}: ScorekeeperGameDetailPageProps) {
  const { gameId, slug } = await params;

  return <ScorekeeperGameDetailScreen gameId={gameId} slug={slug} />;
}
