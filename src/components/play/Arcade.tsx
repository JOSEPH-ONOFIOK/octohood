"use client";

import { gameAllowance, usePlay } from "@/lib/play/store";
import { Inventory } from "./Inventory";
import { PoolCatch } from "./PoolCatch";
import { SocialTasks } from "./SocialTasks";

export function Arcade() {
  const state = usePlay();

  if (!state) {
    return <div className="h-[36rem] animate-pulse rounded-[2rem] bg-navy/90" />;
  }

  return (
    <>
      <Inventory state={state} />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.55fr_1fr]">
        <section aria-label="Pool Catch">
          <PoolCatch allowance={gameAllowance(state)} best={state.best} />
        </section>
        <section aria-label="Social tasks">
          <SocialTasks claimed={state.claimed} />
        </section>
      </div>
    </>
  );
}
