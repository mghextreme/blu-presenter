import { Button } from "@/components/ui/button";

import { GoogleIcon } from "@/components/logos/google";
import { SpotifyIcon } from "@/components/logos/spotify";
// import MicrosoftIcon from "@/components/logos/microsoft";
// import AppleIcon from "@/components/logos/apple";
// import FacebookIcon from "@/components/logos/facebook";
// import GithubIcon from "@/components/logos/github";

type SocialLoginProps = {
  disabled: boolean
  onSignIn: (provider: string) => void
}

export function SocialLogin({ disabled, onSignIn }: Readonly<SocialLoginProps>) {

  return (
    <div className="grid grid-col-1 space-y-2">
      <Button variant="outline" type="button" disabled={disabled} onClick={() => onSignIn('google')}>
        <GoogleIcon className="size-4 me-2"></GoogleIcon>
        {" "}Google
      </Button>
      <Button variant="outline" type="button" disabled={disabled} onClick={() => onSignIn('spotify')}>
        <SpotifyIcon className="size-4 me-2"></SpotifyIcon>
        {" "}Spotify
      </Button>
      {/* <Button variant="outline" type="button" disabled={disabled}>
        <MicrosoftIcon className="size-4 me-2"></MicrosoftIcon>
        {" "}Microsoft
      </Button>
      <Button variant="outline" type="button" disabled={disabled}>
        <AppleIcon className="size-4 me-2"></AppleIcon>
        {" "}Apple
      </Button>
      <Button variant="outline" type="button" disabled={disabled}>
        <FacebookIcon className="size-4 me-2"></FacebookIcon>
        {" "}Facebook
      </Button>
      <Button variant="outline" type="button" disabled={disabled}>
        <GithubIcon className="size-4 me-2"></GithubIcon>
        {" "}GitHub
      </Button> */}
    </div>
  )
}
