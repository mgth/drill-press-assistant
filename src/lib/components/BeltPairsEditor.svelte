<script lang="ts">
  import { defaultPairs, stepName, type Belt, type Machine } from "$lib/domain/machine";
  import { fr } from "$lib/i18n/fr";

  let { machine, belt, index }: { machine: Machine; belt: Belt; index: number } = $props();

  const fromStack = $derived(machine.shafts[belt.fromShaft].stacks[belt.fromStack]);
  const toStack = $derived(machine.shafts[belt.toShaft].stacks[belt.toStack]);

  function addPair() {
    belt.allowedPairs.push([0, 0]);
  }

  function removePair(i: number) {
    belt.allowedPairs.splice(i, 1);
  }

  function reset() {
    belt.allowedPairs = defaultPairs(fromStack, toStack);
  }
</script>

<div class="belt card">
  <h3>
    {fr.machine.belt}
    {index + 1}
    <span class="muted">({fromStack.label} → {toStack.label})</span>
  </h3>
  <div class="muted">{fr.machine.beltPairs} — {fr.machine.beltPairHint}</div>
  <ul>
    {#each belt.allowedPairs as pair, i}
      <li>
        <select bind:value={pair[0]} aria-label="étage menant">
          {#each fromStack.steps as d, s}
            <option value={s}>{stepName(fromStack, s)} ({d} mm)</option>
          {/each}
        </select>
        →
        <select bind:value={pair[1]} aria-label="étage mené">
          {#each toStack.steps as d, s}
            <option value={s}>{stepName(toStack, s)} ({d} mm)</option>
          {/each}
        </select>
        <button
          type="button"
          onclick={() => removePair(i)}
          disabled={belt.allowedPairs.length <= 1}
          title={fr.machine.removeStep}>✕</button
        >
      </li>
    {/each}
  </ul>
  <div class="actions">
    <button type="button" onclick={addPair}>{fr.machine.addPair}</button>
    {#if fromStack.steps.length === toStack.steps.length}
      <button type="button" onclick={reset}>{fr.machine.resetPairs}</button>
    {/if}
  </div>
</div>

<style>
  ul {
    list-style: none;
    margin: 0.5rem 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  li button {
    min-height: 36px;
    padding: 0.2rem 0.55rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  h3 {
    font-size: 1rem;
  }
</style>
