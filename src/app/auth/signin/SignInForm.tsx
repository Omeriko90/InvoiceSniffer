"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
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

  async function onSubmit(data: FormValues) {
    await signIn("credentials", { email: data.email, password: data.password, callbackUrl: "/" })
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
        wrapperClassName="mb-[14px]"
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
          <button type="button" className="text-[12px] font-[600] text-primary hover:opacity-80">Forgot?</button>
        }
      />

      {/* CTA */}
      <AuthSubmitButton disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </AuthSubmitButton>
    </form>
  )
}
