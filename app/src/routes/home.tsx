import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="p-8">
      <h1 className="text-3xl">Home!</h1>
      <div className="flex flex-col space-y-2">
        <Link to="/signup">
          <Button>Sign up</Button>
        </Link>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    </div>
  );
}
