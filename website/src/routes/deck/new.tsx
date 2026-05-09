import { createFileRoute, redirect } from '@tanstack/react-router'
import { generateId } from '../../lib/utils'

export const Route = createFileRoute('/deck/new')({
  beforeLoad: () => {
    const id = generateId()
    throw redirect({ to: '/deck/$id', params: { id } })
  },
})
