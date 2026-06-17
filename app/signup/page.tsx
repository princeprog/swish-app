import { AuthShell } from "@/components/auth/auth-shell"
import { SignupForm } from "@/components/auth/signup-form"

export default function SignupPage() {
  return (
    <AuthShell
      alternateHref="/login"
      alternateLabel="Sign in"
      description="Create your account"
      title="Create your Swish account"
    >
      <SignupForm />
    </AuthShell>
  )
}
