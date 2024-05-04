import { useEffect, useState } from "react";
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
    setSlideIndex,
  } = useController();

  const [isSelected, setSelected] = useState<boolean>(false);
  const [isEmpty, setEmpty] = useState<boolean>(false);

  useEffect(() => {
    setEmpty((slide?.parts?.length ?? 0) == 0);
  }, [slide]);

  useEffect(() => {
    setSelected((mode == 'slide' || isEmpty) && selected);
  }, [isEmpty, selected, mode]);

  return (
    <div className={"flex flex-row align-stretch justify-stretch my-2 rounded" + (mode == 'slide' || isEmpty ? ' cursor-pointer hover:bg-card' : '') + (isSelected ? ' bg-selected' : '')} onClick={mode == 'slide' || isEmpty ? () => setSlideIndex(index) : undefined}>
      <div className={"flex-0 p-1 me-3 rounded min-h-8" + (isSelected ? '' : ' bg-card')}></div>
      <div className="flex-1">
        {slide?.parts && slide.parts.map((p, ix) => (
          <PartSelector key={`${mode}-${ix}`} part={p} slideIndex={index} partIndex={ix} selected={selected && partIndex == ix}></PartSelector>
        ))}
      </div>
    </div>
  )
}
