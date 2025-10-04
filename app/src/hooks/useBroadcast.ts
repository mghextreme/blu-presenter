import { useContext } from "react";
import { BroadcastProviderContext } from "./broadcast.provider";

export const useBroadcast = () => {
  const context = useContext(BroadcastProviderContext)

  if (context === undefined)
    throw new Error("useBroadcast must be used within a BroadcastProvider")

  return context
}

