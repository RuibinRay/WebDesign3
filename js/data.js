/*
 * RACIMO: the brand as data. Every page, drawing and prompt reads from here.
 *
 * The one idea: ripeness is the recipe. One bunch (racimo) of plantains is cut on four
 * different days as it ripens, and each day makes a different chip.
 *
 * CONCEPT VALUES. Racimo is an invented brand. Days, prices, weights, cut thicknesses,
 * fry notes, nutrition figures and everything said about growers are placeholders written
 * for the design. Replace them with real ones before anything is published.
 */
(function (root) {
  var COLOR = {
    hoja: '#0F3D26',     /* plantain leaf: the plant, before day 1 */
    verde: '#5A9A2D',    /* peel, day 1. The four peel colours are matched to the backdrops of the generated photos. */
    pinton: '#CBBB2E',   /* peel, day 5 */
    maduro: '#F7A712',   /* peel, day 9 */
    miel: '#2A150D',     /* peel, day 12 */
    ambar: '#E8912A',    /* caramel edge, the light on a black peel */
    achiote: '#E4482B',  /* the painted-oxcart red: stamps and nothing else */
    papel: '#F5EEDC',    /* unbleached paper */
    tinta: '#1A130D',    /* ink */
    cascara: '#5A3210',  /* peel freckles */
  };

  var DAYS = 12; /* day 1 = the day the bunch is cut; day 12 = black peel */
  var tOf = function (day) { return (day - 1) / (DAYS - 1); };

  var CHIPS = [
    {
      id: 'verde', name: 'Verde', day: 1, world: COLOR.verde, fg: 'ink',
      gloss: 'green', flavor: 'Sea salt', flavorEs: 'Sal de mar',
      line: 'Cut green, the day the racimo comes down.',
      blurb: 'All starch, no sugar yet. It fries pale and snaps like a cracker, so we slice it long and salt it and leave it alone.',
      day_note: 'Day 1. The peel is hard and bright green and the fruit inside is dense, dry and starchy. Nothing sweet has happened yet.',
      cut: { name: 'Tiras', what: 'Long ribbons, sliced lengthwise', thick: '1.2 mm', fry: 'Hot and fast' },
      taste: ['Clean', 'Starchy', 'Loud'], crunch: 5, sweet: 1,
      chip: { flesh: '#F1DB8E', edge: '#D7B659', core: '#C9A64A' },
      pair: { name: 'Chimichurri tico', what: 'Tomato, onion, cilantro and lime, chopped fine. What the rest of the world calls pico de gallo.' },
      ingredients: 'Green plantain, coconut oil, sea salt.',
      nutrition: { kcal: 150, fat: '8 g', carbs: '18 g', sugars: '0.5 g', fibre: '1.5 g', protein: '0.5 g', sodium: '60 mg' },
    },
    {
      id: 'pinton', name: 'Pintón', day: 5, world: COLOR.pinton, fg: 'ink',
      gloss: 'turning', flavor: 'Lime & chile', flavorEs: 'Limón y chile',
      line: 'Half green, half gold. The day it turns.',
      blurb: 'Pintón is the word for a plantain that has started to change colour. A little sugar has arrived and the starch has not left, so it can take lime and a slow chile heat.',
      day_note: 'Day 5. Yellow is spreading from the middle and the ends are still green. The fruit gives slightly under your thumb.',
      cut: { name: 'Sesgo', what: 'Ovals, sliced on the bias', thick: '1.5 mm', fry: 'A little cooler, a little longer' },
      taste: ['Bright', 'Tangy', 'Warm'], crunch: 4, sweet: 2,
      chip: { flesh: '#F3C552', edge: '#D99B2D', core: '#CF8F28' },
      pair: { name: 'Frijoles molidos', what: 'Black beans cooked down and mashed smooth with onion and sweet pepper. Served warm.' },
      ingredients: 'Plantain, coconut oil, lime, chile, sea salt.',
      nutrition: { kcal: 150, fat: '8 g', carbs: '18 g', sugars: '3 g', fibre: '1.5 g', protein: '0.5 g', sodium: '85 mg' },
    },
    {
      id: 'maduro', name: 'Maduro', day: 9, world: COLOR.maduro, fg: 'ink',
      gloss: 'ripe', flavor: 'Sweet & salt', flavorEs: 'Dulce y sal',
      line: 'Yellow with freckles. Sweet at the edges.',
      blurb: 'By now most of the starch is sugar. In the kettle the rim of every slice caramelises before the middle does, so you get a dark, chewy edge and a crisp centre.',
      day_note: 'Day 9. Full yellow, freckled brown. The fruit is soft and smells like banana bread before the oven.',
      cut: { name: 'Sesgo grueso', what: 'Thick ovals, sliced on the bias', thick: '2 mm', fry: 'Low, so the sugar does not burn' },
      taste: ['Caramel', 'Buttery', 'Salty'], crunch: 3, sweet: 4,
      chip: { flesh: '#E79C30', edge: '#A65A15', core: '#B8701C' },
      pair: { name: 'Natilla y queso', what: 'Costa Rican sour cream and a slice of fresh white cheese. Sweet, salt, sour, all at once.' },
      ingredients: 'Ripe plantain, coconut oil, sea salt.',
      nutrition: { kcal: 150, fat: '7.5 g', carbs: '19 g', sugars: '7 g', fibre: '1 g', protein: '0.5 g', sodium: '55 mg' },
    },
    {
      id: 'miel', name: 'Miel', day: 12, world: COLOR.miel, fg: 'paper',
      gloss: 'honey', flavor: 'Cacao & salt', flavorEs: 'Cacao y sal',
      line: 'Black peel. The fruit is almost syrup.',
      blurb: 'Most people throw a plantain out at this point. We cut it thick, dry it slowly, then finish it in the kettle and dust it with cacao grown in the same valley. It eats like toffee that breaks.',
      day_note: 'Day 12. The peel is black and thin as paper. Inside, the fruit is amber and nearly liquid at the centre.',
      cut: { name: 'Rodajas', what: 'Thick rounds, dried before frying', thick: '3 mm', fry: 'Dried low, then a short kettle finish' },
      taste: ['Toffee', 'Cacao', 'Deep'], crunch: 3, sweet: 5,
      chip: { flesh: '#8C4B1D', edge: '#48230C', core: '#6A3513' },
      pair: { name: 'Café chorreado', what: 'Coffee poured through a cloth filter, the way it is made at home here. Black, no sugar.' },
      ingredients: 'Very ripe plantain, coconut oil, cacao, sea salt.',
      nutrition: { kcal: 145, fat: '7 g', carbs: '20 g', sugars: '10 g', fibre: '1 g', protein: '0.5 g', sodium: '50 mg' },
    },
  ];
  CHIPS.forEach(function (c, i) { c.t = tOf(c.day); c.index = i; c.dayLabel = (c.day < 10 ? '0' : '') + c.day; });

  /* What happens on the days between the four cuts. Shown on the ripeness ruler. */
  var WAIT = {
    2: 'Still green. We wait.', 3: 'Still green. We wait.', 4: 'A first blush of yellow. Tomorrow.',
    6: 'Past pintón, not yet ripe. We wait.', 7: 'The first freckles. We wait.', 8: 'Nearly. Tomorrow.',
    10: 'Freckles are joining up. We wait.', 11: 'Almost black. Tomorrow.',
  };

  var SIZES = [
    { id: 'bag', label: '85 g bag', price: 4.5 },
    { id: 'big', label: '250 g bag', price: 11 },
    { id: 'case', label: 'Case of 6', price: 24 },
  ];

  var STEPS = [
    { es: 'Cortar', en: 'Cut', text: 'The racimo comes down green, by machete, and rides out of the finca on a shoulder.' },
    { es: 'Esperar', en: 'Wait', text: 'It hangs in the shade. Nothing is sprayed and nothing is hurried. We count days.' },
    { es: 'Tajar', en: 'Slice', text: 'On days 1, 5, 9 and 12 a share of the bunch is peeled and sliced by hand.' },
    { es: 'Freír', en: 'Fry', text: 'Small kettles of coconut oil, one batch at a time, each day at its own heat.' },
    { es: 'Salar', en: 'Salt', text: 'Sea salt while the chips are still hot. Then the bag is sealed and stamped with its day.' },
  ];

  root.RACIMO = {
    name: 'Racimo',
    tagline: 'One bunch. Four days. Four chips.',
    place: 'Talamanca, Costa Rica',
    color: COLOR, days: DAYS, tOf: tOf,
    chips: CHIPS,
    byId: CHIPS.reduce(function (a, c) { a[c.id] = c; return a; }, {}),
    wait: WAIT, sizes: SIZES, steps: STEPS,
    box: { name: 'La caja', price: 16, what: 'One bag of each day, every month.' },
    /* [longitude, latitude] of places drawn on the sketch map */
    places: { talamanca: [-82.86, 9.62], sanjose: [-84.08, 9.93], limon: [-83.03, 9.99] },
    concept: 'Racimo is a concept brand. Days, prices, weights, cut and fry notes, nutrition figures and grower details are placeholders.',
  };
})(typeof window !== 'undefined' ? window : globalThis);
