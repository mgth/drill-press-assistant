<script lang="ts">
  import { formatDeviation, type DiameterRange } from "$lib/domain/advisor";
  import type { Combination } from "$lib/domain/calc";
  import type { Machine } from "$lib/domain/machine";
  import { comboKey } from "$lib/state/advisor.svelte";
  import { fr } from "$lib/i18n/fr";
  import PulleySchematic from "./PulleySchematic.svelte";

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

</script>

<div class="card">
  <h2>{fr.table.title}</h2>
  <table>
    <thead>
      <tr>
        <th>{fr.table.position}</th>
        <th class="num">{fr.table.spindleRpm}</th>
        <th class="num">{fr.table.deviation}</th>
        <th class="num">{fr.table.diaRange}</th>
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
          <td class="pos">
            <PulleySchematic {machine} pairs={combo.pairs} pairIndexes={combo.pairIndexes} mini />
          </td>
          <td class="num"><strong>{Math.round(combo.spindleRpm)}</strong></td>
          <td class="num muted">{formatDeviation(combo.spindleRpm, ideal)}</td>
          <td class="num muted range">
            <div>{rangeLabel(ranges[idx])}</div>
            {#if key === recommendedKey}
              <span class="badge rec">{fr.table.recommendedBadge}</span>
            {:else if key === selectedKey}
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

  .pos {
    width: 150px;
    min-width: 120px;
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
