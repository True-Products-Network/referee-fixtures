"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, MapPin, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [homeAddress, setHomeAddress] = useState("")
  const [mileageRate, setMileageRate] = useState("0.67")

  useEffect(() => {
    if (user) {
      // Fetch profile from database (source of truth)
      fetchProfile()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setFullName(data.full_name || "")
        setPhone(data.phone || "")
        setHomeAddress(data.home_address || "")
        setMileageRate(data.mileage_rate?.toString() || "0.67")
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          home_address: homeAddress,
          mileage_rate: parseFloat(mileageRate),
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/more')}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Profile & Travel</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personal Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Travel Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="homeAddress">Home Address</Label>
              <Input
                id="homeAddress"
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
              <p className="text-xs text-muted-foreground">
                Used to calculate travel time and mileage to venues
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mileageRate">Mileage Rate ($/mile)</Label>
              <Input
                id="mileageRate"
                type="number"
                step="0.01"
                value={mileageRate}
                onChange={(e) => setMileageRate(e.target.value)}
                placeholder="0.67"
              />
              <p className="text-xs text-muted-foreground">
                IRS standard rate for {new Date().getFullYear()} is $0.67/mile
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </main>
    </div>
  )
}
