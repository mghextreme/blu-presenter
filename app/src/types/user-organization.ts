export class UserOrganization {
  id: number
  role: "owner" | "admin" | "member"

  name?: string

  constructor(id: number, role: "owner" | "admin" | "member", name?: string) {
    this.id = id;
    this.role = role;
    this.name = name;
  }

  public canEdit(): boolean {
    return this.role == "owner" || this.role == "admin";
  }

  public isOwner(): boolean {
    return this.role == "owner";
  }
}
