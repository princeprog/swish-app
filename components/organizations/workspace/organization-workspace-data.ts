import {
  Clock3,
  Globe,
  Layers3,
  Trophy,
  Users2,
} from "lucide-react"

export type Metric = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  action: string
}

export type Division = {
  name: string
  teams: number
  games: number
  standingsStatus: string
  tone: "live" | "progress"
}

export type Activity = {
  title: string
  detail: string
  time: string
}

export type UpcomingGame = {
  date: string
  home: string
  away: string
  venue: string
  division: string
  status: string
}

export type ReadinessItem = {
  label: string
  status: string
  tone: "complete" | "progress"
}

export const workspaceMetrics: Metric[] = [
  {
    icon: Trophy,
    label: "Active seasons",
    value: "1",
    action: "View seasons",
  },
  {
    icon: Layers3,
    label: "Total divisions",
    value: "3",
    action: "View divisions",
  },
  {
    icon: Users2,
    label: "Registered teams",
    value: "24",
    action: "View teams",
  },
  {
    icon: Users2,
    label: "Registered players",
    value: "312",
    action: "View players",
  },
  {
    icon: Clock3,
    label: "Upcoming games",
    value: "8",
    action: "View schedule",
  },
  {
    icon: Globe,
    label: "Published pages",
    value: "3",
    action: "View public pages",
  },
]

export const workspaceDivisions: Division[] = [
  {
    name: "Senior Open",
    teams: 10,
    games: 32,
    standingsStatus: "Live",
    tone: "live",
  },
  {
    name: "Under 18",
    teams: 8,
    games: 24,
    standingsStatus: "Live",
    tone: "live",
  },
  {
    name: "Women's Division",
    teams: 6,
    games: 18,
    standingsStatus: "In Progress",
    tone: "progress",
  },
]

export const workspaceActivity: Activity[] = [
  {
    title: "Organization created",
    detail: "Base workspace initialized for league operations.",
    time: "Apr 12, 2026 8:41 AM",
  },
  {
    title: "Season opened",
    detail: "2026 Summer Cup is now open for registration.",
    time: "Apr 12, 2026 8:45 AM",
  },
  {
    title: "Team added",
    detail: "Central Ballers added to Senior Open.",
    time: "Apr 13, 2026 11:02 AM",
  },
  {
    title: "Venue updated",
    detail: "Barangay Central Gymnasium details updated.",
    time: "Apr 13, 2026 2:15 PM",
  },
  {
    title: "Schedule published",
    detail: "Regular season schedule published for Senior Open.",
    time: "Apr 14, 2026 8:30 AM",
  },
  {
    title: "Score correction logged",
    detail: "Correction posted for Central Ballers vs Southside Kings.",
    time: "Apr 14, 2026 10:12 AM",
  },
]

export const workspaceUpcomingGames: UpcomingGame[] = [
  {
    date: "May 16, 2026 3:00 PM",
    home: "Central Ballers",
    away: "Southside Kings",
    venue: "Central Gym",
    division: "Senior Open",
    status: "Scheduled",
  },
  {
    date: "May 16, 2026 5:00 PM",
    home: "Riverside Hoopers",
    away: "Northview Titans",
    venue: "Riverside Court",
    division: "Under 18",
    status: "Scheduled",
  },
  {
    date: "May 17, 2026 10:00 AM",
    home: "Lady Aces",
    away: "Venus Basketball",
    venue: "Central Gym",
    division: "Women's Division",
    status: "Scheduled",
  },
  {
    date: "May 17, 2026 1:00 PM",
    home: "Westlane Warriors",
    away: "Eastside Jets",
    venue: "Westlane Court",
    division: "Senior Open",
    status: "Scheduled",
  },
]

export const operationsReadinessItems: ReadinessItem[] = [
  { label: "Venue setup complete", status: "Complete", tone: "complete" },
  {
    label: "Teams submitted rosters",
    status: "Complete",
    tone: "complete",
  },
  { label: "Schedule published", status: "Complete", tone: "complete" },
  {
    label: "Scorekeeper assignments",
    status: "In Progress",
    tone: "progress",
  },
  {
    label: "Public page visibility",
    status: "Complete",
    tone: "complete",
  },
]

export const publicPortalItems: ReadinessItem[] = [
  { label: "Public standings page", status: "Live", tone: "complete" },
  { label: "Schedule page", status: "Live", tone: "complete" },
  { label: "Team pages", status: "Live", tone: "complete" },
  { label: "Bracket page", status: "Draft", tone: "progress" },
]

export const staffPermissionRows = [
  ["Owners", "2"],
  ["Commissioners", "4"],
  ["Scorekeepers", "7"],
  ["Staff invites pending", "2"],
] as const
