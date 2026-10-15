"use client"

import { useState } from "react"
import { format, addMinutes, parseISO } from "date-fns"
import { Clock, MapPin, DollarSign, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Loader2, Navigation, Route } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"

interface CheckResult {
  status: 'available' | 'tight' | 'unavailable' | 'unknown'
  reason: string
  beforeFixture?: { time: string; venue: string; travelTime: number; distanceMiles: number | null }
  afterFixture?: { time: string; venue: string; travelTime: number; distanceMiles: number | null }
  totalCommitment: string
  expectedHourly: number
  travelToVenue: number
  mileage: number | null
  proposed: {
    arrivalTime: string
    kickoff: string
    departureTime: string
  }
  existingFixtures: number
}

export default function CheckPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [kickoff, setKickoff] = useState("10:00")
  const [duration, setDuration] = useState("90")
  const [venue, setVenue] = useState("")
  const [arrivalLead, setArrivalLead] = useState("45")
  const [role, setRole] = useState("referee")
  const [fee, setFee] = useState("")
  const [result, setResult] = useState<CheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [recording, setRecording] = useState(false)

  const handleCheck = async () => {
    setIsChecking(true)
    setResult(null)

    try {
      const res = await fetch('/api/check-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          kickoff,
          duration: parseInt(duration) || 90,
          arrivalLead: parseInt(arrivalLead) || 45,
          venue,
          role,
          fee: fee ? parseFloat(fee) : null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        setResult({
          status: 'unknown',
          reason: 'Failed to check availability. Please try again.',
          totalCommitment: '',
          expectedHourly: 0,
          travelToVenue: 30,
          mileage: null,
          proposed: { arrivalTime: '', kickoff: '', departureTime: '' },
          existingFixtures: 0,
        })
      }
    } catch (err) {
      console.error('Check failed:', err)
      setResult({
        status: 'unknown',
        reason: 'Network error. Please try again.',
        totalCommitment: '',
        expectedHourly: 0,
        travelToVenue: 30,
        mileage: null,
        proposed: { arrivalTime: '', kickoff: '', departureTime: '' },
        existingFixtures: 0,
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleRecordOffered = async () => {
    if (!result) return
    setRecording(true)
    try {
      const res = await fetch('/api/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_team: 'TBD',
          away_team: 'TBD',
          kickoff_start: result.proposed.kickoff,
          expected_match_end: result.proposed.departureTime,
          required_arrival_time: result.proposed.arrivalTime,
          appointment_status: 'offered',
          payment_status: 'expected',
          role,
          venue_name: venue || null,
          expected_gross_amount: fee ? parseFloat(fee) : null,
          source_name: 'Manual',
          import_method: 'manual_check_offer',
          travel_time_before_minutes: result.travelToVenue,
        }),
      })

      if (res.ok) {
        setResult(null)
        setVenue('')
        setFee('')
      }
    } catch (err) {
      console.error('Failed to record:', err)
    } finally {
      setRecording(false)
    }
  }

  const handleMarkAccepted = async () => {
    if (!result) return
    setRecording(true)
    try {
      const res = await fetch('/api/fixtures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_team: 'TBD',
          away_team: 'TBD',
          kickoff_start: result.proposed.kickoff,
          expected_match_end: result.proposed.departureTime,
          required_arrival_time: result.proposed.arrivalTime,
          appointment_status: 'accepted',
          payment_status: 'expected',
          role,
          venue_name: venue || null,
          expected_gross_amount: fee ? parseFloat(fee) : null,
          source_name: 'Manual',
          import_method: 'manual_check_offer',
          travel_time_before_minutes: result.travelToVenue,
        }),
      })

      if (res.ok) {
        setResult(null)
        setVenue('')
        setFee('')
      }
    } catch (err) {
      console.error('Failed to record:', err)
    } finally {
      setRecording(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-300'
      case 'tight': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'unavailable': return 'bg-red-100 text-red-800 border-red-300'
      case 'unknown': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle2 className="w-6 h-6 text-green-600" />
      case 'tight': return <AlertTriangle className="w-6 h-6 text-amber-600" />
      case 'unavailable': return <XCircle className="w-6 h-6 text-red-600" />
      case 'unknown': return <HelpCircle className="w-6 h-6 text-gray-600" />
      default: return null
    }
  }

  const formatTime = (iso: string) => {
    if (!iso) return '--'
    return format(parseISO(iso), 'h:mm a')
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Check Offer</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fixture Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kickoff">Kickoff</Label>
                <Input
                  id="kickoff"
                  type="time"
                  value={kickoff}
                  onChange={(e) => setKickoff(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="arrival">Arrival Lead (min)</Label>
                <Input
                  id="arrival"
                  type="number"
                  value={arrivalLead}
                  onChange={(e) => setArrivalLead(e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue or Address</Label>
              <Input
                id="venue"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Enter venue name or address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="referee">Referee</SelectItem>
                    <SelectItem value="ar1">AR1</SelectItem>
                    <SelectItem value="ar2">AR2</SelectItem>
                    <SelectItem value="fourth_official">4th Official</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">Expected Fee ($)</Label>
                <Input
                  id="fee"
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCheck}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className={getStatusColor(result.status)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {getStatusIcon(result.status)}
                <div>
                  <h3 className="font-bold text-lg capitalize">{result.status}</h3>
                  <p className="text-sm opacity-90">{result.reason}</p>
                </div>
              </div>

              {/* Proposed Timeline */}
              <div className="bg-white/50 rounded-lg p-3 space-y-2 mt-3">
                <p className="text-xs font-medium uppercase tracking-wide opacity-70">Proposed Timeline</p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Arrive by {formatTime(result.proposed.arrivalTime)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4" />
                  <span>Kickoff at {formatTime(result.proposed.kickoff)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Done by {formatTime(result.proposed.departureTime)}</span>
                </div>
              </div>

              {/* Travel Info */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Route className="w-4 h-4" />
                    Travel to venue
                  </span>
                  <span className="font-medium">{result.travelToVenue} min</span>
                </div>
                {result.mileage && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      Distance
                    </span>
                    <span className="font-medium">{result.mileage.toFixed(1)} miles</span>
                  </div>
                )}
              </div>

              {/* Conflict Details */}
              {result.beforeFixture && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Fixture Before:</p>
                  <p className="opacity-90">
                    {result.beforeFixture.time} at {result.beforeFixture.venue}
                    <span className="block text-xs opacity-75">
                      Travel: {result.beforeFixture.travelTime} min
                      {result.beforeFixture.distanceMiles && ` (${result.beforeFixture.distanceMiles.toFixed(1)} mi)`}
                    </span>
                  </p>
                </div>
              )}

              {result.afterFixture && (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Fixture After:</p>
                  <p className="opacity-90">
                    {result.afterFixture.time} at {result.afterFixture.venue}
                    <span className="block text-xs opacity-75">
                      Travel: {result.afterFixture.travelTime} min
                      {result.afterFixture.distanceMiles && ` (${result.afterFixture.distanceMiles.toFixed(1)} mi)`}
                    </span>
                  </p>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Total commitment
                  </span>
                  <span className="font-medium">{result.totalCommitment}</span>
                </div>
                {result.expectedHourly > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Est. hourly return
                    </span>
                    <span className="font-medium">${result.expectedHourly.toFixed(2)}/hr</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Existing fixtures nearby
                  </span>
                  <span className="font-medium">{result.existingFixtures}</span>
                </div>
              </div>

              {/* Actions */}
              {result.status !== 'unavailable' && (
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    size="sm"
                    onClick={handleRecordOffered}
                    disabled={recording}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record as Offered'}
                  </Button>
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={handleMarkAccepted}
                    disabled={recording}
                  >
                    {recording ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark Accepted'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Enter the full venue address for accurate travel time</li>
            <li>Set your home address in Profile & Travel settings</li>
            <li>Travel time is calculated using real driving distances</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
