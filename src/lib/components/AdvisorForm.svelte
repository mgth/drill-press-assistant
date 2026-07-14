<script lang="ts">
  import { MATERIALS, vcChipValues, vcMaterial } from "$lib/domain/materials";
  import { IMPERIAL_DRILLS } from "$lib/domain/units";
  import { advisorState } from "$lib/state/advisor.svelte";
  import { i18n } from "$lib/i18n/state.svelte";

  const fmt = (v: number) => i18n.formatVc(v);
  const vcValues = $derived(vcChipValues(advisorState.carbide, i18n.imperial));

  /** Jetons de diamètre : millimètres entiers, ou forets fractionnaires en impérial. */
  const diaChips = $derived(
    i18n.imperial
      ? IMPERIAL_DRILLS
      : Array.from({ length: 20 }, (_, i) => ({ label: String(i + 1), mm: i + 1 })),
  );
  const diaActive = (mm: number) => Math.abs(advisorState.diameterMm - mm) < 0.01;

  let vcRow = $state<HTMLElement>();
  let diaRow = $state<HTMLElement>();

  /** Centre le jeton actif dans sa frise pour qu'il reste visible. */
  function revealActive(row: HTMLElement | undefined) {
    const active = row?.querySelector<HTMLElement>("button.active");
    if (!row || !active) return;
    row.scrollTo({
      left: active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2,
      behavior: "smooth",
    });
  }

  $effect(() => {
    void advisorState.vc;
    void advisorState.carbide; // la liste des jetons change aussi
    void i18n.units; // la grille change en impérial
    revealActive(vcRow);
  });

  $effect(() => {
    void advisorState.diameterMm;
    void i18n.units;
    revealActive(diaRow);
  });

  const ideal = $derived(
    advisorState.diameterMm > 0 && advisorState.vc > 0
      ? (advisorState.vc * 1000) / (Math.PI * advisorState.diameterMm)
      : null,
  );
</script>

<div class="card form">
  <h2>{i18n.t.advisor.title}</h2>
  <div class="fields">
    <label>
      {i18n.t.advisor.material}
      <select
        value={advisorState.custom ? "__custom__" : advisorState.materialId}
        onchange={(e) => {
          if (e.currentTarget.value !== "__custom__")
            advisorState.setMaterial(e.currentTarget.value);
        }}
      >
        {#if advisorState.custom}
          <option value="__custom__">{i18n.t.advisor.custom}</option>
        {/if}
        {#each MATERIALS as mat}
          <option value={mat.id}>{i18n.materialLabel(mat)}</option>
        {/each}
      </select>
    </label>
    <div class="bit">
      <span class="bit-label">{i18n.t.advisor.bitType}</span>
      <div class="seg" role="radiogroup" aria-label={i18n.t.advisor.bitType}>
        <button
          type="button"
          role="radio"
          aria-checked={!advisorState.carbide && !advisorState.custom}
          class:active={!advisorState.carbide && !advisorState.custom}
          onclick={() => advisorState.setCarbide(false)}
        >
          {i18n.t.advisor.hss}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={advisorState.carbide && !advisorState.custom}
          class:active={advisorState.carbide && !advisorState.custom}
          onclick={() => advisorState.setCarbide(true)}
        >
          {i18n.t.advisor.carbide}
        </button>
      </div>
    </div>
    <div class="vc-block">
      <span class="bit-label">{i18n.t.advisor.vc} ({i18n.vcUnit})</span>
      <div class="quick" role="group" aria-label={i18n.t.advisor.vc} bind:this={vcRow}>
        {#each vcValues as v}
          {@const mat = vcMaterial(v, advisorState.carbide)}
          <button
            type="button"
            class="vc-chip"
            class:active={advisorState.vc === v}
            onclick={() => advisorState.setVc(v)}
          >
            <span>{fmt(v)}</span>
            <span class="abbr">{mat ? i18n.materialAbbr(mat) : " "}</span>
          </button>
        {/each}
      </div>
    </div>
    <label class="dia">
      {i18n.t.advisor.diameter} ({i18n.lenUnit})
      <input
        type="number"
        inputmode="decimal"
        min={i18n.imperial ? 0.02 : 0.5}
        step={i18n.imperial ? 0.0625 : 0.5}
        value={i18n.displayLen(advisorState.diameterMm)}
        oninput={(e) => {
          const v = parseFloat(e.currentTarget.value);
          if (v > 0) advisorState.diameterMm = i18n.parseLen(v);
        }}
      />
    </label>
    <div class="quick" role="group" aria-label={i18n.t.advisor.diameter} bind:this={diaRow}>
      {#each diaChips as chip}
        <button
          type="button"
          class:active={diaActive(chip.mm)}
          onclick={() => (advisorState.diameterMm = chip.mm)}
        >
          {chip.label}
        </button>
      {/each}
    </div>
  </div>
  {#if ideal !== null}
    <p class="ideal">
      {i18n.t.advisor.vc} : <strong>{i18n.formatVc(advisorState.vc)} {i18n.vcUnit}</strong> —
      {i18n.t.advisor.idealRpm} : <strong>{Math.round(ideal)} {i18n.t.advisor.rpm}</strong>
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
