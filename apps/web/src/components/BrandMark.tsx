export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-fg">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-[12px] bg-primary-accent text-lg text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2)]"
      >
        P
      </span>
      <span>
        Pro<span className="text-primary">.</span>gress
      </span>
    </span>
  );
}
