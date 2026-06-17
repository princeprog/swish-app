"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage, useRegisterMutation } from "@/hooks/use-auth"

export function SignupForm() {
  const router = useRouter()
  const registerMutation = useRegisterMutation()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.")
      return
    }

    setValidationError(null)

    try {
      await registerMutation.mutateAsync({
        email,
        name,
        password,
      })
      toast.success("Account created successfully")
      router.push("/organizations")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {validationError || registerMutation.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to create account</AlertTitle>
          <AlertDescription>
            {validationError ?? getApiErrorMessage(registerMutation.error)}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="League administrator"
          className="h-12 rounded-xl px-4"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Your Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@league.com"
          className="h-12 rounded-xl px-4"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          className="h-12 rounded-xl px-4"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">
          Confirm Password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder="Re-enter your password"
          className="h-12 rounded-xl px-4"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl text-sm"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}
