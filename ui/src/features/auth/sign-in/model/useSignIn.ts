import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../../../app/providers/AuthContext'
import { signIn } from '../api/signIn'
import type { Session } from '../../../../entities/session/model/session.types'

type UseSignInOptions = {
  onSuccess?: (session: Session) => void
}

export function useSignIn(options?: UseSignInOptions) {
  const { setSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const session = await signIn({ email, password })
      setSession(session)
      options?.onSuccess?.(session)
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Ocurrio un error al iniciar sesion.'

      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    email,
    password,
    error,
    isSubmitting,
    setEmail,
    setPassword,
    handleSubmit,
  }
}


