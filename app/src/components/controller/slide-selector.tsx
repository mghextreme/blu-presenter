import { useController } from '@/hooks/useController';
import { ContentSelector } from './content-selector';
import { ISlide } from '@/types';

type SlideSelectorParams = {
  slide: ISlide;
  selected?: boolean;
  disabled?: boolean;
  scheduleItemIndex?: number;
  index: number;
};

export function SlideSelector({
  slide,
  selected = false,
  disabled = false,
  scheduleItemIndex,
  index,
}: Readonly<SlideSelectorParams>) {
  const { mode, selection, setSelection } = useController((s) => ({
    mode: s.mode,
    selection: s.selection,
    setSelection: s.setSelection,
  }));

  const isEmpty = (slide?.content?.length ?? 0) == 0;
  const isSelected = (mode == 'slide' || isEmpty) && selected;

  return (
    <div
      className={
        'flex flex-row align-stretch justify-stretch my-2 rounded' +
        (!disabled && (mode == 'slide' || isEmpty) ? ' cursor-pointer hover:bg-card' : '') +
        (isSelected ? ' bg-selected' : '')
      }
      onClick={
        !disabled && (mode == 'slide' || isEmpty)
          ? () =>
              setSelection({
                scheduleItem: scheduleItemIndex,
                slide: index,
                part: 0,
              })
          : undefined
      }
    >
      <div className={'flex-0 p-1 me-3 rounded min-h-8' + (isSelected ? '' : ' bg-card')}></div>
      <div className="flex-1">
        {slide?.content &&
          slide.content.map((c, ix) => (
            <ContentSelector
              key={`${mode}-${ix}`}
              content={c}
              scheduleItemIndex={scheduleItemIndex}
              slideIndex={index}
              contentIndex={ix}
              selected={selected && selection.part == ix}
              disabled={disabled}
            ></ContentSelector>
          ))}
      </div>
    </div>
  );
}
