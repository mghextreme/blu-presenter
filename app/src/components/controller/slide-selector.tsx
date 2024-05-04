import { useController } from "./controller-provider";
import PartSelector from "./part-selector";
import { ISlide } from "@/types";

type SlideSelectorParams = {
  slide: ISlide
  selected: boolean
  index: number
}

export default function SlideSelector({
  slide,
  selected,
  index,
}: SlideSelectorParams) {
  const {
    mode,
    partIndex,
  } = useController();

  return (
    <div className={"flex flex-row align-stretch justify-stretch my-2 rounded" + ((mode == 'slide' || (slide?.parts?.length ?? 0) == 0) && selected ? ' bg-card' : '')}>
      <div className="flex-0 p-1 me-3 bg-card rounded min-h-8"></div>
      <div className="flex-1">
        {slide?.parts && slide.parts.map((p, ix) => (
          <PartSelector key={ix} part={p} slideIndex={index} partIndex={ix} selected={selected && partIndex == ix}></PartSelector>
        ))}
      </div>
    </div>
  )
}
