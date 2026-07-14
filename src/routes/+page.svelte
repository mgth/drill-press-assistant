<script lang="ts">
  import { recommend } from "$lib/domain/advisor";
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
  import { fr } from "$lib/i18n/fr";

  let tab = $state<"machine" | "drilling">("machine");
  let backend = $state<StorageBackend | null>(null);

  $effect(() => {
    getBackend().then(async (b) => {
      const saved = await b.load();
      if (saved) {
        machinesState.load(saved.machines, saved.currentMachineId);
        advisorState.load(saved.lastAdvisor);
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
      },
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

  /** Position en repères machine, ex. « B » (une courroie) ou « 3 – B » (deux). */
  function positionLabel(m: Machine, combo: Combination): string {
    return m.belts.map((belt, k) => pairName(belt, combo.pairIndexes[k])).join(" – ");
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
    <h1>{fr.appTitle}</h1>
    <nav>
      <button type="button" class:active={tab === "machine"} onclick={() => (tab = "machine")}>
        {fr.tabs.machine}
      </button>
      <button type="button" class:active={tab === "drilling"} onclick={() => (tab = "drilling")}>
        {fr.tabs.drilling}
      </button>
    </nav>
  </header>

  {#if !backend}
    <!-- hydratation en cours -->
  {:else if tab === "machine"}
    <MachinePicker />
    {#if machine}
      <MachineEditor {machine} />
    {:else}
      <p class="muted">{fr.machine.noMachine}</p>
    {/if}
  {:else}
    <AdvisorForm />
    {#if !machine || !machineValid}
      <p class="warning card">{fr.advisor.invalidMachine}</p>
    {:else if reco && displayed}
      {#if reco.overspeed}
        <p class="warning card">{fr.advisor.overspeedWarning}</p>
      {/if}
      <div class="result card">
        <h2>{fr.advisor.recommended}</h2>
        <p>
          <span class="position">{positionLabel(machine, displayed)}</span>
          —
          <strong>{Math.round(displayed.spindleRpm)} {fr.advisor.rpm}</strong>
          <span class="muted">
            ({fr.advisor.idealRpm} : {Math.round(reco.ideal)} {fr.advisor.rpm})
          </span>
        </p>
        <PulleySchematic {machine} pairs={displayed.pairs} pairIndexes={displayed.pairIndexes} />
      </div>
      <SpeedTable
        {machine}
        combinations={reco.all}
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
</style>
