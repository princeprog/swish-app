"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLogoutMutation } from "@/hooks/use-auth";

type LogoutConfirmationDialogProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function LogoutConfirmationDialog({
  onOpenChange,
  open,
}: LogoutConfirmationDialogProps) {
  const router = useRouter();
  const logoutMutation = useLogoutMutation();

  function handleOpenChange(nextOpen: boolean) {
    if (logoutMutation.isPending) {
      return;
    }

    if (!nextOpen) {
      logoutMutation.reset();
    }

    onOpenChange(nextOpen);
  }

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
      router.replace("/login");
      router.refresh();
    } catch {
      // The dialog keeps the session intact and shows a clear retry message.
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <LogOutIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>Sign out?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll need to sign in again to manage your leagues and games.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {logoutMutation.isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              We couldn&apos;t sign you out. Your session is still active. Please
              check your connection and try again.
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={logoutMutation.isPending}>
            Stay signed in
          </AlertDialogCancel>
          <Button
            disabled={logoutMutation.isPending}
            onClick={handleLogout}
            variant="destructive"
          >
            {logoutMutation.isPending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <LogOutIcon data-icon="inline-start" />
            )}
            {logoutMutation.isPending ? "Signing out..." : "Sign out"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
