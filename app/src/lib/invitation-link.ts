/** `?id=…&secret=…`, the query string of the sign-up and login links for an invitation. */
export function invitationQuery(invitation: { id: number; secret: string }): string {
  return `?${new URLSearchParams({ id: String(invitation.id), secret: invitation.secret })}`;
}
