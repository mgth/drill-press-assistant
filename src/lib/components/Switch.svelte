<script lang="ts">
  let {
    checked,
    label,
    onchange,
  }: { checked: boolean; label: string; onchange: (value: boolean) => void } = $props();
</script>

<label class="switch">
  <input
    type="checkbox"
    role="switch"
    {checked}
    onchange={(e) => onchange(e.currentTarget.checked)}
  />
  <span class="track"><span class="thumb"></span></span>
  <span class="text">{label}</span>
</label>

<style>
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    flex: none;
    width: 40px;
    height: 22px;
    border-radius: 999px;
    background: var(--border);
    transition: background 0.15s;
    position: relative;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--card);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    transition: transform 0.15s;
  }

  input:checked + .track {
    background: var(--accent);
  }

  input:checked + .track .thumb {
    transform: translateX(18px);
    background: #fff;
  }

  input:focus-visible + .track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
