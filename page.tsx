"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { AuthCard } from "@/components/auth/auth-card"
import { useAuth } from "@/contexts/AuthContext"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()

  const { login, signup, resetPassword, loginWithGoogle, loginWithGithub, currentUser, logout } = useAuth()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      toast({
        title: "Signed in successfully!",
        description: "Welcome back to your account.",
      })
    } catch (error: any) {
      let errorMessage = "Failed to sign in. Please try again."

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later."
      }

      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent, firstName?: string, lastName?: string) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await signup(email, password, firstName, lastName)
      toast({
        title: "Account created!",
        description: "Your account has been created successfully.",
      })
    } catch (error: any) {
      let errorMessage = "Failed to create account. Please try again."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Please choose a stronger password."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address."
      }

      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true)

    try {
      console.log(`Attempting ${provider} sign-in...`)

      if (provider === "Google") {
        await loginWithGoogle()
        toast({
          title: "Signed in with Google!",
          description: "Welcome to your account.",
        })
      } else if (provider === "GitHub") {
        await loginWithGithub()
        toast({
          title: "Signed in with GitHub!",
          description: "Welcome to your account.",
        })
      }
    } catch (error: any) {
      console.error(`${provider} sign-in error:`, error)

      let errorMessage = `Failed to sign in with ${provider}. Please try again.`
      let errorTitle = `${provider} sign in failed`

      if (error.message && error.message.includes("Popup was blocked")) {
        errorMessage = "Popup was blocked by your browser. Please allow popups for this site and try again."
      } else if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign in was cancelled."
      } else if (error.code === "auth/cancelled-popup-request") {
        errorMessage = "Another sign-in popup is already open. Please close it and try again."
      } else if (error.code === "auth/account-exists-with-different-credential") {
        errorMessage = "An account already exists with the same email address but different sign-in credentials."
      } else if (error.code === "auth/unauthorized-domain") {
        errorTitle = "🔧 Domain Authorization Required"
        errorMessage = `Follow these steps to fix:

1. Open Firebase Console: https://console.firebase.google.com/
2. Select: my-auth-app-e937e
3. Go to: Authentication → Settings
4. Find: "Authorized domains" section
5. Click: "Add domain"
6. Add: ${window.location.hostname}
7. Also add: localhost
8. Save and refresh this page

Current domain: ${window.location.hostname}`
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: error.code === "auth/unauthorized-domain" ? 15000 : 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive",
      })
      return
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    try {
      await resetPassword(email)
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions.",
      })
    } catch (error: any) {
      let errorMessage = "Failed to send reset email. Please try again."

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      }

      toast({
        title: "Password reset failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      })
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (currentUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="w-full max-w-md mx-auto">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
            <div className="text-center">
              <h1 className="text-3xl font-normal text-white mb-4">Welcome!</h1>
              <p className="text-white/60 mb-2">You are signed in as:</p>
              <p className="text-white font-medium mb-6">{currentUser.email}</p>
              {currentUser.displayName && <p className="text-white/80 mb-6">Hello, {currentUser.displayName}!</p>}
              <button
                onClick={handleLogout}
                className="w-full bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <AuthCard
        isLoading={isLoading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onSocialLogin={handleSocialLogin}
        onForgotPassword={handleForgotPassword}
      />
      <Toaster />
    </div>
  )
}
