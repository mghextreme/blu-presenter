import { useContext } from "react";
import { ServicesContext } from "./services.provider";

export const useServices = () => {
  const context = useContext(ServicesContext)

  if (context === undefined)
    throw new Error("useBroadcast must be used within a BroadcastProvider")

  return context
}

