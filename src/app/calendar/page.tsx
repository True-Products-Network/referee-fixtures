"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import type { Fixture } from "@/types"

const mockFixtures: Fixture[] = [
  {
    id: "1",
    tenant_id: "1",
    user_id: "1",
    source_name: "Assignr",
    home_team: "Red Dragons FC",
    away_team: "Blue Eagles United",
    sport: "soccer",
    competition: "U14 Division A",
    role: "referee",
    appointment_status: "confirmed",
    payment_status: "expected",
    kickoff_start: new Date().toISOString(),
    expected_match_end: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    tenant_id: "1",
    user_id: "1",
    source_name: "Arbiter",
    home_team: "Westside High",
    away_team: "Eastview Academy",
    sport: "soccer",
    competition: "Varsity Boys",
    role: "referee",
    appointment_status: "accepted",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    tenant_id: "1",
    user_id: "1",
    source_name: "EventLink",
    home_team: "North Stars",
    away_team: "South Thunder",
    sport: "soccer",
    competition: "Adult Amateur",
    role: "ar1",
    appointment_status: "offered",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    conflict_status: "tight",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'offered': return 'bg-blue-400'
    case 'accepted': return 'bg-green-500'
    case 'confirmed': return 'bg-green-600'
    case 'change_pending': return 'bg-amber-500'
    case 'declined': return 'bg-gray-400'
    case 'completed': return 'bg-emerald-700'
    case 'cancelled': return 'bg-gray-300'
    default: return 'bg-gray-400'
  }
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [view, setView] = useState<'month' | 'agenda'>('month')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const fixturesForDate = (date: Date) => {
    return mockFixtures.filter(f => 
      isSameDay(new Date(f.kickoff_start), date)
    )
  }

  const selectedFixtures = selectedDate ? fixturesForDate(selectedDate) : []

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Calendar</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView(view === 'month' ? 'agenda' : 'month')}>
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="px-4">
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map((day, idx) => {
              const fixtures = fixturesForDate(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const hasConflict = fixtures.some(f => f.conflict_status === 'tight' || f.conflict_status === 'unavailable')
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative
                    ${isToday(day) ? 'bg-primary/10 font-bold' : ''}
                    ${isSelected ? 'ring-2 ring-primary' : ''}
                    ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground' : ''}
                    hover:bg-accent transition-colors
                  `}
                >
                  <span>{format(day, "d")}</span>
                  {fixtures.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {fixtures.slice(0, 3).map((f, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full ${getStatusColor(f.appointment_status)}`}
                        />
                      ))}
                      {hasConflict && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-1 right-1" />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Date Fixtures */}
        {selectedDate && (
          <div className="px-4 mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, "EEEE, MMM d")}
            </h3>
            {selectedFixtures.length > 0 ? (
              selectedFixtures.map(fixture => (
                <Card key={fixture.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{fixture.source_name}</Badge>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(fixture.appointment_status)}`} />
                        </div>
                        <p className="font-medium">{fixture.home_team} v {fixture.away_team}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(fixture.kickoff_start), "h:mm a")} • {fixture.role}
                        </p>
                        {fixture.competition && (
                          <p className="text-xs text-muted-foreground">{fixture.competition}</p>
                        )}
                      </div>
                      {fixture.conflict_status && (
                        <Badge variant={fixture.conflict_status === 'tight' ? 'tight' : 'conflict'} className="text-[10px]">
                          {fixture.conflict_status}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No fixtures on this date
              </p>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
