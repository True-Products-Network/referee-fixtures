"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BottomNav } from "@/components/bottom-nav"

interface ArrivalRule {
  id: string
  competition_type: string | null
  role: string | null
  age_group: string | null
  arrival_lead_minutes: number
  parking_buffer_minutes: number
  match_duration_minutes: number
  post_match_buffer_minutes: number
}

const defaultRules: ArrivalRule[] = [
  {
    id: "default",
    competition_type: "All Competitions",
    role: null,
    age_group: null,
    arrival_lead_minutes: 45,
    parking_buffer_minutes: 15,
    match_duration_minutes: 90,
    post_match_buffer_minutes: 15,
  }
]

export default function ArrivalRulesPage() {
  const [rules, setRules] = useState<ArrivalRule[]>(defaultRules)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [])

  async function fetchRules() {
    try {
      setLoading(true)
      const res = await fetch('/api/arrival-rules')
      if (res.ok) {
        const data = await res.json()
        if (data.rules && data.rules.length > 0) {
          setRules(data.rules)
        }
      }
    } catch (err) {
      console.error('Failed to fetch rules:', err)
    } finally {
      setLoading(false)
    }
  }

  async function saveRules() {
    try {
      setSaving(true)
      const res = await fetch('/api/arrival-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      })
      if (!res.ok) {
        console.error('Failed to save rules')
      }
    } catch (err) {
      console.error('Failed to save rules:', err)
    } finally {
      setSaving(false)
    }
  }

  function updateRule(id: string, field: keyof ArrivalRule, value: any) {
    setRules(rules.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  function addRule() {
    const newRule: ArrivalRule = {
      id: `rule-${Date.now()}`,
      competition_type: "",
      role: null,
      age_group: null,
      arrival_lead_minutes: 45,
      parking_buffer_minutes: 15,
      match_duration_minutes: 90,
      post_match_buffer_minutes: 15,
    }
    setRules([...rules, newRule])
  }

  function deleteRule(id: string) {
    setRules(rules.filter(r => r.id !== id))
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/more">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Arrival Rules</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Set how early you need to arrive before kickoff for different types of games.
        </p>

        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {rule.competition_type || "Default Rule"}
                </CardTitle>
                {rule.id !== "default" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500"
                    onClick={() => deleteRule(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Competition Type</Label>
                <Input
                  value={rule.competition_type || ""}
                  onChange={(e) => updateRule(rule.id, "competition_type", e.target.value)}
                  placeholder="e.g. Varsity, JV, Adult League"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Arrive Before (min)</Label>
                  <Input
                    type="number"
                    value={rule.arrival_lead_minutes}
                    onChange={(e) => updateRule(rule.id, "arrival_lead_minutes", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Parking Buffer (min)</Label>
                  <Input
                    type="number"
                    value={rule.parking_buffer_minutes}
                    onChange={(e) => updateRule(rule.id, "parking_buffer_minutes", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Match Duration (min)</Label>
                  <Input
                    type="number"
                    value={rule.match_duration_minutes}
                    onChange={(e) => updateRule(rule.id, "match_duration_minutes", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Post-Match Buffer (min)</Label>
                  <Input
                    type="number"
                    value={rule.post_match_buffer_minutes}
                    onChange={(e) => updateRule(rule.id, "post_match_buffer_minutes", parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="w-full" onClick={addRule}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>

        <Button className="w-full" onClick={saveRules} disabled={saving}>
          {saving ? "Saving..." : "Save Rules"}
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
