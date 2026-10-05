export function AdSlot() {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";

  return (
    <aside className="ad-slot" aria-label="Advertisement" data-enabled={enabled || undefined}>
      <span>{enabled ? "Advertisement" : "Ad inventory reserved · disabled"}</span>
      <i aria-hidden="true" />
    </aside>
  );
}
