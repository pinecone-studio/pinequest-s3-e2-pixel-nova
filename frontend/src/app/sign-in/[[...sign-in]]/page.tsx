"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-6 shadow-xl backdrop-blur">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">EduCore нэвтрэх</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Google-ээр нэвтэрч багш эсвэл сурагчийн самбарт орно уу.
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
