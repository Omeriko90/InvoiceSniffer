"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { GoogleButton } from "@/components/auth/GoogleButton"
import { OrDivider } from "@/components/auth/OrDivider"
import { AuthTextField } from "@/components/auth/AuthTextField"
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton"

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

export function SignInForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(_data: FormValues) {
    // Credentials sign-in is not implemented — there is no Credentials provider
    // (see src/lib/auth.ts), so calling signIn("credentials", …) would just error.
    // Google OAuth is the only auth path. Do NOT log form values: they include
    // the plaintext password. Before wiring a Credentials provider here, it MUST
    // have password hashing (argon2/bcrypt), a constant-time compare, generic
    // errors (no user enumeration), and rate limiting on the sign-in endpoint.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
      {/* Google */}
      <GoogleButton onClick={() => signIn("google", { callbackUrl: "/" })} />

      {/* Divider */}
      <OrDivider />

      {/* Email */}
      <AuthTextField
        id="email"
        label="Work email"
        type="email"
        placeholder="you@company.com"
        error={errors.email?.message}
        registration={register("email")}
        wrapperClassName="mb-3.5"
      />

      {/* Password */}
      <AuthTextField
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        registration={register("password")}
        wrapperClassName="mb-5"
        labelAccessory={
          <Button
            type="button"
            variant="link"
            size="inline"
          >
            Forgot?
          </Button>
        }
      />

      {/* CTA */}
      <AuthSubmitButton disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </AuthSubmitButton>
    </form>
  )
}
