import { IScheduleItem, ISlide, ISlideTextContent } from '@/types'

export const createMockSlide = (id: string, text: string): ISlide => ({
  id,
  content: [
    {
      type: 'lyrics',
      text,
    } as ISlideTextContent,
  ],
})

export const createMockScheduleItem = (
  id: number,
  title: string,
  slideCount: number = 3
): IScheduleItem => ({
  id,
  title,
  type: 'song',
  slides: Array.from({ length: slideCount }, (_, i) =>
    createMockSlide(`slide-${id}-${i}`, `Slide ${i + 1} content for ${title}`)
  ),
})

export const mockScheduleItems: IScheduleItem[] = [
  createMockScheduleItem(1, 'Amazing Grace', 4),
  createMockScheduleItem(2, 'How Great Thou Art', 3),
  createMockScheduleItem(3, 'Blessed Assurance', 5),
]
