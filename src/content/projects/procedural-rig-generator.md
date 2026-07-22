---
title: Procedural Rig Generator
slug: procedural-rig-generator
cover: /uploads/procedural-rig-generator.svg
model: /models/sample-mesh.glb
clickEffect: converge
techStack:
  - Python
  - Maya API
  - PySide6
description: A PySide6 tool that auto-generates biped and quadruped control rigs
  from a tagged joint hierarchy in minutes instead of days.
order: 1
---

## The Problem

Riggers were spending 2-3 days per character building near-identical control rigs by hand — FK/IK
chains, space switching, and ribbon spine setups that follow the same pattern every time. The goal
was to compress that to under 15 minutes without losing the ability to hand-tune anything afterward.

## Approach

The tool walks a joint hierarchy tagged with lightweight naming conventions and metadata, then builds
controls, constraints, and space switches from a set of composable rig "modules" (spine, limb, hand,
tail). Every module is a plain Python class so TDs can add new limb types without touching the UI layer.

```python
class LimbModule(RigModule):
    def build(self, joints: list[str], side: str) -> None:
        fk_ctrls = self._build_fk_chain(joints, side)
        ik_ctrls = self._build_ik_chain(joints, side)
        self._add_space_switch(fk_ctrls[0], ik_ctrls[0], parents=["cog", "world"])
        self.publish_controls(fk_ctrls + ik_ctrls)
```

## Result

Rig build time dropped from days to minutes across two productions, and the module system now covers
bipeds, quadrupeds, and simple prop rigs with shared spine/space-switching logic.
