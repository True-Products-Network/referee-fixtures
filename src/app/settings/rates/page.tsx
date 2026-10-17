"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ChevronLeft, Plus, Trash2, DollarSign, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RateCard {
  id: string
  competition_type: string
  role: string
  fee_amount: number
}

const ROLES = [
  { value: 'referee', label: 'Referee' },
  { value: 'ar1', label: 'AR1' },
  { value: 'ar2', label: 'AR2' },
  { value: 'fourth_official', label: '4th Official' },
]

const DEFAULT_COMPETITIONS = [
  'MLS Next',
  'ECNL',
  'High School Varsity',
  'High School JV',
  'College D1',
  'College D2',
  'College D3',
  'NAIA',
  'Adult Amateur',
  'Youth Rec',
]

export default function RatesPage() {
  const [rates, setRates] = useState<RateCard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCompetition, setNewCompetition] = useState('')
  const [newRole, setNewRole] = useState('referee')
  const [newFee, setNewFee] = useState('')

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('/api/rate-cards')
      if (res.ok) {
        const data = await res.json()
        setRates(data.rates || [])
      }
    } catch (err) {
      console.error('Failed to fetch rates:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  async function addRate() {
    if (!newCompetition || !newFee) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/rate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competition_type: newCompetition,
          role: newRole,
          fee_amount: parseFloat(newFee),
        }),
      })

      if (res.ok) {
        setNewCompetition('')
        setNewFee('')
        fetchRates()
      }
    } catch (err) {
      console.error('Failed to add rate:', err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteRate(id: string) {
    try {
      const res = await fetch(`/api/rate-cards?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchRates()
      }
    } catch (err) {
      console.error('Failed to delete rate:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/more">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Rate Cards</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Set your fees by competition and role. When fixtures sync, fees are auto-assigned.
        </p>

        {/* Add New Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Competition</Label>
              <Select value={newCompetition} onValueChange={setNewCompetition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or type competition" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_COMPETITIONS.map(comp => (
                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee ($)</Label>
                <Input
                  type="number"
                  value={newFee}
                  onChange={(e) => setNewFee(e.target.value)}
                  placeholder="75.00"
                />
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={addRate}
              disabled={saving || !newCompetition || !newFee}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Rate
            </Button>
          </CardContent>
        </Card>

        {/* Rate List */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Your Rates ({rates.length})
          </h2>
          
          {rates.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No rates set yet</p>
                <p className="text-xs">Add rates above to auto-assign fees to fixtures</p>
              </CardContent>
            </Card>
          ) : (
            rates.map(rate => (
              <Card key={rate.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{rate.competition_type}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {rate.role.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">${rate.fee_amount.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500"
                        onClick={() => deleteRate(rate.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
