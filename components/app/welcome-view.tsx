interface WelcomeViewProps {
  onStartCall: () => void;
}

export const WelcomeView = ({
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      <button
        type="button"
        onClick={onStartCall}
        aria-label="Start call"
        className="focus-visible:outline-primary pointer-events-auto absolute top-1/2 left-1/2 flex size-[min(22vw,280px)] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-8"
      >
        <img
          src="/arc_reactor.png"
          alt="Start call"
          width={1672}
          height={941}
          className="block h-[85%] w-[85%] scale-[4] object-contain"
        />
      </button>
    </div>
  );
};
