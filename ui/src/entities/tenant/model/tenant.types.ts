export type Tenant = {
  id: string
  name: string
  role?: string
  permissions?: string[]
  is_current?: boolean
}

export type MeContextUser = {
  id: string
  idp_sub: string
  idp_email: string
  email: string
}

export type MeContext = {
  user?: MeContextUser
  current_tenant_id?: string
  tenants?: Tenant[]
}

export type MeContextResponseDto =
  | MeContext
  | {
      success: boolean
      data?: MeContext
    }
