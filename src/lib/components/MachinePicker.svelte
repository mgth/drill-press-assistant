<script lang="ts">
  import { machinesState } from "$lib/state/machines.svelte";
  import { i18n } from "$lib/i18n/state.svelte";

  function remove() {
    const current = machinesState.current;
    if (current && confirm(i18n.t.machine.deleteConfirm)) machinesState.remove(current.id);
  }
</script>

<div class="picker">
  {#if machinesState.machines.length > 0}
    <label>
      {i18n.t.machine.pickerLabel}
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
    {i18n.t.machine.newTwoShaft}
  </button>
  <button type="button" onclick={() => machinesState.addThreeShaft()}>
    {i18n.t.machine.newThreeShaft}
  </button>
  {#if machinesState.current}
    <button type="button" onclick={remove}>{i18n.t.machine.delete}</button>
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
