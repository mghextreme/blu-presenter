import ISlide from "@/types/slide.interface";

export default function SlideVisualizer({ content, fontSize = '8vh' }: { content: ISlide, fontSize?: string }) {
  return (
    <div className={'w-full h-full leading-[1.15em] p-[.5em] flex flex-col items-stretch justify-center bg-black text-white text-center'} style={{fontSize: fontSize}}>
      {content.title && <div className="mb-[.5em]">
        <h1 className="text-[1.25em]">{content.title}</h1>
        {content.subtitle && <h2 className="text-[.75em]">{content.subtitle}</h2>}
      </div>}
      {content.text && <div className="text-[1em] whitespace-pre-wrap">
        {content.text}
      </div>}
    </div>
  );
}
