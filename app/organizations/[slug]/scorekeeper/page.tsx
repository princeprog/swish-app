import { ScorekeeperWorkspaceScreen } from "@/components/organizations/scorekeeper/scorekeeper-workspace-screen";

type ScorekeeperWorkspacePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ScorekeeperWorkspacePage({
  params,
}: ScorekeeperWorkspacePageProps) {
  const { slug } = await params;

  return <ScorekeeperWorkspaceScreen slug={slug} />;
}
