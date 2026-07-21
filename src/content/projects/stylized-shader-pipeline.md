---
title: "Stylized Shader Pipeline"
slug: "stylized-shader-pipeline"
cover: "/uploads/stylized-shader-pipeline.svg"
techStack: ["Unity", "HLSL", "Shader Graph"]
description: "A layered toon-shading pipeline with rim light, custom shadow banding, and an in-editor debug view for lighting artists."
order: 3
---

## The Problem

The art direction called for a hand-painted, banded toon look that still had to read correctly under
Unity's standard lighting pipeline, across dozens of environments with wildly different lighting setups.

## Approach

A custom lit shader handles banded diffuse falloff and rim lighting in HLSL, exposed to artists through a
thin Shader Graph wrapper so they can tune band thresholds without touching code.

```hlsl
float NdotL = dot(normalWS, lightDir);
float band = floor(saturate(NdotL) * _BandCount) / _BandCount;
float3 toonDiffuse = lerp(_ShadowColor.rgb, _LitColor.rgb, band);
```

## Result

Lighting artists could iterate on the toon look directly in-editor, and the shader shipped across the
full game with a single shared core plus per-biome parameter presets.
