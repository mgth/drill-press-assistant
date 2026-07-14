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
  import Switch from "./Switch.svelte";

  let { machine }: { machine: Machine } = $props();

  const issues = $derived(validateMachine(machine));
  /** Cartes d'arbres dans le même ordre que le schéma (et que la machine réelle). */
  const shaftsDisplay = $derived(
    machine.spindleLeft ? [...machine.shafts].reverse() : machine.shafts,
  );
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
    <div class="check">
      <Switch
        checked={machine.spindleLeft ?? false}
        label={fr.machine.spindleLeft}
        onchange={(v) => (machine.spindleLeft = v)}
      />
    </div>
  </div>

  {#if issues.length > 0}
    <ul class="issues">
      {#each issues as issue}
        <li class={issue.level}>{issue.message}</li>
      {/each}
    </ul>
  {/if}

  <div class="shafts">
    {#each shaftsDisplay as shaft (shaft.id)}
      {@const s = machine.shafts.indexOf(shaft)}
      <div class="card">
        <h3>{shaft.label}</h3>
        {#if s > 0 && s < machine.shafts.length - 1}
          <div class="shared">
            <Switch
              checked={isSharedIntermediate(machine, s)}
              label={fr.machine.sharedCone}
              onchange={(v) => setSharedIntermediate(machine, s, v)}
            />
          </div>
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

  .check {
    align-self: end;
    padding-bottom: 0.6rem;
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

  .shared {
    margin-bottom: 0.6rem;
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
