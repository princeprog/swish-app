import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      alternateHref="/signup"
      alternateLabel="Sign up"
      description="Sign in your account"
      title="Welcome Back to Swish League OS"
    >
      <LoginForm />
    </AuthShell>
  )
}
