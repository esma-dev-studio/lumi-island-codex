import { AbstractMesh, TransformNode, Vector3 } from "@babylonjs/core";
import type { ResourceId, ResourceState } from "@/src/game/types";

interface MeshBaseline {
  scaling: Vector3;
  rotation: Vector3;
  visibility: number;
}

export class ResourceVisualController {
  private readonly baselines = new Map<AbstractMesh, MeshBaseline>();

  constructor(
    private readonly node: TransformNode,
    private readonly item: ResourceId,
  ) {
    node.getChildMeshes().forEach((mesh) => {
      this.baselines.set(mesh, {
        rotation: mesh.rotation.clone(),
        scaling: mesh.scaling.clone(),
        visibility: mesh.visibility,
      });
    });
  }

  apply(state: ResourceState | undefined): void {
    const stage = state?.visualStage ?? 0;
    const available = !state || state.state === "available";
    this.node.setEnabled(
      available || (this.item !== "shell" && this.item !== "fish"),
    );
    this.node.metadata = {
      ...(this.node.metadata ?? {}),
      resourceState: state?.state ?? "available",
      visualStage: stage,
    };
    this.baselines.forEach((baseline, mesh) => {
      mesh.rotation.copyFrom(baseline.rotation);
      mesh.scaling.copyFrom(baseline.scaling);
      mesh.visibility = baseline.visibility;
      mesh.setEnabled(true);

      if (available) return;
      const recovering = state?.state === "recovering";
      const amount = recovering ? 0.82 : 0.58;
      if (this.item === "wood") {
        if (mesh.name.includes("crown")) {
          mesh.scaling.scaleInPlace(amount);
          mesh.visibility = recovering ? 0.82 : 0.62;
        }
      } else if (this.item === "stone") {
        mesh.scaling.y *= recovering ? 0.9 : 0.72;
        mesh.rotation.z =
          (mesh.name.charCodeAt(mesh.name.length - 1) % 2 ? 1 : -1) *
          (recovering ? 0.035 : 0.085);
        mesh.visibility = recovering ? 0.9 : 0.72;
      } else if (this.item === "berry") {
        if (mesh.name.includes("berry-")) mesh.setEnabled(false);
        else mesh.scaling.scaleInPlace(recovering ? 0.86 : 0.68);
      } else {
        mesh.scaling.y *= amount;
        mesh.visibility = recovering ? 0.85 : 0.64;
      }
    });
  }

  dispose(): void {
    this.baselines.clear();
  }
}
