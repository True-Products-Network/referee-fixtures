"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Link2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronLeft,
  Plus
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { SourceConnection, SourceDefinition } from "@/types"

const mockSources: (SourceConnection & { definition: SourceDefinition })[] = [
  {
    id: "1",
    tenant_id: "1",
    user_id: "1",
    source_definition_id: "1",
    name: "My Assignr Feed",
    connection_method: "ical_feed",
    credentials_encrypted: null,
    feed_url_encrypted: "***",
    refresh_interval_minutes: 60,
    last_successful_check: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    next_planned_check: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    imported_record_count: 12,
    error_count: 0,
    status: "active",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    definition: {
      id: "1",
      name: "assignr",
      label: "Assignr",
      adapter_type: "ical",
      capabilities: ["read", "ical_feed"],
      is_active: true,
      sort_order: 1,
      created_at: new Date().toISOString(),
    }
  },
  {
    id: "2",
    tenant_id: "1",
    user_id: "1",
    source_definition_id: "2",
    name: "Arbiter Sports",
    connection_method: "ical_feed",
    credentials_encrypted: null,
    feed_url_encrypted: null,
    refresh_interval_minutes: 60,
    last_successful_check: null,
    next_planned_check: null,
    imported_record_count: 0,
    error_count: 0,
    status: "pending",
    is_active: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    definition: {
      id: "2",
      name: "arbiter",
      label: "ArbiterSports",
      adapter_type: "ical",
      capabilities: ["read", "ical_feed"],
      is_active: true,
      sort_order: 2,
      created_at: new Date().toISOString(),
    }
  }
]

const availableSources: SourceDefinition[] = [
  {
    id: "3",
    name: "eventlink",
    label: "EventLink",
    adapter_type: "ical",
    capabilities: ["read", "ical_feed"],
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "refquest",
    label: "RefQuest / RQ+",
    adapter_type: "email",
    capabilities: ["read", "email"],
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "refr_sports",
    label: "Refr Sports",
    adapter_type: "email",
    capabilities: ["read", "email"],
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  }
]

function getStatusIcon(status: string) {
  switch (status) {
    case 'active': return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'error': return <XCircle className="w-5 h-5 text-red-500" />
    case 'paused': return <AlertTriangle className="w-5 h-5 text-amber-500" />
    case 'pending': return <AlertTriangle className="w-5 h-5 text-blue-500" />
    default: return <AlertTriangle className="w-5 h-5 text-gray-500" />
  }
}

export default function SourcesPage() {
  const [sources] = useState(mockSources)

  return (
    <div className="min-h-screen pb-8 bg-background">
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/more">
                <ChevronLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-bold">Source Connections</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
        {/* Connected Sources */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Connected
          </h2>
          {sources.map(source => (
            <Card key={source.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(source.status)}
                    <div>
                      <p className="font-medium">{source.name}</p>
                      <p className="text-xs text-muted-foreground">{source.definition.label}</p>
                    </div>
                  </div>
                  <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                    {source.status}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{source.connection_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imported</span>
                    <span>{source.imported_record_count} fixtures</span>
                  </div>
                  {source.last_successful_check && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last sync</span>
                      <span>{new Date(source.last_successful_check).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Available Sources */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
            Available Sources
          </h2>
          {availableSources.map(source => (
            <Card key={source.id} className="mb-3">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Link2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{source.label}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {source.adapter_type} connection
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Manual Entry */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Manual Entry</p>
                  <p className="text-xs text-muted-foreground">Add fixtures manually</p>
                </div>
              </div>
              <Button size="sm" asChild>
                <Link href="/fixtures/new">Add</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
