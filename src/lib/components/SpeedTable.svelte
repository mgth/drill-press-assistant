<script lang="ts">
  import { formatDeviation, type DiameterRange } from "$lib/domain/advisor";
  import type { Combination } from "$lib/domain/calc";
  import { pairName, type Machine } from "$lib/domain/machine";
  import { comboKey } from "$lib/state/advisor.svelte";
  import { fr } from "$lib/i18n/fr";

  let {
    machine,
    combinations,
    ideal,
    ranges,
    recommendedKey,
    selectedKey,
    onSelect,
  }: {
    machine: Machine;
    combinations: Combination[];
    /** Vitesse idéale (tr/min) pour la colonne d'écart. */
    ideal: number;
    /** Plage de Ø recommandée par combinaison, alignée sur combinations. */
    ranges: Array<DiameterRange | null>;
    recommendedKey: string | null;
    selectedKey: string;
    onSelect: (combo: Combination) => void;
  } = $props();

  function rangeLabel(r: DiameterRange | null): string {
    if (!r) return "—";
    const f = (d: number) => (d >= 10 ? d.toFixed(1) : d.toFixed(2)).replace(".", ",");
    if (r.min === null && r.max === null) return fr.table.allDiameters;
    if (r.max === null) return `≥ ${f(r.min!)}`;
    if (r.min === null) return `≤ ${f(r.max)}`;
    return `${f(r.min)} – ${f(r.max)}`;
  }

  function pairLabel(combo: Combination, k: number): string {
    const belt = machine.belts[k];
    const [i, j] = combo.pairs[k];
    const from = machine.shafts[belt.fromShaft].stacks[belt.fromStack];
    const to = machine.shafts[belt.toShaft].stacks[belt.toStack];
    return `${pairName(belt, combo.pairIndexes[k])} (${from.steps[i]} → ${to.steps[j]} mm)`;
  }

  /** Colonnes dans l'ordre d'affichage du schéma (inversé si broche à gauche). */
  const beltOrder = $derived(
    machine.belts.map((_, k) => (machine.spindleLeft ? machine.belts.length - 1 - k : k)),
  );
</script>

<div class="card">
  <h2>{fr.table.title}</h2>
  <table>
    <thead>
      <tr>
        {#each beltOrder as k}
          <th>{fr.table.position} {k + 1}</th>
        {/each}
        <th class="num">{fr.table.spindleRpm}</th>
        <th class="num">{fr.table.deviation}</th>
        <th class="num">{fr.table.diaRange}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each combinations as combo, idx}
        {@const key = comboKey(combo.pairs)}
        <tr
          class:recommended={key === recommendedKey}
          class:selected={key === selectedKey}
          onclick={() => onSelect(combo)}
        >
          {#each beltOrder as k}
            <td>{pairLabel(combo, k)}</td>
          {/each}
          <td class="num"><strong>{Math.round(combo.spindleRpm)}</strong></td>
          <td class="num muted">{formatDeviation(combo.spindleRpm, ideal)}</td>
          <td class="num muted range">{rangeLabel(ranges[idx])}</td>
          <td class="badges">
            {#if key === recommendedKey}
              <span class="badge rec">{fr.table.recommendedBadge}</span>
            {/if}
            {#if key === selectedKey && key !== recommendedKey}
              <span class="badge sel">{fr.table.selectedBadge}</span>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  h2 {
    font-size: 1.1rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    text-align: left;
    padding: 0.5rem 0.6rem;
    border-bottom: 1px solid var(--border);
  }

  .num {
    text-align: right;
  }

  tbody tr {
    cursor: pointer;
  }

  tbody tr:hover {
    background: color-mix(in srgb, var(--accent-soft) 50%, transparent);
  }

  tr.recommended {
    background: var(--accent-soft);
  }

  tr.selected:not(.recommended) {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    white-space: nowrap;
  }

  .badge.rec {
    background: var(--accent);
    color: #fff;
  }

  .badge.sel {
    border: 1px solid var(--accent);
    color: var(--accent);
  }
</style>
