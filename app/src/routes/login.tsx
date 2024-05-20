import { LoginForm } from "@/components/auth/login-form";

export default function Login() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Login
        </h1>
      </div>
      <LoginForm />
    </>
  );
}
