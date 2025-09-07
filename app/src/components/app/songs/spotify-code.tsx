import { useTheme } from "@/hooks/useTheme";

interface SpotifyCodeProps extends React.HTMLAttributes<HTMLImageElement> {
  songUrl: string;
  imgWidth?: number;
  colorScheme?: 'print' | 'theme';
}

export function SpotifyCode({
  songUrl,
  imgWidth = 640,
  colorScheme = 'print',
  ...props
}: SpotifyCodeProps) {

  let backgroundColor = 'ffffff';
  let foregroundColor = 'black';

  const { theme, systemTheme } = useTheme();

  if (colorScheme === 'theme') {
    const codeTheme = theme === 'system' ? systemTheme : theme;
    if (codeTheme === 'dark') {
      backgroundColor = '020817';
      foregroundColor = 'white';
    } else {
      backgroundColor = 'ffffff';
      foregroundColor = 'black';
    }
  }

  const url = new URL(songUrl);
  const trackBits = url.pathname.split('track/');
  if (trackBits.length < 2) {
    return null;
  }

  const imgUrl = `https://scannables.scdn.co/uri/plain/svg/${backgroundColor}/${foregroundColor}/${imgWidth}/spotify:track:${trackBits[1]}`;

  return (
    <img src={imgUrl} {...props} />
  );
}
