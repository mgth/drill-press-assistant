<script lang="ts">
  import { shaftRpms } from "$lib/domain/calc";
  import type { Machine } from "$lib/domain/machine";

  let {
    machine,
    pairs,
  }: { machine: Machine; pairs: Array<[number, number]> } = $props();

  // Géométrie (px) : vue de côté, arbres verticaux, moteur à gauche.
  const PX_PER_MM = 1.1;
  const STEP_H = 16;
  const STEP_GAP = 3;
  const STACK_GAP = 28;
  const SHAFT_GAP = 46;
  const MARGIN_X = 14;
  const TOP = 30;

  const layout = $derived.by(() => {
    const maxRadius = machine.shafts.map(
      (shaft) =>
        (Math.max(...shaft.stacks.flatMap((st) => st.steps), 0) / 2) * PX_PER_MM,
    );

    // Position x de l'axe de chaque arbre.
    const shaftX: number[] = [];
    machine.shafts.forEach((_, s) => {
      shaftX.push(
        s === 0
          ? MARGIN_X + maxRadius[0]
          : shaftX[s - 1] + maxRadius[s - 1] + maxRadius[s] + SHAFT_GAP,
      );
    });

    // Rangée de chaque cône = indice de la première courroie qui l'utilise,
    // pour que les deux cônes reliés par une courroie soient à la même hauteur.
    const stackRow = machine.shafts.map((shaft) => shaft.stacks.map(() => Infinity));
    machine.belts.forEach((belt, k) => {
      stackRow[belt.fromShaft][belt.fromStack] = Math.min(stackRow[belt.fromShaft][belt.fromStack], k);
      stackRow[belt.toShaft][belt.toStack] = Math.min(stackRow[belt.toShaft][belt.toStack], k);
    });

    const rowCount = Math.max(1, ...stackRow.flat().filter(Number.isFinite).map((r) => r + 1));
    const rowHeight = Array.from({ length: rowCount }, (_, r) =>
      Math.max(
        0,
        ...machine.shafts.flatMap((shaft, s) =>
          shaft.stacks
            .filter((_, st) => (Number.isFinite(stackRow[s][st]) ? stackRow[s][st] : 0) === r)
            .map((stack) => stack.steps.length * (STEP_H + STEP_GAP)),
        ),
      ),
    );
    const rowY: number[] = [];
    rowHeight.forEach((_, r) => {
      rowY.push(r === 0 ? TOP : rowY[r - 1] + rowHeight[r - 1] + STACK_GAP);
    });

    // Position y du haut de chaque cône.
    const stackY = machine.shafts.map((shaft, s) =>
      shaft.stacks.map((_, st) =>
        rowY[Number.isFinite(stackRow[s][st]) ? stackRow[s][st] : 0],
      ),
    );

    const stepMidY = (s: number, st: number, i: number) =>
      stackY[s][st] + i * (STEP_H + STEP_GAP) + STEP_H / 2;

    const bottom = Math.max(
      ...machine.shafts.flatMap((shaft, s) =>
        shaft.stacks.map(
          (stack, st) => stackY[s][st] + stack.steps.length * (STEP_H + STEP_GAP),
        ),
      ),
    );

    const belts = machine.belts.map((belt, k) => {
      const [i, j] = pairs[k] ?? belt.allowedPairs[0];
      const dFrom = machine.shafts[belt.fromShaft].stacks[belt.fromStack].steps[i];
      const dTo = machine.shafts[belt.toShaft].stacks[belt.toStack].steps[j];
      return {
        x1: shaftX[belt.fromShaft] + (dFrom / 2) * PX_PER_MM,
        y1: stepMidY(belt.fromShaft, belt.fromStack, i),
        x2: shaftX[belt.toShaft] - (dTo / 2) * PX_PER_MM,
        y2: stepMidY(belt.toShaft, belt.toStack, j),
      };
    });

    const isSelected = (s: number, st: number, i: number) =>
      machine.belts.some((belt, k) => {
        const [pi, pj] = pairs[k] ?? belt.allowedPairs[0];
        return (
          (belt.fromShaft === s && belt.fromStack === st && pi === i) ||
          (belt.toShaft === s && belt.toStack === st && pj === i)
        );
      });

    const rpms = pairs.length === machine.belts.length ? shaftRpms(machine, pairs) : [];

    return {
      shaftX,
      stackY,
      belts,
      isSelected,
      rpms,
      width: shaftX[shaftX.length - 1] + maxRadius[maxRadius.length - 1] + MARGIN_X,
      height: bottom + 34,
    };
  });
</script>

<svg
  viewBox="0 0 {layout.width} {layout.height}"
  role="img"
  aria-label="Schéma des poulies et position des courroies"
>
  {#each machine.shafts as shaft, s}
    <!-- Axe de l'arbre -->
    <line
      x1={layout.shaftX[s]}
      y1={TOP - 8}
      x2={layout.shaftX[s]}
      y2={layout.height - 30}
      class="axis"
    />
    <text x={layout.shaftX[s]} y={TOP - 14} class="shaft-label">{shaft.label}</text>
    {#if layout.rpms[s] !== undefined}
      <text x={layout.shaftX[s]} y={layout.height - 12} class="rpm-label">
        {Math.round(layout.rpms[s])} tr/min
      </text>
    {/if}

    {#each shaft.stacks as stack, st}
      {#each stack.steps as d, i}
        {@const w = d * PX_PER_MM}
        {@const y = layout.stackY[s][st] + i * (STEP_H + STEP_GAP)}
        <rect
          x={layout.shaftX[s] - w / 2}
          {y}
          width={w}
          height={STEP_H}
          rx="2"
          class="step"
          class:selected={layout.isSelected(s, st, i)}
        />
        <text x={layout.shaftX[s]} y={y + STEP_H / 2} class="dia-label">{d}</text>
      {/each}
    {/each}
  {/each}

  {#each layout.belts as b}
    <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} class="belt" />
  {/each}
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .axis {
    stroke: var(--muted);
    stroke-width: 1.5;
    stroke-dasharray: 5 4;
  }

  .step {
    fill: color-mix(in srgb, var(--muted) 35%, var(--card));
    stroke: var(--muted);
    stroke-width: 1;
  }

  .step.selected {
    fill: var(--accent);
    stroke: var(--accent);
  }

  .belt {
    stroke: var(--accent);
    stroke-width: 5;
    stroke-linecap: round;
  }

  text {
    fill: var(--fg);
    text-anchor: middle;
    font-size: 11px;
  }

  .shaft-label {
    font-weight: 600;
    font-size: 12px;
  }

  .rpm-label {
    font-weight: 600;
    fill: var(--accent);
  }

  .dia-label {
    font-size: 9px;
    dominant-baseline: central;
    pointer-events: none;
  }
</style>
