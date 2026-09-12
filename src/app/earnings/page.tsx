"use client"

import { useState } from "react"
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { DollarSign, TrendingUp, Clock, Car, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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
    role: "referee",
    appointment_status: "completed",
    payment_status: "paid",
    kickoff_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    expected_match_fee: 65.00,
    travel_fee: 10.00,
    expected_gross_amount: 75.00,
    paid_amount: 75.00,
    payment_date: format(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
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
    role: "referee",
    appointment_status: "completed",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    expected_match_fee: 85.00,
    travel_fee: 15.00,
    expected_gross_amount: 100.00,
    paid_amount: null,
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
    source_name: "Assignr",
    home_team: "North Stars",
    away_team: "South Thunder",
    sport: "soccer",
    role: "ar1",
    appointment_status: "confirmed",
    payment_status: "expected",
    kickoff_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    expected_match_fee: 50.00,
    travel_fee: 10.00,
    expected_gross_amount: 60.00,
    timezone: "America/New_York",
    pre_match_buffer_minutes: 0,
    post_match_buffer_minutes: 15,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
]

export default function EarningsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const periodFixtures = mockFixtures.filter(f => {
    const kickoff = new Date(f.kickoff_start)
    return isWithinInterval(kickoff, { start: monthStart, end: monthEnd })
  })

  const completedFixtures = periodFixtures.filter(f => f.appointment_status === 'completed')
  const paidFixtures = completedFixtures.filter(f => f.payment_status === 'paid')
  const unpaidFixtures = completedFixtures.filter(f => f.payment_status === 'expected' || f.payment_status === 'overdue')

  const totalExpected = periodFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)
  const totalPaid = paidFixtures.reduce((sum, f) => sum + (f.paid_amount || 0), 0)
  const totalUnpaid = unpaidFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)

  const stats = [
    { label: "Expected", value: totalExpected, icon: DollarSign, color: "text-blue-600" },
    { label: "Paid", value: totalPaid, icon: TrendingUp, color: "text-green-600" },
    { label: "Unpaid", value: totalUnpaid, icon: Receipt, color: "text-amber-600" },
  ]

  return (
    <div className="min-h-screen pb-20 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-lg font-bold">Earnings</h1>
          <span className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 text-center">
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-bold">${stat.value.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Period Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-2 mt-4">
            {periodFixtures
              .filter(f => f.appointment_status !== 'completed' && f.appointment_status !== 'cancelled')
              .map(fixture => (
                <Card key={fixture.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fixture.kickoff_start), "MMM d")} • {fixture.source_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${fixture.expected_gross_amount?.toFixed(2)}</p>
                        <Badge variant="outline" className="text-[10px]">Expected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            {periodFixtures.filter(f => f.appointment_status !== 'completed' && f.appointment_status !== 'cancelled').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming fixtures</p>
            )}
          </TabsContent>

          <TabsContent value="unpaid" className="space-y-2 mt-4">
            {unpaidFixtures.map(fixture => (
              <Card key={fixture.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(fixture.kickoff_start), "MMM d")} • {fixture.source_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${fixture.expected_gross_amount?.toFixed(2)}</p>
                      <Badge variant="pending" className="text-[10px]">Unpaid</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {unpaidFixtures.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No unpaid fixtures</p>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-2 mt-4">
            {paidFixtures.map(fixture => (
              <Card key={fixture.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{fixture.home_team} v {fixture.away_team}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(fixture.kickoff_start), "MMM d")} • {fixture.source_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${fixture.paid_amount?.toFixed(2)}</p>
                      <Badge variant="completed" className="text-[10px]">Paid</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {paidFixtures.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No paid fixtures yet</p>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {['Assignr', 'Arbiter', 'EventLink'].map(source => {
              const sourceFixtures = periodFixtures.filter(f => f.source_name === source)
              const sourceTotal = sourceFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)
              if (sourceTotal === 0) return null
              return (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm">{source}</span>
                  <span className="text-sm font-medium">${sourceTotal.toFixed(2)} ({sourceFixtures.length})</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  )
}
