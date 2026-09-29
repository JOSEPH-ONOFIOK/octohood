"use client";

import { useEffect, useState } from "react";

// Types a word, waits, deletes it, moves on. Lazily, of course.
export function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(words[0].length);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const word = words[i];
    let delay = deleting ? 45 : 95;
    if (!deleting && n === word.length) delay = 2200;
    if (deleting && n === 0) delay = 300;
    const id = setTimeout(() => {
      if (!deleting && n === word.length) setDeleting(true);
      else if (deleting && n === 0) {
        setDeleting(false);
        setI((i + 1) % words.length);
      } else setN(n + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [i, n, deleting, words]);

  return (
    <span>
      <span className="sr-only">{words[0]}</span>
      <span aria-hidden>
        {words[i].slice(0, n)}
        <i className="caret" />
      </span>
    </span>
  );
}
