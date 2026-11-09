/* Pages de l'écran TV (/ecran), partagées avec l'admin pour régler ce qui s'affiche.
   Chaque page = une colonne « vedettes » + deux colonnes de rubriques (comme le tableau du resto).
   "@box" = encadré crudités + sauces. Les rubriques inconnues sont ajoutées à la fin, deux par page.
   La clé d'une page est l'id de sa première rubrique (ex. "sandwichs", "pizzas"). */
(function(){
  const PLAN = [
    [["sandwichs", "pokebowl"], ["assiettes", "@box"]],
    [["menus"], ["accompagnements", "desserts"]],
    [["pizzas"], ["pides"]],
    [["boissons"], ["alcools"]],
  ];
  function screenPlan(menu){
    const cats = (menu.categories || []).filter(c => !c.hidden && c.items.some(i => !i.hidden));
    const byId = Object.fromEntries(cats.map(c => [c.id, c])), used = new Set(["@box"]);
    const plan = PLAN.map(pg => pg.map(col => col.filter(id => byId[id] || id === "@box"))).filter(pg => pg.some(col => col.some(id => id !== "@box")));
    plan.flat(2).forEach(id => used.add(id));
    const rest = cats.filter(c => !used.has(c.id)).map(c => c.id);
    for (let i = 0; i < rest.length; i += 2) plan.push([[rest[i]], rest[i + 1] ? [rest[i + 1]] : []]);
    return plan.map(pg => ({key: pg.flat().find(id => id !== "@box"), cols: pg, cats: pg.flat().filter(id => id !== "@box").map(id => byId[id])}));
  }
  // Réglage d'une page : {on, dur} (dur en secondes, 0 = durée par défaut)
  function slideCfg(menu, key){
    const s = ((menu.screen || {}).slides || {})[key] || {};
    return {on: s.on !== false, dur: +s.dur || 0};
  }
  window.MADO_SCREEN = {screenPlan, slideCfg};
})();
