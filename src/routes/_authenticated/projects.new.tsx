import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/projects/new")({
  beforeLoad: () => { throw redirect({ to: "/projects/$id/edit", params: { id: "new" } }); },
});
