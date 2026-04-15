import type { Session } from '../../../../entities/session/model/session.types'

export type SignInPayload = {
  email: string
  password: string
}

export type LoginTokensDto = {
  access_token: string
  refresh_token: string
}

export type LoginResponseDto = {
  success: boolean
  message: string
  data: LoginTokensDto
}

export type SignInResponse = Session
