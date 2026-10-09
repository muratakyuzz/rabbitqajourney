import { MeetingStepSection } from "./MeetingStepSection";
import { DiscoveryContent } from "../DiscoveryContent";
import type { WorkspaceProps } from "./index";

/** 02 Keşif paneli: Keşif toplantısı + DiscoveryContent (tek sütun). */
export function DiscoveryWorkspace({ project, readOnly }: WorkspaceProps) {
  return (
    <div className="space-y-6">
      <MeetingStepSection project={project} stepKey="discovery" type="discovery" title="Keşif toplantısı" readOnly={readOnly} />
      <div className="border-t pt-4">
        <DiscoveryContent project={project} readOnly={readOnly} layout="panel" />
      </div>
    </div>
  );
}
