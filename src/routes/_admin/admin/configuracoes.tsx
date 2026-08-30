import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_admin/admin/configuracoes')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_admin/admin/configuracoes"!</div>
}
