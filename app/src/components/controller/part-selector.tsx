import { useController } from "./controller-provider";

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
    setPartIndex,
  } = useController();

  return (
    <div className={"flex flex-row align-stretch justify-stretch my-2 rounded" + (mode == 'part' ? ' cursor-pointer hover:bg-card' : '') + (mode == 'part' && selected ? ' bg-selected' : '')} onClick={mode == 'part' ? () => setPartIndex(slideIndex, partIndex) : undefined}>
      {mode == 'part' ? (
        <div className={"flex-0 p-1 me-3 rounded min-h-8" + (selected ? '' : ' bg-card')}></div>
      ) : undefined}
      <div className="flex-1 py-1 whitespace-pre-wrap rounded">
        {part}
      </div>
    </div>
  )
}
