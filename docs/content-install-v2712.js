import { TEMPLATES } from "./core-v260a1.js";
import { ALL_GOAL_TEMPLATES } from "./content-v2712.js";

TEMPLATES.splice(0, TEMPLATES.length, ...ALL_GOAL_TEMPLATES);
document.documentElement.dataset.contentVersion = "v27.1.2-stage2";
