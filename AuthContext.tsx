"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  currentUser: User | null
  loading: boolean
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loginWithGithub: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function signup(email: string, password: string, firstName?: string, lastName?: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    // Update user profile with display name if provided
    if (firstName || lastName) {
      const displayName = `${firstName || ""} ${lastName || ""}`.trim()
      await updateProfile(user, { displayName })
    }
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    await signOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  async function loginWithGoogle() {
    try {
      console.log("Attempting Google sign-in...")
      const provider = new GoogleAuthProvider()

      // Add additional scopes if needed
      provider.addScope("email")
      provider.addScope("profile")

      // Set custom parameters
      provider.setCustomParameters({
        prompt: "select_account",
      })

      console.log("Opening Google popup...")
      const result = await signInWithPopup(auth, provider)
      console.log("Google sign-in successful:", result.user.email)

      return result
    } catch (error: any) {
      console.error("Google sign-in error:", error)

      // More specific error handling
      if (error.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked by your browser. Please allow popups for this site.")
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in was cancelled.")
      } else if (error.code === "auth/cancelled-popup-request") {
        throw new Error("Another sign-in popup is already open.")
      } else if (error.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname
        throw new Error(`Domain "${currentDomain}" is not authorized. 

QUICK FIX:
1. Go to https://console.firebase.google.com/
2. Select project: my-auth-app-e937e
3. Go to Authentication → Settings
4. Scroll to "Authorized domains"
5. Click "Add domain" and add: ${currentDomain}
6. Also add: localhost (for development)
7. Save and try again

Current unauthorized domain: ${currentDomain}`)
      }

      throw error
    }
  }

  async function loginWithGithub() {
    try {
      console.log("Attempting GitHub sign-in...")
      const provider = new GithubAuthProvider()

      // Add scopes
      provider.addScope("user:email")

      console.log("Opening GitHub popup...")
      const result = await signInWithPopup(auth, provider)
      console.log("GitHub sign-in successful:", result.user.email)

      return result
    } catch (error: any) {
      console.error("GitHub sign-in error:", error)

      if (error.code === "auth/popup-blocked") {
        throw new Error("Popup was blocked by your browser. Please allow popups for this site.")
      } else if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in was cancelled.")
      }

      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value: AuthContextType = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    loginWithGoogle,
    loginWithGithub,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}
