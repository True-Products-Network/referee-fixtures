"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
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
  arrival_lead_minutes: number | string
  parking_buffer_minutes: number | string
  match_duration_minutes: number | string
  post_match_buffer_minutes: number | string
}

const COMPETITION_OPTIONS = [
  "All Competitions",
  "Varsity",
  "Junior Varsity",
  "Freshman",
  "Club",
  "College",
  "Pro",
  "Adult League",
  "Recreational",
  "Tournament",
  "Playoff",
  "Scrimmage",
]

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "referee", label: "Referee (Center)" },
  { value: "ar1", label: "AR1 (Assistant Referee 1)" },
  { value: "ar2", label: "AR2 (Assistant Referee 2)" },
  { value: "fourth_official", label: "Fourth Official" },
]

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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string>('')

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
      setSaveStatus('idle')
      setSaveError('')
      
      // Convert string values to numbers before sending
      const rulesToSave = rules.map(rule => ({
        ...rule,
        arrival_lead_minutes: typeof rule.arrival_lead_minutes === 'string' ? parseInt(rule.arrival_lead_minutes) || 0 : rule.arrival_lead_minutes,
        parking_buffer_minutes: typeof rule.parking_buffer_minutes === 'string' ? parseInt(rule.parking_buffer_minutes) || 0 : rule.parking_buffer_minutes,
        match_duration_minutes: typeof rule.match_duration_minutes === 'string' ? parseInt(rule.match_duration_minutes) || 0 : rule.match_duration_minutes,
        post_match_buffer_minutes: typeof rule.post_match_buffer_minutes === 'string' ? parseInt(rule.post_match_buffer_minutes) || 0 : rule.post_match_buffer_minutes,
      }))
      
      const res = await fetch('/api/arrival-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rulesToSave })
      })
      if (res.ok) {
        setSaveStatus('success')
        // Clear success message after 3 seconds
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const data = await res.json()
        console.error('Failed to save rules:', data.error)
        setSaveStatus('error')
        setSaveError(data.error || 'Failed to save')
      }
    } catch (err) {
      console.error('Failed to save rules:', err)
      setSaveStatus('error')
      setSaveError(err instanceof Error ? err.message : 'Network error')
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
                <select
                  value={rule.competition_type || ""}
                  onChange={(e) => updateRule(rule.id, "competition_type", e.target.value || null)}
                  className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-900"
                >
                  <option value="">Select competition...</option>
                  {COMPETITION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Role (optional)</Label>
                <select
                  value={rule.role || ""}
                  onChange={(e) => updateRule(rule.id, "role", e.target.value || null)}
                  className="w-full mt-1 p-2 border rounded-md text-sm bg-white dark:bg-gray-900"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Arrive Before (min)</Label>
                  <Input
                    type="number"
                    value={rule.arrival_lead_minutes}
                    onChange={(e) => updateRule(rule.id, "arrival_lead_minutes", e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Parking Buffer (min)</Label>
                  <Input
                    type="number"
                    value={rule.parking_buffer_minutes}
                    onChange={(e) => updateRule(rule.id, "parking_buffer_minutes", e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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
                    onChange={(e) => updateRule(rule.id, "match_duration_minutes", e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Post-Match Buffer (min)</Label>
                  <Input
                    type="number"
                    value={rule.post_match_buffer_minutes}
                    onChange={(e) => updateRule(rule.id, "post_match_buffer_minutes", e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
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

        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Rules saved successfully
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Failed to save rules{saveError ? `: ${saveError}` : ''}
          </div>
        )}
        <Button className="w-full" onClick={saveRules} disabled={saving}>
          {saving ? "Saving..." : "Save Rules"}
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}
