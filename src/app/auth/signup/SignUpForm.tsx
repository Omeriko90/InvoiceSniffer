"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { signIn } from "next-auth/react"

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" fill="#4285F4"/>
      <path d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" fill="#34A853"/>
      <path d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8l3.7-2.8z" fill="#FBBC05"/>
      <path d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.3 9.1 5.4 12 5.4z" fill="#EA4335"/>
    </svg>
  )
}

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
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-[10px] rounded-[11px] border-[#E8EDFA] text-[14.5px] font-[600] mb-5"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        <GoogleLogo />
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <Separator className="flex-1" />
        <span className="text-[12px] font-[500] text-[#94A3B8]">or</span>
        <Separator className="flex-1" />
      </div>

      {/* Full name */}
      <div className="flex flex-col gap-[6px] mb-[14px]">
        <Label className="text-[12.5px] font-[600] text-[#475569]" htmlFor="name">Full name</Label>
        <Input
          id="name"
          placeholder="Jordan Maye"
          className="rounded-[10px] border-[#E8EDFA] h-[42px] text-[14px]"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-[12px] text-destructive">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-[6px] mb-[14px]">
        <Label className="text-[12.5px] font-[600] text-[#475569]" htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          className="rounded-[10px] border-[#E8EDFA] h-[42px] text-[14px]"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-[12px] text-destructive">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-[6px] mb-5">
        <Label className="text-[12.5px] font-[600] text-[#475569]" htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          className="rounded-[10px] border-[#E8EDFA] h-[42px] text-[14px]"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && <p className="text-[12px] text-destructive">{errors.password.message}</p>}
      </div>

      {/* CTA */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full text-[15px] font-[700] rounded-[11px] border-none text-white"
        style={{ background: "linear-gradient(135deg,#7AA7FF,#88D0FF)", boxShadow: "0 6px 16px rgba(122,167,255,.32)" }}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-[11.5px] text-[#94A3B8] text-center leading-[1.5] mt-[14px]">
        By creating an account you agree to our <strong className="text-[#475569]">Terms &amp; Privacy Policy</strong>.
      </p>
    </form>
  )
}
