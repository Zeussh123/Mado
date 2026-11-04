// Ruptures de stock par ingrédient.
// La liste "soldout" (KV) contient des ids de plats et des ingrédients préfixés "ing:" (ex. "ing:boeuf").
// Un ingrédient épuisé rend indisponibles toutes les options qui l'utilisent (bœuf → « Kebab bœuf » et
// « Kebab mixte » dans le kebab, le tacos, le bowl…), les plats qui le contiennent (champ "uses" du plat),
// et un plat dont toutes les options d'un choix unique (ex. la viande) sont épuisées.

const MEAT_GROUPS = new Set(["viande", "viande-tacos", "bowl"]);
const SKIP_GROUPS = new Set(["supplement"]);
const MIX = { mixte: ["boeuf", "poulet"] };
export const ING_NAMES = {
  boeuf: "Viande kebab bœuf", poulet: "Viande kebab poulet", escalope: "Escalope de poulet", tenders: "Tenders",
  nuggets: "Nuggets", kofte: "Köfte", sucuk: "Sucuk", falafel: "Falafel", chicken: "Chicken (bowl)",
};
const SECTIONS = { viande: "Viandes", "viande-tacos": "Viandes", bowl: "Viandes", accompagnement: "Accompagnements", crudites: "Crudités", sauces: "Sauces", "sauce-frites": "Sauces", boisson: "Boissons" };
const ORDER = ["Viandes", "Accompagnements", "Crudités", "Sauces", "Boissons"];

function choiceIngs(g, c) {
  if (c.all || SKIP_GROUPS.has(g.id)) return [];
  if (MEAT_GROUPS.has(g.id)) {
    const base = String(c.icon || c.id).replace(/^bowl-/, "").replace(/^[tb]-/, "");
    return MIX[base] || [base];
  }
  return [String(c.icon || c.id)];
}

export function stockState(menu, soldList) {
  const ings = new Map();
  const add = (id, name, section) => { if (!ings.has(id)) ings.set(id, { id, name: ING_NAMES[id] || name, section }); return ings.get(id); };
  const byChoice = new Map();
  for (const g of menu.optionGroups || []) for (const c of g.choices || []) {
    if (c.hidden) continue;
    const list = choiceIngs(g, c);
    for (const i of list) add(i, (c.name && c.name.fr) || i, SECTIONS[g.id] || (g.name && g.name.fr) || "Autres");
    byChoice.set(c.id, list);
  }
  for (const cat of menu.categories || []) for (const it of cat.items || []) for (const u of it.uses || []) add(u, u, "Viandes");

  const sold = new Set(soldList || []);
  const outIng = new Set([...sold].filter((x) => x.startsWith("ing:")).map((x) => x.slice(4)));
  const outChoices = [...byChoice].filter(([, l]) => l.some((i) => outIng.has(i))).map(([id]) => id);
  const oc = new Set(outChoices);
  const outItems = [];
  for (const cat of menu.categories || []) for (const it of cat.items || []) {
    let out = sold.has(it.id) || (it.uses || []).some((u) => outIng.has(u));
    if (!out) for (const gid of it.options || []) {
      const g = (menu.optionGroups || []).find((x) => x.id === gid);
      if (!g || g.multi) continue;
      const vis = g.choices.filter((c) => !c.hidden);
      if (vis.length && vis.every((c) => oc.has(c.id))) { out = true; break; }
    }
    if (out) outItems.push(it.id);
  }
  const ingredients = [...ings.values()].map((x) => ({ ...x, out: outIng.has(x.id) }))
    .sort((a, b) => ((ORDER.indexOf(a.section) + 1) || 99) - ((ORDER.indexOf(b.section) + 1) || 99));
  return { soldOut: [...sold], outItems, outChoices, ingredients };
}
