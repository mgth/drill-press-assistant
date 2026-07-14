<script lang="ts">
  import { shaftRpms } from "$lib/domain/calc";
  import { pairName, type Machine } from "$lib/domain/machine";
  import { i18n } from "$lib/i18n/state.svelte";

  let {
    machine,
    pairs,
    pairIndexes,
    mini = false,
  }: {
    machine: Machine;
    pairs: Array<[number, number]>;
    /** Indices dans allowedPairs, pour afficher le repère de chaque position. */
    pairIndexes?: number[];
    /** Version compacte pour la table : ni étiquettes ni cotes, juste les repères de courroie. */
    mini?: boolean;
  } = $props();

  // Géométrie (px) : vue de côté, arbres verticaux, moteur à gauche.
  const G = $derived(
    mini
      ? { px: 0.32, stepH: 5, stepGap: 1.5, stackGap: 9, shaftGap: 18, marginX: 4, top: 13, bottomPad: 4, labelDy: 4 }
      : { px: 1.1, stepH: 16, stepGap: 3, stackGap: 28, shaftGap: 46, marginX: 14, top: 30, bottomPad: 34, labelDy: 7 },
  );

  const layout = $derived.by(() => {
    const maxRadius = machine.shafts.map(
      (shaft) =>
        (Math.max(...shaft.stacks.flatMap((st) => st.steps), 0) / 2) * G.px,
    );

    // Position x de l'axe de chaque arbre, moteur → broche de gauche à droite.
    const shaftX: number[] = [];
    machine.shafts.forEach((_, s) => {
      shaftX.push(
        s === 0
          ? G.marginX + maxRadius[0]
          : shaftX[s - 1] + maxRadius[s - 1] + maxRadius[s] + G.shaftGap,
      );
    });
    const width = shaftX[shaftX.length - 1] + maxRadius[maxRadius.length - 1] + G.marginX;
    // Miroir optionnel : broche à gauche, comme l'utilisateur voit sa machine.
    if (machine.spindleLeft) {
      for (let s = 0; s < shaftX.length; s++) shaftX[s] = width - shaftX[s];
    }

    // Rangée verticale de chaque cône : les deux cônes reliés par une
    // courroie sont à la même hauteur (un cône partagé aligne donc les trois
    // arbres), et les cônes d'un même arbre s'empilent.
    const stackRow = machine.shafts.map((shaft) => shaft.stacks.map((_, st) => st));
    machine.belts.forEach((belt) => {
      const base = stackRow[belt.fromShaft][belt.fromStack];
      stackRow[belt.toShaft] = machine.shafts[belt.toShaft].stacks.map(
        (_, st) => base + (st - belt.toStack),
      );
    });
    const minRow = Math.min(...stackRow.flat());
    const rowCount = Math.max(...stackRow.flat()) - minRow + 1;

    const rowHeight = Array.from({ length: rowCount }, (_, r) =>
      Math.max(
        0,
        ...machine.shafts.flatMap((shaft, s) =>
          shaft.stacks
            .filter((_, st) => stackRow[s][st] - minRow === r)
            .map((stack) => stack.steps.length * (G.stepH + G.stepGap)),
        ),
      ),
    );
    const rowY: number[] = [];
    rowHeight.forEach((_, r) => {
      rowY.push(r === 0 ? G.top : rowY[r - 1] + rowHeight[r - 1] + G.stackGap);
    });

    // Position y du haut de chaque cône.
    const stackY = machine.shafts.map((shaft, s) =>
      shaft.stacks.map((_, st) => rowY[stackRow[s][st] - minRow]),
    );

    const stepMidY = (s: number, st: number, i: number) =>
      stackY[s][st] + i * (G.stepH + G.stepGap) + G.stepH / 2;

    const bottom = Math.max(
      ...machine.shafts.flatMap((shaft, s) =>
        shaft.stacks.map(
          (stack, st) => stackY[s][st] + stack.steps.length * (G.stepH + G.stepGap),
        ),
      ),
    );

    const belts = machine.belts.map((belt, k) => {
      const [i, j] = pairs[k] ?? belt.allowedPairs[0];
      const dFrom = machine.shafts[belt.fromShaft].stacks[belt.fromStack].steps[i];
      const dTo = machine.shafts[belt.toShaft].stacks[belt.toStack].steps[j];
      // La courroie part du bord tourné vers l'arbre suivant, quel que soit le sens d'affichage.
      const dir = shaftX[belt.fromShaft] <= shaftX[belt.toShaft] ? 1 : -1;
      return {
        x1: shaftX[belt.fromShaft] + dir * ((dFrom / 2) * G.px),
        y1: stepMidY(belt.fromShaft, belt.fromStack, i),
        x2: shaftX[belt.toShaft] - dir * ((dTo / 2) * G.px),
        y2: stepMidY(belt.toShaft, belt.toStack, j),
        label: pairIndexes ? pairName(belt, pairIndexes[k]) : null,
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
      width,
      height: bottom + G.bottomPad,
    };
  });
</script>

<svg
  viewBox="0 0 {layout.width} {layout.height}"
  role="img"
  aria-label={i18n.t.schematic.aria}
  class:mini
>
  {#each machine.shafts as shaft, s}
    <!-- Axe de l'arbre -->
    <line
      x1={layout.shaftX[s]}
      y1={G.top - (mini ? 3 : 8)}
      x2={layout.shaftX[s]}
      y2={layout.height - (mini ? 2 : 30)}
      class="axis"
    />
    {#if !mini}
      <text x={layout.shaftX[s]} y={G.top - 14} class="shaft-label">{shaft.label}</text>
      {#if layout.rpms[s] !== undefined}
        <text x={layout.shaftX[s]} y={layout.height - 12} class="rpm-label">
          {Math.round(layout.rpms[s])} {i18n.t.advisor.rpm}
        </text>
      {/if}
    {/if}

    {#each shaft.stacks as stack, st}
      {#each stack.steps as d, i}
        {@const w = d * G.px}
        {@const y = layout.stackY[s][st] + i * (G.stepH + G.stepGap)}
        <rect
          x={layout.shaftX[s] - w / 2}
          {y}
          width={w}
          height={G.stepH}
          rx={mini ? 1 : 2}
          class="step"
          class:selected={layout.isSelected(s, st, i)}
        />
        {#if !mini}
          <text x={layout.shaftX[s]} y={y + G.stepH / 2} class="dia-label">
            {i18n.formatLen(d)}
          </text>
        {/if}
      {/each}
    {/each}
  {/each}

  {#each layout.belts as b}
    <line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} class="belt" />
    {#if b.label}
      <text x={(b.x1 + b.x2) / 2} y={Math.min(b.y1, b.y2) - G.labelDy} class="belt-label">
        {b.label}
      </text>
    {/if}
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

  .belt-label {
    font-size: 13px;
    font-weight: 700;
    fill: var(--accent);
  }

  svg.mini .axis {
    stroke-width: 0.75;
    stroke-dasharray: 2 2;
  }

  svg.mini .step {
    stroke-width: 0.5;
  }

  svg.mini .belt {
    stroke-width: 2;
  }

  svg.mini .belt-label {
    font-size: 9px;
  }
</style>
