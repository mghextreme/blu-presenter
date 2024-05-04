import { useController } from "./controller-provider";
import { ISlide } from "@/types";

type SlideSelectorParams = {
  part: string
  selected: boolean
  slideIndex: number
  partIndex: number
}

export default function PartSelector({
  part,
  selected,
  slideIndex,
  partIndex,
}: SlideSelectorParams) {
  const {
    mode,
  } = useController();

  return (
    <div className={"flex flex-row align-stretch justify-stretch my-2 rounded" + (mode == 'part' && selected ? ' bg-card' : '')}>
      <div className="flex-0 p-1 me-3 bg-card rounded min-h-8"></div>
      <div className="flex-1 py-1 whitespace-pre-wrap rounded">
        {part}
      </div>
    </div>
  )
}
