"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignupForm() {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="name">
          Full Name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="League administrator"
          className="h-12 rounded-xl px-4"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Your Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@league.com"
          className="h-12 rounded-xl px-4"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a password"
          className="h-12 rounded-xl px-4"
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
        />
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl text-sm">
        Create account
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
