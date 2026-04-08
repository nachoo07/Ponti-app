export type JwtPayload = {
  sub: string
  email?: string
  exp: number
  [key: string]: unknown
}

export type User = {
  id: string
  email: string
  name: string
}

export type SessionTokens = {
  accessToken: string
  refreshToken: string
}

export type Session = SessionTokens & {
  user: User
  expiresAt: number
}

