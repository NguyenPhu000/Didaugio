import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CATEGORY_ICON,
  normalizeCategoryIcon,
} from "../categoryIcons.js";

test("normalizes legacy category icon names to canonical MDI names", () => {
  assert.equal(normalizeCategoryIcon("ShoppingBasket"), "basket-outline");
});

test("keeps supported MDI names and rejects unknown names", () => {
  assert.equal(normalizeCategoryIcon("temple-buddhist"), "temple-buddhist");
  assert.equal(normalizeCategoryIcon("not-an-icon"), null);
  assert.equal(DEFAULT_CATEGORY_ICON, "map-marker-outline");
});
