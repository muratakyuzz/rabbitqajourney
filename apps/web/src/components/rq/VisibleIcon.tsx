import { Eye } from "lucide-react";

/** Kayıt müşteriye görünürse küçük göz ikonu. */
export function VisibleIcon({ visible }: { visible: boolean | undefined }) {
  if (!visible) return null;
  return <span title="Müşteriye görünür" aria-label="Müşteriye görünür" className="inline-flex align-middle ml-1 text-primary"><Eye className="h-3.5 w-3.5" /></span>;
}
