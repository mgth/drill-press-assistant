<script lang="ts">
  import type { PulleyStack } from "$lib/domain/machine";
  import { i18n } from "$lib/i18n/state.svelte";

  let {
    stack,
    onStepsChanged,
  }: { stack: PulleyStack; onStepsChanged: () => void } = $props();

  function addStep() {
    stack.steps.push(stack.steps[stack.steps.length - 1] ?? 60);
    onStepsChanged();
  }

  function removeStep(i: number) {
    stack.steps.splice(i, 1);
    onStepsChanged();
  }
</script>

<div class="stack">
  <div class="stack-label">{stack.label}</div>
  <ol>
    {#each stack.steps as _, i}
      <li>
        <span class="muted">{i18n.t.machine.step} {i + 1}</span>
        <input
          type="number"
          inputmode="decimal"
          min="1"
          step="0.5"
          bind:value={stack.steps[i]}
          aria-label="{stack.label} — {i18n.t.machine.stepDiameter}"
        />
        <span class="muted">mm</span>
        <button
          type="button"
          onclick={() => removeStep(i)}
          disabled={stack.steps.length <= 1}
          title={i18n.t.machine.removeStep}>✕</button
        >
      </li>
    {/each}
  </ol>
  <button type="button" onclick={addStep}>{i18n.t.machine.addStep}</button>
</div>

<style>
  .stack-label {
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  ol {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  li input {
    width: 6.5rem;
  }

  li button {
    min-height: 36px;
    padding: 0.2rem 0.55rem;
  }
</style>
