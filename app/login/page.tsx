import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      description="Sign in your account"
      title="Welcome Back to Swish League OS"
    >
      <LoginForm />
    </AuthShell>
  )
}
