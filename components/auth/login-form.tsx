"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">
          Your Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="info@league.com"
          className="h-12 rounded-xl px-4"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          className="h-12 rounded-xl px-4"
        />
      </div>

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          <input type="checkbox" className="size-4 rounded border-input" />
          <span>Remember Me</span>
        </label>

        <Link
          href="/login"
          className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" className="h-12 w-full rounded-xl text-sm">
        Login
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have any account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Register
        </Link>
      </p>
    </form>
  )
}
