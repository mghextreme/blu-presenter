import { AuthService, UsersService } from "@/services";

export async function loader({ usersService, authService }: { usersService: UsersService, authService: AuthService }) {
  const [profile, identities] = await Promise.all([
    usersService.getProfile(),
    authService.getIdentities(),
  ]);

  return { profile, identities };
}
