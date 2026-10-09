/** [data-field] öğesini bulur, kısa süreliğine vurgular ve içindeki ilk etkin alana odaklanır. */
export function highlightField(root: ParentNode, field: string, ms = 2000): boolean {
  const el = root.querySelector(`[data-field="${field}"]`);
  if (!el) return false;
  el.scrollIntoView?.({ block: "center", behavior: "smooth" });
  const ringClasses = ["ring-2", "ring-primary", "ring-offset-2", "rounded-md"];
  el.classList.add(...ringClasses);
  setTimeout(() => el.classList.remove(...ringClasses), ms);
  const focusable = el.querySelector<HTMLElement>(
    'input:not(:disabled):not([data-disabled]), textarea:not(:disabled):not([data-disabled]), button:not(:disabled):not([data-disabled]), [role="radio"]:not(:disabled):not([data-disabled]), [role="checkbox"]:not(:disabled):not([data-disabled]), [role="combobox"]:not(:disabled):not([data-disabled])',
  );
  focusable?.focus();
  return true;
}
