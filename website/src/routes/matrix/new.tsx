import { createFileRoute, redirect } from '@tanstack/react-router'
import { generateId } from '../../lib/utils'

export const Route = createFileRoute('/matrix/new')({
  beforeLoad: () => {
    const id = generateId()
    throw redirect({ to: '/matrix/$id', params: { id } })
  },
})
