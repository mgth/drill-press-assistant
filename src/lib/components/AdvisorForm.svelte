<script lang="ts">
  import { MATERIALS } from "$lib/domain/materials";
  import { advisorState } from "$lib/state/advisor.svelte";
  import { fr } from "$lib/i18n/fr";

  const ideal = $derived(
    advisorState.diameterMm > 0 && advisorState.vc > 0
      ? (advisorState.vc * 1000) / (Math.PI * advisorState.diameterMm)
      : null,
  );
</script>

<div class="card form">
  <h2>{fr.advisor.title}</h2>
  <div class="fields">
    <label>
      {fr.advisor.material}
      <select bind:value={advisorState.materialId}>
        {#each MATERIALS as mat}
          <option value={mat.id}>{mat.labelFr}</option>
        {/each}
      </select>
    </label>
    <label>
      {fr.advisor.diameter}
      <input
        type="number"
        inputmode="decimal"
        min="0.5"
        step="0.5"
        bind:value={advisorState.diameterMm}
      />
    </label>
    <div class="quick" role="group" aria-label={fr.advisor.diameter}>
      {#each Array.from({ length: 20 }, (_, i) => i + 1) as d}
        <button
          type="button"
          class:active={advisorState.diameterMm === d}
          onclick={() => (advisorState.diameterMm = d)}
        >
          {d}
        </button>
      {/each}
    </div>
    <fieldset>
      <legend>{fr.advisor.bitType}</legend>
      <label class="radio">
        <input type="radio" name="bit" value={false} bind:group={advisorState.carbide} />
        {fr.advisor.hss}
      </label>
      <label class="radio">
        <input type="radio" name="bit" value={true} bind:group={advisorState.carbide} />
        {fr.advisor.carbide}
      </label>
    </fieldset>
  </div>
  {#if ideal !== null}
    <p class="ideal">
      {fr.advisor.vc} : <strong>{advisorState.vc} m/min</strong> —
      {fr.advisor.idealRpm} : <strong>{Math.round(ideal)} {fr.advisor.rpm}</strong>
    </p>
  {/if}
</div>

<style>
  h2 {
    font-size: 1.1rem;
  }

  .fields {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    align-items: end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-weight: 600;
  }

  label input,
  label select {
    font-weight: 400;
    max-width: 12rem;
  }

  .quick {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    flex-basis: 100%;
  }

  .quick button {
    min-width: 44px;
    padding: 0.45rem 0;
    text-align: center;
    font-weight: 600;
  }

  .quick button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1rem;
  }

  legend {
    font-weight: 600;
    padding: 0 0 0.3rem;
  }

  .radio {
    flex-direction: row;
    align-items: center;
    gap: 0.4rem;
    font-weight: 400;
  }

  .radio input {
    min-height: auto;
  }

  .ideal {
    margin: 0.75rem 0 0;
  }
</style>
