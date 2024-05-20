import { Button } from "../ui/button";

import ArrowPathIcon from "@heroicons/react/24/solid/ArrowPathIcon";
import GoogleIcon from "../logos/google";
import MicrosoftIcon from "../logos/microsoft";
import AppleIcon from "../logos/apple";
import FacebookIcon from "../logos/facebook";
import GithubIcon from "../logos/github";

type SocialLoginProps = {
  isLoading: boolean
}

export function SocialLogin({ isLoading }: SocialLoginProps) {
  return (
    <div className="grid grid-col-1 space-y-2">
      <Button variant="outline" type="button" disabled={isLoading}>
        {isLoading ? (
          <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
        ) : (
          <GoogleIcon className="size-4 me-2"></GoogleIcon>
        )}
        {" "}Google
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        {isLoading ? (
          <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
        ) : (
          <MicrosoftIcon className="size-4 me-2"></MicrosoftIcon>
        )}
        {" "}Microsoft
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        {isLoading ? (
          <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
        ) : (
          <AppleIcon className="size-4 me-2"></AppleIcon>
        )}
        {" "}Apple
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        {isLoading ? (
          <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
        ) : (
          <FacebookIcon className="size-4 me-2"></FacebookIcon>
        )}
        {" "}Facebook
      </Button>
      <Button variant="outline" type="button" disabled={isLoading}>
        {isLoading ? (
          <ArrowPathIcon className="size-4 me-2 animate-spin"></ArrowPathIcon>
        ) : (
          <GithubIcon className="size-4 me-2"></GithubIcon>
        )}
        {" "}GitHub
      </Button>
    </div>
  )
}
