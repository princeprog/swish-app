import {
  BarChart3Icon,
  ClipboardListIcon,
  GoalIcon,
  LayoutDashboardIcon,
  RadioIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

export const docNavItems = [
  {
    href: "/docs",
    label: "Overview",
    description:
      "The product goal, audience, MVP loop, and operating principles.",
  },
  {
    href: "/docs/architecture",
    label: "Architecture",
    description: "Domain boundaries, data flow, and service responsibilities.",
  },
  {
    href: "/docs/diagrams",
    label: "Diagrams",
    description:
      "ERD, user flow, access flow, invitation flow, and scoring event flow.",
  },
  {
    href: "/docs/readiness",
    label: "Readiness",
    description:
      "User stories, permissions, lifecycle rules, and API boundaries.",
  },
  {
    href: "/docs/roadmap",
    label: "Roadmap",
    description: "Milestone split from foundation to pilot readiness.",
  },
  {
    href: "/docs/success",
    label: "Success",
    description: "What a successful first real league looks like.",
  },
];

export const coreLoop = [
  "Create league",
  "Add divisions, teams, and players",
  "Configure format",
  "Schedule games",
  "Score games",
  "Auto-update standings and playoffs",
  "Publish public league pages",
];

export const primaryUsers = [
  "League organizer or commissioner",
  "Barangay, school, or company sports admin",
  "Scorekeeper or table official",
  "Statistician or box-score recorder",
  "Coach or team captain",
  "Player and public viewer",
];

export const domainCards = [
  {
    title: "Admin Domain",
    icon: LayoutDashboardIcon,
    description:
      "Owns organizations, leagues, seasons, divisions, teams, players, venues, and role assignment.",
  },
  {
    title: "Competition Domain",
    icon: TrophyIcon,
    description:
      "Owns formats, schedules, games, standings rules, tiebreakers, qualifiers, and playoff brackets.",
  },
  {
    title: "Scoring Domain",
    icon: ClipboardListIcon,
    description:
      "Owns game events, score calculations, corrections, quarter state, finalization, and reopen history.",
  },
  {
    title: "Public Portal",
    icon: RadioIcon,
    description:
      "Shows public schedules, results, standings, brackets, teams, rosters, and leaders from official data.",
  },
  {
    title: "Access Control",
    icon: ShieldCheckIcon,
    description:
      "Centralizes least-privilege checks for admins, scorers, coaches, players, and public viewers.",
  },
  {
    title: "Statistics And Awards",
    icon: BarChart3Icon,
    description:
      "Owns independent player box scores, score reconciliation, leaders, and confirmed Player of the Game awards.",
  },
];

export const roadmapMilestones = [
  {
    name: "Foundation and league setup",
    outcome:
      "Admins can define organizations, leagues, divisions, teams, players, venues, roles, and public shells.",
  },
  {
    name: "Schedule and format builder",
    outcome:
      "Admins can generate single/double round robin, crossover, and single/double-elimination matchups, then assign court times and staff.",
  },
  {
    name: "Responsive score table",
    outcome:
      "Scorekeepers record official scoring and fouls while a separate statistician records reconciled player box scores.",
  },
  {
    name: "Standings and brackets",
    outcome:
      "Finalized games recalculate standings, explain tiebreakers, and advance single- or double-elimination brackets safely.",
  },
  {
    name: "Public portal and pilot readiness",
    outcome:
      "Leagues share schedules, results, rosters, standings, brackets, leaders, and confirmed game awards from official records.",
  },
];

export const successSignals = [
  {
    label: "Operational",
    icon: GoalIcon,
    text: "One real basketball league can complete a season without paper-based standings disputes.",
  },
  {
    label: "Trust",
    icon: ShieldCheckIcon,
    text: "Scores, corrections, finalization, standings, and manual tie decisions have clear audit trails.",
  },
  {
    label: "Usability",
    icon: UsersIcon,
    text: "Organizers, scorers, coaches, players, and public viewers each know where to go and what is official.",
  },
];
