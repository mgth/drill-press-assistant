<script lang="ts">
  import {
    isSharedIntermediate,
    setSharedIntermediate,
    syncBeltPairs,
    validateMachine,
    type Machine,
  } from "$lib/domain/machine";
  import { fr } from "$lib/i18n/fr";
  import BeltPairsEditor from "./BeltPairsEditor.svelte";
  import StackEditor from "./StackEditor.svelte";

  let { machine }: { machine: Machine } = $props();

  const issues = $derived(validateMachine(machine));
</script>

<div class="editor">
  <div class="card general">
    <label>
      {fr.machine.name}
      <input type="text" bind:value={machine.name} />
    </label>
    <label>
      {fr.machine.motorRpm}
      <input type="number" inputmode="numeric" min="1" step="10" bind:value={machine.motorRpm} />
    </label>
    <label class="check">
      <input type="checkbox" bind:checked={machine.spindleLeft} />
      {fr.machine.spindleLeft}
    </label>
  </div>

  {#if issues.length > 0}
    <ul class="issues">
      {#each issues as issue}
        <li class={issue.level}>{issue.message}</li>
      {/each}
    </ul>
  {/if}

  <div class="shafts">
    {#each machine.shafts as shaft, s}
      <div class="card">
        <h3>{shaft.label}</h3>
        {#if s > 0 && s < machine.shafts.length - 1}
          <label class="shared">
            <input
              type="checkbox"
              checked={isSharedIntermediate(machine, s)}
              onchange={(e) => setSharedIntermediate(machine, s, e.currentTarget.checked)}
            />
            {fr.machine.sharedCone}
          </label>
        {/if}
        {#each shaft.stacks as stack}
          <StackEditor {stack} onStepsChanged={() => syncBeltPairs(machine)} />
        {/each}
      </div>
    {/each}
  </div>

  {#each machine.belts as belt, i}
    <BeltPairsEditor {machine} {belt} index={i} />
  {/each}
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .general {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-weight: 600;
  }

  label input {
    font-weight: 400;
    max-width: 14rem;
  }

  label.check {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    font-weight: 400;
    align-self: end;
  }

  label.check input {
    min-height: auto;
  }

  .shafts {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .shafts .card {
    flex: 1 1 16rem;
  }

  .shafts h3 {
    font-size: 1rem;
  }

  label.shared {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    font-weight: 400;
    margin-bottom: 0.6rem;
  }

  label.shared input {
    min-height: auto;
  }

  .issues {
    margin: 0;
    padding: 0.75rem 1rem 0.75rem 2rem;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
  }

  .issues .error {
    color: var(--error);
  }

  .issues .warning {
    color: var(--warning);
  }
</style>
