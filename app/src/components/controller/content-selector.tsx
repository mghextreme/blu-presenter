import { ISlideContent, ISlideTextContent, ISlideTitleContent } from "@/types";
import { useController } from "./controller-provider";

type ContentSelectorParams = {
  content: ISlideContent
  selected: boolean
  slideIndex: number
  contentIndex: number
}

export default function ContentSelector({
  content,
  selected = false,
  slideIndex,
  contentIndex,
}: ContentSelectorParams) {
  const {
    mode,
    setPartIndex,
  } = useController();

  const getTitleContent = (content: ISlideTitleContent) => {
    let result = content.title;
    if (content.subtitle) {
      result += "\n" + content.subtitle
    }
    return result;
  }

  const getTextContent = (content: ISlideTextContent) => {
    return content.text
  }

  return (
    <div className={"flex flex-row align-stretch justify-stretch my-2 rounded" + (mode == 'part' ? ' cursor-pointer hover:bg-card' : '') + (mode == 'part' && selected ? ' bg-selected' : '')} onClick={mode == 'part' ? () => setPartIndex(slideIndex, contentIndex) : undefined}>
      {mode == 'part' ? (
        <div className={"flex-0 p-1 me-3 rounded min-h-8" + (selected ? '' : ' bg-card')}></div>
      ) : undefined}
      <div className="flex-1 py-1 whitespace-pre-wrap rounded">
        {content.type == "title" ? getTitleContent(content as ISlideTitleContent) : undefined}
        {content.type == "lyrics" ? getTextContent(content as ISlideTextContent) : undefined}
      </div>
    </div>
  )
}
