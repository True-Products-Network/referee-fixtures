"use client"

import { useState } from "react"
import { format, addMinutes } from "date-fns"
import { Clock, MapPin, DollarSign, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from "lucide-react"
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
  beforeFixture?: { time: string; venue: string; travelTime: number }
  afterFixture?: { time: string; venue: string; travelTime: number }
  totalCommitment: string
  expectedHourly: number
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

  const handleCheck = async () => {
    setIsChecking(true)
    
    // Simulate conflict check
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock result
    const mockResult: CheckResult = {
      status: 'available',
      reason: 'No conflicts found. You have a 3-hour gap before your next fixture.',
      totalCommitment: '3 hours 15 minutes',
      expectedHourly: fee ? parseFloat(fee) / 3.25 : 0,
    }
    
    setResult(mockResult)
    setIsChecking(false)
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
              {isChecking ? 'Checking...' : 'Check Availability'}
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
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="flex-1" size="sm">
                  Record as Offered
                </Button>
                <Button className="flex-1" size="sm">
                  Mark Accepted
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Enter the full venue address for accurate travel time</li>
            <li>The system checks your personal Google Calendar for conflicts</li>
            <li>Travel time is calculated from your previous location</li>
          </ul>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
