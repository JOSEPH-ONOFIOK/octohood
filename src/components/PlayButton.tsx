import Link from "next/link";

// The main call to action: playing the arcade is how you get on the list.
export function PlayButton({ className = "", children = "Play to join" }: { className?: string; children?: React.ReactNode }) {
  return (
    <Link href="/play" className={`btn btn-play ${className}`}>
      <span className="play-icon grid h-5 w-5 place-items-center rounded-full bg-cream">
        <svg viewBox="0 0 10 10" className="ml-px h-2.5 w-2.5" aria-hidden>
          <path d="M2 1.2 L8.6 5 L2 8.8 Z" fill="#17130f" />
        </svg>
      </span>
      {children}
    </Link>
  );
}
