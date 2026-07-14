<script lang="ts">
  import { machinesState } from "$lib/state/machines.svelte";
  import { fr } from "$lib/i18n/fr";

  function remove() {
    const current = machinesState.current;
    if (current && confirm(fr.machine.deleteConfirm)) machinesState.remove(current.id);
  }
</script>

<div class="picker">
  {#if machinesState.machines.length > 0}
    <label>
      {fr.machine.pickerLabel}
      <select
        value={machinesState.currentId}
        onchange={(e) => machinesState.select(e.currentTarget.value)}
      >
        {#each machinesState.machines as m}
          <option value={m.id}>{m.name}</option>
        {/each}
      </select>
    </label>
  {/if}
  <button type="button" onclick={() => machinesState.addTwoShaft()}>
    {fr.machine.newTwoShaft}
  </button>
  <button type="button" onclick={() => machinesState.addThreeShaft()}>
    {fr.machine.newThreeShaft}
  </button>
  {#if machinesState.current}
    <button type="button" onclick={remove}>{fr.machine.delete}</button>
  {/if}
</div>

<style>
  .picker {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-weight: 600;
  }

  select {
    min-width: 12rem;
  }
</style>
