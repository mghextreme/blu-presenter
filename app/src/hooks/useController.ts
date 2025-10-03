import { useContext } from "react";
import { ControllerProviderContext } from "./controller.provider";

export const useController = () => {
  const context = useContext(ControllerProviderContext)

  if (context === undefined)
    throw new Error("useController must be used within a ControllerProvider")

  return context
}

