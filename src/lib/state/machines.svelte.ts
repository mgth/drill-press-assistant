import {
  createThreeShaftMachine,
  createTwoShaftMachine,
  ensureStepNames,
  type Machine,
} from "$lib/domain/machine";

class MachinesState {
  machines = $state<Machine[]>([]);
  currentId = $state<string | null>(null);

  get current(): Machine | null {
    return this.machines.find((m) => m.id === this.currentId) ?? null;
  }

  addTwoShaft(): Machine {
    const m = createTwoShaftMachine();
    this.machines.push(m);
    this.currentId = m.id;
    return m;
  }

  addThreeShaft(): Machine {
    const m = createThreeShaftMachine();
    this.machines.push(m);
    this.currentId = m.id;
    return m;
  }

  remove(id: string): void {
    this.machines = this.machines.filter((m) => m.id !== id);
    if (this.currentId === id) this.currentId = this.machines[0]?.id ?? null;
  }

  select(id: string): void {
    this.currentId = id;
  }

  /** Hydratation depuis la persistance (M4). */
  load(machines: Machine[], currentId: string | null): void {
    for (const m of machines)
      for (const shaft of m.shafts) shaft.stacks.forEach(ensureStepNames);
    this.machines = machines;
    this.currentId =
      currentId && machines.some((m) => m.id === currentId)
        ? currentId
        : (machines[0]?.id ?? null);
  }
}

export const machinesState = new MachinesState();
