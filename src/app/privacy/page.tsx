"use client"

import Link from "next/link"
import { ChevronLeft, Shield, Lock, Eye, Download, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function PrivacyPage() {
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
            <h1 className="text-lg font-bold">Privacy & Security</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage your data, privacy, and security settings.
        </p>

        {/* Data Encryption */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Data Encryption</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your data is encrypted at rest and in transit. We use industry-standard AES-256 encryption.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Encryption active</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Visibility */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Data Visibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Control who can see your fixture data and personal information.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Share with assignors</span>
                <span className="text-green-600 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Public profile</span>
                <span className="text-gray-500 font-medium">Disabled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Export Your Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Download a copy of all your fixture data and personal information.
            </p>
            <Button variant="outline" className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Export Data (JSON)
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-500" />
              <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
