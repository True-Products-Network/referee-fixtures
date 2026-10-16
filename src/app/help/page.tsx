"use client"

import Link from "next/link"
import { ChevronLeft, HelpCircle, Mail, MessageSquare, BookOpen, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const FAQS = [
  {
    question: "How do I add a new fixture source?",
    answer: "Go to More → Source Connections and click 'Add Source Connection'. Enter your iCal feed URL from Assignr, ArbiterSports, or Eventlink."
  },
  {
    question: "Why isn't my fixture showing the correct time?",
    answer: "Make sure your timezone is set correctly in Profile & Travel settings. The app converts all times to your local timezone."
  },
  {
    question: "How do arrival rules work?",
    answer: "Arrival rules let you set how early you need to arrive before kickoff. Go to More → Arrival Rules to customize times by competition type."
  },
  {
    question: "Can I sync with Google Calendar?",
    answer: "Yes! Go to More → Google Calendar to connect your calendar and sync fixtures automatically."
  },
  {
    question: "How do I track my earnings?",
    answer: "The Earnings tab shows your expected and paid fees. You can also add expenses like mileage and parking."
  },
]

export default function HelpPage() {
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
            <h1 className="text-lg font-bold">Help & Support</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Get help with Referee Fixture Hub.
        </p>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="https://docs.openclaw.ai" target="_blank">
                <BookOpen className="w-4 h-4 mr-2" />
                Documentation
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Community Forum
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Need help? Reach out to our support team.
            </p>
            <Button className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Email Support
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <CardTitle className="text-sm font-medium">{faq.question}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Referee Fixture Hub v0.1.0</p>
          <p>Built for Nigel Lear</p>
        </div>
      </main>
    </div>
  )
}
