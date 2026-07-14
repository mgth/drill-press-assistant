<script lang="ts">
  import { MATERIALS, vcChipValues, vcMaterial } from "$lib/domain/materials";
  import { advisorState } from "$lib/state/advisor.svelte";
  import { fr } from "$lib/i18n/fr";

  const fmt = (v: number) => String(v).replace(".", ",");
  const vcValues = $derived(vcChipValues(advisorState.carbide));

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
      <select
        value={advisorState.custom ? "__custom__" : advisorState.materialId}
        onchange={(e) => {
          if (e.currentTarget.value !== "__custom__")
            advisorState.setMaterial(e.currentTarget.value);
        }}
      >
        {#if advisorState.custom}
          <option value="__custom__">{fr.advisor.custom}</option>
        {/if}
        {#each MATERIALS as mat}
          <option value={mat.id}>{mat.labelFr}</option>
        {/each}
      </select>
    </label>
    <div class="bit">
      <span class="bit-label">{fr.advisor.bitType}</span>
      <div class="seg" role="radiogroup" aria-label={fr.advisor.bitType}>
        <button
          type="button"
          role="radio"
          aria-checked={!advisorState.carbide && !advisorState.custom}
          class:active={!advisorState.carbide && !advisorState.custom}
          onclick={() => advisorState.setCarbide(false)}
        >
          {fr.advisor.hss}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={advisorState.carbide && !advisorState.custom}
          class:active={advisorState.carbide && !advisorState.custom}
          onclick={() => advisorState.setCarbide(true)}
        >
          {fr.advisor.carbide}
        </button>
      </div>
    </div>
    <div class="vc-block">
      <span class="bit-label">{fr.advisor.vc} (m/min)</span>
      <div class="quick" role="group" aria-label={fr.advisor.vc}>
        {#each vcValues as v}
          <button
            type="button"
            class="vc-chip"
            class:active={advisorState.vc === v}
            onclick={() => advisorState.setVc(v)}
          >
            <span>{fmt(v)}</span>
            <span class="abbr">{vcMaterial(v, advisorState.carbide)?.abbrFr ?? " "}</span>
          </button>
        {/each}
      </div>
    </div>
    <label class="dia">
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
    gap: 1rem;
    flex-wrap: wrap;
    align-items: end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-weight: 600;
    /* Matériau et Ø se partagent la même ligne, même sur mobile. */
    flex: 1 1 0;
    min-width: 0;
    max-width: 14rem;
  }

  label input,
  label select {
    font-weight: 400;
    width: 100%;
  }

  .quick {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.4rem;
    flex-basis: 100%;
    overflow-x: auto;
    padding-bottom: 0.3rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .quick button {
    flex: none;
    min-width: 48px;
    padding: 0.45rem 0;
    text-align: center;
    font-weight: 600;
  }

  .quick button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  .quick button.vc-chip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.1rem;
    line-height: 1.15;
    padding: 0.35rem 0.5rem;
    min-width: 56px;
  }

  .vc-chip .abbr {
    font-size: 0.68rem;
    font-weight: 400;
    color: var(--muted);
  }

  .vc-chip.active .abbr {
    color: #fff;
  }

  .bit,
  .vc-block {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .vc-block {
    flex-basis: 100%;
    min-width: 0;
  }


  .bit-label {
    font-weight: 600;
  }

  .seg {
    display: inline-flex;
    align-self: start;
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
    background: var(--card);
  }

  .seg button {
    border: none;
    border-radius: 0;
    min-height: 40px;
    min-width: 5.5rem;
    padding: 0.4rem 1.2rem;
    background: transparent;
    font-weight: 600;
    color: var(--muted);
  }

  .seg button.active {
    background: var(--accent);
    color: #fff;
  }

  .seg button:not(.active):hover {
    color: var(--fg);
  }

  .ideal {
    margin: 0.75rem 0 0;
  }
</style>
