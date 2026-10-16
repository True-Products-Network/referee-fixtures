"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ReviewItem {
  id: string
  type: "duplicate" | "low_confidence" | "missing_venue" | "unmatched_change"
  description: string
  fixture_summary: string
  status: "pending" | "reviewing" | "resolved" | "dismissed"
  created_at: string
}

export default function ReviewQueuePage() {
  const [items] = useState<ReviewItem[]>([
    {
      id: "1",
      type: "duplicate",
      description: "Possible duplicate fixture detected",
      fixture_summary: "Varsity Soccer - Home vs Away",
      status: "pending",
      created_at: "2026-10-15T10:00:00Z",
    },
    {
      id: "2",
      type: "missing_venue",
      description: "Venue information missing",
      fixture_summary: "JV Soccer - Team A vs Team B",
      status: "pending",
      created_at: "2026-10-14T14:30:00Z",
    },
  ])
  const [loading] = useState(false)

  function getStatusIcon(status: string) {
    switch (status) {
      case "resolved": return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "dismissed": return <XCircle className="w-5 h-5 text-gray-500" />
      default: return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case "duplicate": return <Badge variant="secondary">Duplicate</Badge>
      case "missing_venue": return <Badge variant="outline">Missing Venue</Badge>
      case "low_confidence": return <Badge variant="destructive">Low Confidence</Badge>
      default: return <Badge>Unmatched</Badge>
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
            <h1 className="text-lg font-bold">Review Queue</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Review and resolve potential issues with your fixtures.
        </p>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">All Clear!</h2>
            <p className="text-sm text-muted-foreground">
              No items need review at this time.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <CardTitle className="text-base">{item.fixture_summary}</CardTitle>
                  </div>
                  {getTypeBadge(item.type)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Review
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  )
}
