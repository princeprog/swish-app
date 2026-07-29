"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getApiErrorMessage,
  isUnauthorizedApiError,
  useMeQuery,
} from "@/hooks/use-auth";
import { getOrganizationLandingPathForRole } from "@/lib/organization-routing";
import { accessService } from "@/services/access.service";

export function InvitationAcceptScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const redirectPath = `/invitations/accept?token=${encodeURIComponent(token)}`;
  const previewQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => accessService.previewInvitation(token),
    queryKey: ["invitation-preview", token],
    retry: false,
  });
  const meQuery = useMeQuery(Boolean(token));
  const acceptMutation = useMutation({
    mutationFn: () => accessService.acceptInvitation(token),
    onSuccess: () => {
      const slug = previewQuery.data?.organization.slug;
      const role = previewQuery.data?.role;
      toast.success("Invitation accepted");
      router.push(
        slug && role
          ? getOrganizationLandingPathForRole(slug, role)
          : "/organizations",
      );
    },
  });

  if (!token) {
    return (
      <InvitationShell
        title="Invitation link is incomplete"
        description="Open the full invitation link from your email."
      />
    );
  }

  if (previewQuery.isLoading) {
    return (
      <InvitationShell
        title="Checking invitation"
        description="One moment while we verify this link."
        loading
      />
    );
  }

  if (previewQuery.isError) {
    return (
      <InvitationShell
        title="Invitation not found"
        description={getApiErrorMessage(previewQuery.error)}
      />
    );
  }

  const preview = previewQuery.data;

  if (!preview) {
    return (
      <InvitationShell
        title="Invitation not found"
        description="We couldn't load this invitation."
      />
    );
  }

  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const signupHref = `/signup?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-xl border-border/60 shadow-none">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-md border bg-muted/40">
            <ShieldAlert className="size-5 text-muted-foreground" />
          </div>
          <CardTitle>Accept organization invitation</CardTitle>
          <CardDescription>
            {preview.organization.name} invited {preview.email} as{" "}
            {preview.role.replace("_", " ")}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview.status !== "pending" ? (
            <Alert variant="destructive">
              <AlertTitle>This invitation is {preview.status}</AlertTitle>
              <AlertDescription>
                Ask the organization owner to send a fresh invitation.
              </AlertDescription>
            </Alert>
          ) : null}
          {meQuery.isError && isUnauthorizedApiError(meQuery.error) ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={loginHref}>Sign in to accept</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={signupHref}>Create account</Link>
              </Button>
            </div>
          ) : null}
          {meQuery.data ? (
            <Button
              disabled={
                preview.status !== "pending" || acceptMutation.isPending
              }
              onClick={() => acceptMutation.mutate()}
            >
              {acceptMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Accept invitation
            </Button>
          ) : null}
          {acceptMutation.isError ? (
            <Alert variant="destructive">
              <AlertTitle>Unable to accept invitation</AlertTitle>
              <AlertDescription>
                {getApiErrorMessage(acceptMutation.error)}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}

function InvitationShell({
  description,
  loading,
  title,
}: {
  description: string;
  loading?: boolean;
  title: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-lg border-border/60 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
