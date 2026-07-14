<script lang="ts">
  import { diameterRanges, formatDeviation, recommend } from "$lib/domain/advisor";
  import type { Combination } from "$lib/domain/calc";
  import { pairName, validateMachine, type Machine } from "$lib/domain/machine";
  import { advisorState, comboKey } from "$lib/state/advisor.svelte";
  import { machinesState } from "$lib/state/machines.svelte";
  import AdvisorForm from "$lib/components/AdvisorForm.svelte";
  import MachineEditor from "$lib/components/MachineEditor.svelte";
  import MachinePicker from "$lib/components/MachinePicker.svelte";
  import PulleySchematic from "$lib/components/PulleySchematic.svelte";
  import SpeedTable from "$lib/components/SpeedTable.svelte";
  import { getBackend, type PersistedState, type StorageBackend } from "$lib/storage/storage";
  import { i18n, LOCALES, type LocaleId } from "$lib/i18n/state.svelte";

  let tab = $state<"machine" | "drilling">("machine");
  let backend = $state<StorageBackend | null>(null);

  $effect(() => {
    getBackend().then(async (b) => {
      const saved = await b.load();
      if (saved) {
        machinesState.load(saved.machines, saved.currentMachineId);
        advisorState.load(saved.lastAdvisor);
        if (saved.locale) i18n.locale = saved.locale;
      }
      if (machinesState.machines.length === 0) machinesState.addTwoShaft();
      backend = b;
    });
  });

  // Sauvegarde débouncée de tout l'état persistant (uniquement après hydratation).
  $effect(() => {
    if (!backend) return;
    const snapshot: PersistedState = {
      version: 1,
      machines: $state.snapshot(machinesState.machines),
      currentMachineId: machinesState.currentId,
      lastAdvisor: {
        materialId: advisorState.materialId,
        diameterMm: advisorState.diameterMm,
        carbide: advisorState.carbide,
        vcOverride: advisorState.vcOverride,
      },
      locale: i18n.locale,
    };
    const timer = setTimeout(() => backend?.save(snapshot), 500);
    return () => clearTimeout(timer);
  });

  const machine = $derived(machinesState.current);
  const machineValid = $derived(
    machine !== null && validateMachine(machine).every((i) => i.level !== "error"),
  );
  const reco = $derived(
    machine && machineValid && advisorState.diameterMm > 0 && advisorState.vc > 0
      ? recommend(machine, advisorState.vc, advisorState.diameterMm)
      : null,
  );
  const recommendedKey = $derived(reco ? comboKey(reco.best.pairs) : null);

  // Tout changement de paramètres de perçage ou de machine invalide la
  // sélection manuelle : la carte « Position recommandée » suit à nouveau la
  // recommandation, comme la table.
  $effect(() => {
    void advisorState.materialId;
    void advisorState.diameterMm;
    void advisorState.carbide;
    void advisorState.vcOverride;
    void machinesState.currentId;
    advisorState.selectedKey = null;
  });

  /**
   * Position en repères machine, ex. « B » (une courroie) ou « 3 – B »
   * (deux), dans l'ordre d'affichage du schéma (inversé si broche à gauche).
   */
  function positionLabel(m: Machine, combo: Combination): string {
    const names = m.belts.map((belt, k) => pairName(belt, combo.pairIndexes[k]));
    if (m.spindleLeft) names.reverse();
    return names.join(" – ");
  }
  /** Combinaison affichée : sélection manuelle si encore valable, sinon la recommandation. */
  const displayed = $derived.by(() => {
    if (!reco) return null;
    const manual = reco.all.find((c) => comboKey(c.pairs) === advisorState.selectedKey);
    return manual ?? reco.best;
  });
</script>

<main>
  <header>
    <h1>{i18n.t.appTitle}</h1>
    <nav>
      <button type="button" class:active={tab === "machine"} onclick={() => (tab = "machine")}>
        {i18n.t.tabs.machine}
      </button>
      <button type="button" class:active={tab === "drilling"} onclick={() => (tab = "drilling")}>
        {i18n.t.tabs.drilling}
      </button>
      <select
        class="lang"
        aria-label="Langue / Language"
        value={i18n.locale}
        onchange={(e) => (i18n.locale = e.currentTarget.value as LocaleId)}
      >
        {#each LOCALES as l}
          <option value={l.id}>{l.label}</option>
        {/each}
      </select>
    </nav>
  </header>

  {#if !backend}
    <!-- hydratation en cours -->
  {:else if tab === "machine"}
    <MachinePicker />
    {#if machine}
      <MachineEditor {machine} />
    {:else}
      <p class="muted">{i18n.t.machine.noMachine}</p>
    {/if}
  {:else}
    <AdvisorForm />
    {#if !machine || !machineValid}
      <p class="warning card">{i18n.t.advisor.invalidMachine}</p>
    {:else if reco && displayed}
      {#if reco.overspeed}
        <p class="warning card">{i18n.t.advisor.overspeedWarning}</p>
      {/if}
      <div class="result card">
        <h2>{i18n.t.advisor.recommended}</h2>
        <p>
          <span class="position">{positionLabel(machine, displayed)}</span>
          —
          <strong>{Math.round(displayed.spindleRpm)} {i18n.t.advisor.rpm}</strong>
          <span class="dev">{formatDeviation(displayed.spindleRpm, reco.ideal)}</span>
          <span class="muted">
            ({i18n.t.advisor.idealRpm} : {Math.round(reco.ideal)} {i18n.t.advisor.rpm})
          </span>
        </p>
        <PulleySchematic {machine} pairs={displayed.pairs} pairIndexes={displayed.pairIndexes} />
      </div>
      <SpeedTable
        {machine}
        combinations={reco.all}
        ideal={reco.ideal}
        ranges={diameterRanges(reco.all, advisorState.vc)}
        {recommendedKey}
        selectedKey={comboKey(displayed.pairs)}
        onSelect={(c) => (advisorState.selectedKey = comboKey(c.pairs))}
      />
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.35rem;
    margin: 0;
  }

  nav {
    display: flex;
    gap: 0.5rem;
  }

  nav button.active {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }

  select.lang {
    min-height: 0;
    padding: 0.45rem 0.5rem;
  }

  .warning {
    color: var(--warning);
    margin: 0;
    font-weight: 600;
  }

  .result h2 {
    font-size: 1.1rem;
  }

  .result p {
    margin: 0 0 0.75rem;
    font-size: 1.15rem;
  }

  .position {
    font-weight: 700;
    color: var(--accent);
  }

  .dev {
    font-size: 0.95rem;
    color: var(--muted);
    font-weight: 600;
  }
</style>
