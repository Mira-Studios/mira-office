import { createFileRoute, redirect } from '@tanstack/react-router'
import { generateId } from '../../lib/utils'

export const Route = createFileRoute('/type/new')({
  beforeLoad: () => {
    const id = generateId()
    throw redirect({ to: `/type/${id}` })
  },
})
