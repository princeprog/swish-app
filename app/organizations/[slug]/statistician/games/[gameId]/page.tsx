import { StatisticianGameScreen } from "@/components/organizations/statistician/statistician-game-screen"

export default async function StatisticianGamePage({ params }: { params: Promise<{ gameId: string; slug: string }> }) {
  const { gameId, slug } = await params
  return <StatisticianGameScreen gameId={gameId} slug={slug} />
}
