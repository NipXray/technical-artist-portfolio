---
title: "Creature VFX: Storm Wisp"
slug: "storm-wisp"
cover: "/uploads/storm-wisp.svg"
clickEffect: "wind"
ambientEffect: "dust"
techStack: ["Houdini", "Niagara", "VFX"]
description: "A wind elemental creature built entirely from curl-noise simulation, with a Niagara runtime version for in-game use."
order: 6
---

## The Brief

A creature that reads as "made of wind" rather than a character wearing a wind effect — its silhouette
needed to be legible while still feeling like a fluid, living simulation.

## Approach

Prototyped the core curl-noise flow field in Houdini to nail the motion language, then rebuilt the
effect as a lightweight Niagara system so it could run at 60fps alongside a dozen other creatures on
screen at once.

```cpp
// simplified curl-noise velocity field driving the wisp's core flow
vector noise_grad = volumegradient(0, "density", @P);
vector curl = cross(noise_grad, set(0, 1, 0));
v@vel = normalize(curl) * chf("flow_speed");
```

## Result

The Houdini prototype and the shipped Niagara version share the same underlying flow-field logic, so
tuning one informs the other directly.
