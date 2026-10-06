import { CredentialsSection } from "../Phase2Tabs";
import type { WorkspaceProps } from "./index";

/** 03 Kurulum paneli: Kurulum özeti (salt gösterim, S6) + Erişim bilgileri. */
export function AccessWorkspace({ project }: WorkspaceProps) {
  return <CredentialsSection project={project} layout="panel" />;
}
