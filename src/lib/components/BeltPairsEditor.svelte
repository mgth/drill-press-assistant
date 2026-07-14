<script lang="ts">
  import {
    defaultPairNames,
    defaultPairs,
    ensurePairNames,
    type Belt,
    type Machine,
  } from "$lib/domain/machine";
  import { i18n } from "$lib/i18n/state.svelte";

  let { machine, belt, index }: { machine: Machine; belt: Belt; index: number } = $props();

  const fromStack = $derived(machine.shafts[belt.fromShaft].stacks[belt.fromStack]);
  const toStack = $derived(machine.shafts[belt.toShaft].stacks[belt.toStack]);

  // Aligne les repères sur les positions (machines d'avant les repères,
  // ou paires retirées par syncBeltPairs).
  $effect(() => {
    if (belt.pairNames?.length !== belt.allowedPairs.length) ensurePairNames(machine);
  });

  function addPair() {
    belt.allowedPairs.push([0, 0]);
    belt.pairNames?.push(defaultPairNames(index, belt.allowedPairs.length).pop()!);
  }

  function removePair(i: number) {
    belt.allowedPairs.splice(i, 1);
    belt.pairNames?.splice(i, 1);
  }

  function reset() {
    belt.allowedPairs = defaultPairs(fromStack, toStack);
    belt.pairNames = defaultPairNames(index, belt.allowedPairs.length);
  }
</script>

<div class="belt card">
  <h3>
    {i18n.t.machine.belt}
    {index + 1}
    <span class="muted">({fromStack.label} → {toStack.label})</span>
  </h3>
  <div class="muted">{i18n.t.machine.beltPairs} — {i18n.t.machine.beltPairHint}</div>
  <ul>
    {#each belt.allowedPairs as pair, i}
      <li>
        <input
          class="name"
          type="text"
          bind:value={belt.pairNames![i]}
          aria-label={i18n.t.machine.pairName}
          title={i18n.t.machine.pairName}
        />
        <select bind:value={pair[0]} aria-label={i18n.t.machine.drivingStep}>
          {#each fromStack.steps as d, s}
            <option value={s}>{i18n.t.machine.stepShort} {s + 1} · {i18n.formatLen(d)} {i18n.lenUnit}</option>
          {/each}
        </select>
        <span class="arrow">→</span>
        <select bind:value={pair[1]} aria-label={i18n.t.machine.drivenStep}>
          {#each toStack.steps as d, s}
            <option value={s}>{i18n.t.machine.stepShort} {s + 1} · {i18n.formatLen(d)} {i18n.lenUnit}</option>
          {/each}
        </select>
        <button
          type="button"
          onclick={() => removePair(i)}
          disabled={belt.allowedPairs.length <= 1}
          title={i18n.t.machine.removeStep}>✕</button
        >
      </li>
    {/each}
  </ul>
  <div class="actions">
    <button type="button" onclick={addPair}>{i18n.t.machine.addPair}</button>
    {#if fromStack.steps.length === toStack.steps.length}
      <button type="button" onclick={reset}>{i18n.t.machine.resetPairs}</button>
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
    gap: 0.4rem;
    flex-wrap: nowrap;
  }

  li input.name {
    flex: none;
    width: 3rem;
    text-align: center;
    font-weight: 600;
  }

  li select {
    flex: 1 1 0;
    min-width: 0;
  }

  li .arrow {
    flex: none;
  }

  li button {
    flex: none;
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
