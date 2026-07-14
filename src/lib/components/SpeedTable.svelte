<script lang="ts">
  import type { Combination } from "$lib/domain/calc";
  import type { Machine } from "$lib/domain/machine";
  import { comboKey } from "$lib/state/advisor.svelte";
  import { fr } from "$lib/i18n/fr";

  let {
    machine,
    combinations,
    recommendedKey,
    selectedKey,
    onSelect,
  }: {
    machine: Machine;
    combinations: Combination[];
    recommendedKey: string | null;
    selectedKey: string;
    onSelect: (combo: Combination) => void;
  } = $props();

  function pairLabel(combo: Combination, k: number): string {
    const belt = machine.belts[k];
    const [i, j] = combo.pairs[k];
    const dFrom = machine.shafts[belt.fromShaft].stacks[belt.fromStack].steps[i];
    const dTo = machine.shafts[belt.toShaft].stacks[belt.toStack].steps[j];
    return `Ét. ${i + 1} (${dFrom} mm) → Ét. ${j + 1} (${dTo} mm)`;
  }
</script>

<div class="card">
  <h2>{fr.table.title}</h2>
  <table>
    <thead>
      <tr>
        {#each machine.belts as _, k}
          <th>{fr.table.position} {k + 1}</th>
        {/each}
        <th class="num">{fr.table.spindleRpm}</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each combinations as combo}
        {@const key = comboKey(combo.pairs)}
        <tr
          class:recommended={key === recommendedKey}
          class:selected={key === selectedKey}
          onclick={() => onSelect(combo)}
        >
          {#each machine.belts as _, k}
            <td>{pairLabel(combo, k)}</td>
          {/each}
          <td class="num"><strong>{Math.round(combo.spindleRpm)}</strong></td>
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
