export const schemaGroups = [
  {
    schema: "auth",
    tables: "users, auth_accounts, auth_sessions",
    purpose: "Identity, login providers, and active sessions.",
  },
  {
    schema: "access",
    tables: "user_roles, invitations",
    purpose: "Role-based access control and invite acceptance.",
  },
  {
    schema: "league",
    tables: "organizations, league_seasons, divisions, teams, players, venues",
    purpose: "League setup and basketball participant records.",
  },
  {
    schema: "competition",
    tables:
      "games, standing_rules, standing_snapshots, playoff_brackets, playoff_matchups",
    purpose: "Schedules, standings, tiebreakers, and playoff structures.",
  },
  {
    schema: "scoring",
    tables: "game_events",
    purpose: "Append-only score table event log.",
  },
  {
    schema: "public",
    tables: "read-only views or materialized views later",
    purpose:
      "Public portal data can initially be queried from official league and competition tables.",
  },
]

export const diagrams = [
  {
    title: "Core ERD",
    description:
      "A planning-level data model that groups identity, access, league setup, competition, scoring, and public read models.",
    source: `erDiagram
    AUTH_USERS ||--o{ AUTH_AUTH_ACCOUNTS : owns
    AUTH_USERS ||--o{ AUTH_AUTH_SESSIONS : starts
    AUTH_USERS ||--o{ ACCESS_USER_ROLES : has
    AUTH_USERS ||--o{ ACCESS_INVITATIONS : sends
    ACCESS_INVITATIONS }o--|| LEAGUE_ORGANIZATIONS : targets
    ACCESS_INVITATIONS }o--o| LEAGUE_LEAGUE_SEASONS : targets
    ACCESS_INVITATIONS }o--o| LEAGUE_TEAMS : targets
    LEAGUE_ORGANIZATIONS ||--o{ LEAGUE_LEAGUE_SEASONS : owns
    LEAGUE_ORGANIZATIONS ||--o{ ACCESS_USER_ROLES : scopes
    LEAGUE_LEAGUE_SEASONS ||--o{ LEAGUE_DIVISIONS : contains
    LEAGUE_LEAGUE_SEASONS ||--o{ LEAGUE_VENUES : uses
    LEAGUE_LEAGUE_SEASONS ||--o{ COMPETITION_GAMES : schedules
    LEAGUE_LEAGUE_SEASONS ||--o{ ACCESS_USER_ROLES : scopes
    LEAGUE_LEAGUE_SEASONS ||--o{ COMPETITION_STANDING_RULES : configures
    LEAGUE_LEAGUE_SEASONS ||--o{ COMPETITION_PLAYOFF_BRACKETS : creates
    LEAGUE_DIVISIONS ||--o{ LEAGUE_TEAMS : contains
    LEAGUE_TEAMS ||--o{ LEAGUE_PLAYERS : registers
    LEAGUE_TEAMS ||--o{ ACCESS_USER_ROLES : scopes
    LEAGUE_TEAMS ||--o{ COMPETITION_GAMES : home_games
    LEAGUE_TEAMS ||--o{ COMPETITION_GAMES : away_games
    LEAGUE_TEAMS ||--o{ SCORING_GAME_EVENTS : owns_events
    LEAGUE_PLAYERS ||--o{ SCORING_GAME_EVENTS : records_stats
    LEAGUE_VENUES ||--o{ COMPETITION_GAMES : hosts
    COMPETITION_GAMES ||--o{ SCORING_GAME_EVENTS : records
    COMPETITION_GAMES ||--o{ COMPETITION_STANDING_SNAPSHOTS : affects
    COMPETITION_PLAYOFF_BRACKETS ||--o{ COMPETITION_PLAYOFF_MATCHUPS : contains
    COMPETITION_GAMES ||--o| COMPETITION_PLAYOFF_MATCHUPS : resolves

    AUTH_USERS {
        string id PK
        string email
        string name
        boolean emailVerified
        datetime createdAt
        datetime updatedAt
    }

    AUTH_AUTH_ACCOUNTS {
        string id PK
        string userId FK
        string provider
        string providerAccountId
        datetime createdAt
        datetime updatedAt
    }

    AUTH_AUTH_SESSIONS {
        string id PK
        string userId FK
        string sessionToken
        datetime expiresAt
        datetime createdAt
    }

    ACCESS_INVITATIONS {
        string id PK
        string email
        string role
        string token
        string organizationId FK
        string leagueId FK
        string teamId FK
        string invitedByUserId FK
        string status
        datetime expiresAt
        datetime acceptedAt
        datetime createdAt
    }

    ACCESS_USER_ROLES {
        string id PK
        string userId FK
        string role
        string organizationId FK
        string leagueId FK
        string teamId FK
        datetime createdAt
    }

    LEAGUE_ORGANIZATIONS {
        string id PK
        string name
        string slug
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_LEAGUE_SEASONS {
        string id PK
        string organizationId FK
        string name
        string slug
        boolean publicEnabled
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_DIVISIONS {
        string id PK
        string leagueId FK
        string name
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_TEAMS {
        string id PK
        string divisionId FK
        string name
        string color
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_PLAYERS {
        string id PK
        string teamId FK
        string name
        string jerseyNumber
        datetime createdAt
        datetime updatedAt
    }

    LEAGUE_VENUES {
        string id PK
        string leagueId FK
        string name
        datetime createdAt
        datetime updatedAt
    }

    COMPETITION_GAMES {
        string id PK
        string leagueId FK
        string venueId FK
        string homeTeamId FK
        string awayTeamId FK
        datetime startsAt
        string status
        datetime createdAt
        datetime updatedAt
    }

    COMPETITION_STANDING_RULES {
        string id PK
        string leagueId FK
        string divisionId FK
        string criteriaOrder
        int qualifiersPerDivision
        int wildcardCount
        datetime createdAt
        datetime updatedAt
    }

    COMPETITION_STANDING_SNAPSHOTS {
        string id PK
        string gameId FK
        string teamId FK
        int wins
        int losses
        int pointsFor
        int pointsAgainst
        int pointDifferential
        int rank
        datetime calculatedAt
    }

    COMPETITION_PLAYOFF_BRACKETS {
        string id PK
        string leagueId FK
        string name
        string status
        datetime createdAt
        datetime updatedAt
    }

    COMPETITION_PLAYOFF_MATCHUPS {
        string id PK
        string bracketId FK
        string gameId FK
        int round
        int seedA
        int seedB
        string winnerTeamId FK
    }

    SCORING_GAME_EVENTS {
        string id PK
        string gameId FK
        string teamId FK
        string playerId FK
        string type
        int points
        int quarter
        string correctionOfEventId
        string createdByUserId FK
        datetime createdAt
    }`,
  },
  {
    title: "MVP User Flow",
    description:
      "The full operational path from authentication through public official records.",
    source: `flowchart TD
    Z["User signs in or creates account"] --> ZA["System creates authenticated session"]
    ZA --> A["Organizer creates organization"]
    A --> B["Create basketball league season"]
    B --> C["Create divisions or categories"]
    C --> D["Manually add teams"]
    D --> E["Manually add players and jersey numbers"]
    E --> F["Invite league admins and scorers"]
    F --> FA["Invited user accepts invite after sign-in"]
    FA --> FB["System creates scoped user role"]
    FB --> G["Configure guided custom format"]
    G --> H["Set tiebreaker order and playoff qualifiers"]
    H --> I["Create game schedule"]
    I --> J["Public league page becomes shareable"]
    I --> K["Scorer opens assigned game"]
    K --> L["Record points, fouls, quarters, and corrections"]
    L --> M{"Game ready to finalize?"}
    M -- "No" --> L
    M -- "Yes" --> N["Finalize game"]
    N --> O["System recalculates standings"]
    O --> P{"Playoff qualification ready?"}
    P -- "No" --> I
    P -- "Yes" --> Q["Generate or update playoff bracket"]
    Q --> R["Public portal shows official results, standings, and bracket"]`,
  },
  {
    title: "Role Access Flow",
    description:
      "Least-privilege access across organization, league, game, team, and public scopes.",
    source: `flowchart LR
    OWNER["Organization Owner"] -->|Full access across organization| ORG["Organization"]
    ADMIN["League Admin"] -->|Manage one league| LEAGUE["League Season"]
    SCORER["Scorer"] -->|Score assigned games| GAME["Game"]
    COACH["Coach or Captain"] -->|View team and future roster tools| TEAM["Team"]
    PLAYER["Player"] -->|View team, schedule, and personal stats| PUBLIC["Public Portal"]
    VIEWER["Public Viewer"] -->|Read-only public pages| PUBLIC

    ORG --> LEAGUE
    LEAGUE --> TEAM
    LEAGUE --> GAME
    GAME --> PUBLIC`,
  },
  {
    title: "Authentication And Invitation Flow",
    description:
      "How invited admins, scorers, and team roles become scoped access records.",
    source: `sequenceDiagram
    actor Organizer
    actor InvitedUser as Invited User
    participant Auth as Authentication
    participant App as League OS
    participant Invite as Invitation Service
    participant RBAC as Role Access

    Organizer->>Auth: Sign in
    Auth-->>App: Authenticated session
    Organizer->>App: Invite scorer/admin/coach
    App->>Invite: Create invitation token
    Invite-->>InvitedUser: Send invite link
    InvitedUser->>Auth: Sign in or create account
    Auth-->>App: Authenticated session
    InvitedUser->>App: Accept invitation token
    App->>RBAC: Create scoped UserRole
    RBAC-->>App: Role active
    App-->>InvitedUser: Show permitted league area`,
  },
  {
    title: "Scoring Event Flow",
    description:
      "Append-only scoring events update live state, final official results, standings, and public pages.",
    source: `sequenceDiagram
    actor Scorer
    participant UI as Responsive Score Table
    participant API as Server Action/API
    participant Log as Game Event Log
    participant Calc as Score Calculator
    participant Public as Public Portal

    Scorer->>UI: Tap player score or foul
    UI->>API: Submit game event
    API->>Log: Append event
    API->>Calc: Recalculate current game state
    Calc-->>UI: Return updated score and fouls
    UI-->>Scorer: Show updated game state
    Scorer->>UI: Finalize game
    UI->>API: Submit finalization event
    API->>Log: Append finalization event
    API->>Calc: Recalculate official result and standings
    Calc->>Public: Publish official result`,
  },
]
