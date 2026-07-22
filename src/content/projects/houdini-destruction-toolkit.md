---
title: Houdini Destruction Toolkit
slug: houdini-destruction-toolkit
cover: /uploads/houdini-destruction-toolkit.svg
clickEffect: explosion
techStack:
  - Houdini
  - VEX
  - PDG
description: A set of HDAs for fracturing, wiring simulation constraints, and
  baking destruction caches through a PDG batch pipeline.
order: 2
---

## The Problem

Environment artists needed art-directable destruction (buildings, props, terrain chunks) without every
shot requiring a dedicated FX pass. The toolkit needed to be simple enough for generalists to drive, but
flexible enough for FX artists to override any stage.

## Approach

Fracturing, constraint wiring, and simulation are split into independent HDAs connected through PDG, so
a single click can batch-fracture and simulate dozens of variants overnight on the farm.

```cpp
// VEX (Houdini's C-like shading language)
// constraint strength falloff based on distance from an impact point
float dist = distance(@P, chv("impact_point"));
float falloff = fit(dist, 0, chf("radius"), 1, 0);
f@strength = chf("base_strength") * falloff;
```

## Result

Cut destruction turnaround from a multi-day FX request to a same-day self-serve pass for generalists,
reserving dedicated FX time for hero shots only.
