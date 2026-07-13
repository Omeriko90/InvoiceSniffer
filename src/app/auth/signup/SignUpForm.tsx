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
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type FormValues = z.infer<typeof schema>

export function SignUpForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(_data: FormValues) {
    // Credentials signup not implemented yet — Google OAuth is primary.
    // Do not log form values here: they include the plaintext password.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-0">
      {/* Google */}
      <GoogleButton onClick={() => signIn("google", { callbackUrl: "/" })} />

      {/* Divider */}
      <OrDivider />

      {/* Full name */}
      <AuthTextField
        id="name"
        label="Full name"
        placeholder="Jordan Maye"
        error={errors.name?.message}
        registration={register("name")}
        wrapperClassName="mb-[14px]"
      />

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
      />

      {/* CTA */}
      <AuthSubmitButton disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </AuthSubmitButton>

      <p className="text-[11.5px] text-[#94A3B8] text-center leading-[1.5] mt-[14px]">
        By creating an account you agree to our <strong className="text-[#475569]">Terms &amp; Privacy Policy</strong>.
      </p>
    </form>
  )
}
