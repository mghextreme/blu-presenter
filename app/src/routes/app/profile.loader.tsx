import { UsersService } from "@/services";

export async function loader({ usersService }: { usersService: UsersService }) {
  return await usersService.getProfile();
}
