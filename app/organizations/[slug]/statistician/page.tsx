import { StatisticianWorkspaceScreen } from "@/components/organizations/statistician/statistician-workspace-screen"

export default async function StatisticianPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <StatisticianWorkspaceScreen slug={slug} />
}
