interface SectionHeadingProps {
  index?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeading({ index, title, subtitle, action }: SectionHeadingProps) {
  return (
    <header className="mb-8 border-b-2 border-pink-400/60 pb-5 md:mb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {index && (
            <span className="block text-xs font-black tracking-[0.4em] text-pink-500">{index}</span>
          )}
          <h2 className="mt-2 bg-gradient-to-r from-purple-700 via-pink-600 to-indigo-700 bg-clip-text text-4xl font-black uppercase leading-[0.95] tracking-tight text-transparent sm:text-5xl lg:text-6xl">
            {title}
          </h2>
          {subtitle && <p className="mt-3 max-w-xl font-light text-purple-600">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
