"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function useAuth(requireAuth: boolean = true) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)

      if (requireAuth && !user) {
        router.push("/auth/signin")
      }
    }

    getUser()

    const { data: { subscription } } = createClient().auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (requireAuth && !session?.user) {
          router.push("/auth/signin")
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [requireAuth, router])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/signin")
  }

  return { user, loading, signOut }
}
