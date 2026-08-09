"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2, MailCheckIcon, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { ComponentReveal, PageEntrance } from "@/components/motion/page-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getApiErrorMessage, isUnauthorizedApiError, useMeQuery } from "@/hooks/use-auth"
import { getOrganizationLandingPathForRole } from "@/lib/organization-routing"
import { notificationService } from "@/services/notification.service"

export function InvitationNotificationScreen() {
  const params = useParams<{ invitationId: string }>()
  const router = useRouter()
  const invitationId = params.invitationId
  const meQuery = useMeQuery()
  const previewQuery = useQuery({
    enabled: Boolean(invitationId && meQuery.data?.user),
    queryFn: () => notificationService.invitationPreview(invitationId),
    queryKey: ["notification-invitation-preview", invitationId],
    retry: false,
  })
  const acceptMutation = useMutation({
    mutationFn: () => notificationService.acceptInvitation(invitationId),
    onSuccess: () => {
      const preview = previewQuery.data
      toast.success("Invitation accepted")
      router.push(
        preview?.organization.slug && preview.role
          ? getOrganizationLandingPathForRole(
              preview.organization.slug,
              preview.role as Parameters<typeof getOrganizationLandingPathForRole>[1],
            )
          : "/organizations",
      )
    },
  })

  if (meQuery.isLoading || (meQuery.data?.user && previewQuery.isLoading)) {
    return <InvitationNotificationShell title="Checking invitation" description="One moment while we verify this league invitation." loading />
  }

  if (meQuery.isError && isUnauthorizedApiError(meQuery.error)) {
    const redirect = `/invitations/${encodeURIComponent(invitationId)}`
    return (
      <InvitationNotificationShell title="Sign in to view this invitation" description="This invitation is connected to the email address it was sent to.">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`}>Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/signup?redirect=${encodeURIComponent(redirect)}`}>Create account</Link>
          </Button>
        </div>
      </InvitationNotificationShell>
    )
  }

  if (previewQuery.isError) {
    return <InvitationNotificationShell title="Invitation not available" description={getApiErrorMessage(previewQuery.error)} />
  }

  const preview = previewQuery.data
  if (!preview) {
    return <InvitationNotificationShell title="Invitation not available" description="We couldn't load this invitation. Ask the organization owner to send a fresh invitation." />
  }

  return (
    <PageEntrance asChild>
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <Card className="w-full max-w-xl border-border/60 shadow-none">
            <CardHeader>
              <div className="mb-2 flex size-10 items-center justify-center rounded-md border bg-muted/40">
                <MailCheckIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <CardTitle>Accept league invitation</CardTitle>
              <CardDescription>
                {preview.organization.name} invited {preview.email} as {preview.role.replace("_", " ")}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview.status !== "pending" ? (
                <Alert variant="destructive">
                  <ShieldAlert className="size-4" />
                  <AlertTitle>This invitation is {preview.status}</AlertTitle>
                  <AlertDescription>Ask the organization owner to send a fresh invitation.</AlertDescription>
                </Alert>
              ) : null}
              <Button
                disabled={preview.status !== "pending" || acceptMutation.isPending}
                onClick={() => acceptMutation.mutate()}
              >
                {acceptMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                Accept invitation
              </Button>
              {acceptMutation.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Unable to accept invitation</AlertTitle>
                  <AlertDescription>{getApiErrorMessage(acceptMutation.error)}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}

function InvitationNotificationShell({
  children,
  description,
  loading,
  title,
}: {
  children?: React.ReactNode
  description: string
  loading?: boolean
  title: string
}) {
  return (
    <PageEntrance asChild>
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <Card className="w-full max-w-lg border-border/60 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            {children ? <CardContent>{children}</CardContent> : null}
          </Card>
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}
