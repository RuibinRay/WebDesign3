/*
 * RACIMO: every picture and film the site needs, as data.
 *
 * One file feeds three things:
 *   1. the website (alt text, ratio, which drawing stands in until the photo exists)
 *   2. higgsfield/generate.mjs (prompt, model, aspect, reference images)
 *   3. shots.html (the shot sheet: copy a prompt into the Higgsfield app by hand)
 *
 * Consistency comes from reuse. The look blocks, the chip and fruit descriptions and the
 * backdrops are pasted byte-identical into every prompt that needs them.
 *
 * The pack is never invented by the image model. Each bag's printed front is drawn in code
 * (js/art.js) and saved as higgsfield/refs/<chip>-pack.png from refs.html. Every photo that
 * shows a bag takes that file as its reference image, so the label is the real design.
 *
 * Stages:  1  no reference needed (fruit, chips, places, first frames of the films)
 *          2  needs a reference (every shot with a bag; last frames of the films)
 *          3  the two scroll films, each between a first and a last frame
 *
 * Plain script on purpose: the browser reads window.RACIMO_SHOTS, Node reads it through vm.
 */
(function (root) {
  /* ───────────── LOOK BIBLE ───────────── */

  var STUDIO =
    'Photoreal premium food and packaging photography, medium-format camera, 90mm lens, f/11, every texture crisp. ' +
    'One large soft key light from above and slightly camera-left, a crisp soft-edged contact shadow under every object. ' +
    'Seamless matte paper backdrop and surface in one flat colour. Colour-accurate and appetising, fine grain. Nothing in the frame except what is named.';

  var HANG =
    'Photoreal still-life photography, medium-format camera on a locked-off tripod, 80mm lens, f/8. ' +
    'One large soft key light from camera-left with a gentle falloff into shadow on the right. ' +
    'Seamless matte backdrop in one flat colour: deep plantain-leaf green (#0F3D26). Colour-accurate, fine grain, no haze.';

  var FINCA =
    'Photoreal documentary photography, full-frame camera, 35mm lens, natural colour, fine film grain. ' +
    'The humid Caribbean lowlands of Talamanca, Costa Rica: tall plantain plants with broad, wind-torn leaves, dark wet soil, low cloud over forested hills. ' +
    'Soft overcast morning light with a little sun breaking through. ' +
    'Palette: leaf green #0F3D26, peel green #5A9A2D, wet earth brown, one small accent of red-orange #E4482B. No haze, no lens flare.';

  var PAILA =
    'Photoreal macro food cinematography, 100mm macro lens, shot on ARRI Alexa 35, fine grain. ' +
    'A wide, shallow steel kettle of clear golden coconut oil on a dark kitchen range, seen from a low three-quarter angle. ' +
    'One hard warm key light from the back-left makes the oil and every bubble glow amber against a deep black-brown background (#1A130D). ' +
    'Palette: oil gold #F7A712, amber #E8912A, black-brown. Locked exposure and white balance, no steam hiding the subject, no lens flare.';

  var TABLE =
    'Photoreal editorial food photography, 50mm lens, f/5.6, three-quarter view from above. ' +
    'A worn, painted wooden table in open shade on a veranda, soft daylight from the left, a strip of fresh plantain leaf laid across it as a mat. ' +
    'Natural colour, appetising, fine grain. No people.';

  var NEG = 'No text, no letters, no numbers, no logos anywhere in the frame, no watermark.';
  var PACK =
    'The bag is a matte stand-up snack pouch with crimped top and bottom seals. Its printed front is exactly the artwork in the reference image: ' +
    'the same layout, colours, lettering, painted wheel illustration and round red day stamp. Do not redesign it and do not add or change any words. ' +
    'The only lettering in the frame is the printing on the bag. No other text, no watermark.';

  /* ───────────── THE CHIPS AND THE FRUIT (described the same way every time) ───────────── */

  var CHIP = {
    verde: 'long, thin, pale-gold plantain chips: ribbons sliced lengthwise from green plantain, about 12 cm long, gently wavy, matte and dry, flecked with sea salt',
    pinton: 'thin oval plantain chips sliced on the bias, golden yellow with a slightly darker rim, each showing the faint three-part core of the fruit, dusted with fine red chile and specks of green lime zest',
    maduro: 'thick oval chips of ripe plantain sliced on the bias, deep amber-orange with dark caramelised edges and a glossy surface, a few flakes of sea salt',
    miel: 'thick round chips of very ripe plantain, dark mahogany brown with a glassy toffee sheen, dusted with cacao and a few flakes of sea salt',
  };
  var FRUIT = {
    verde: 'hard, bright green plantains with angular ridges and no yellow at all',
    pinton: 'plantains turning from green to yellow: yellow through the middle, still green at both ends',
    maduro: 'fully yellow plantains freckled all over with brown-black spots',
    miel: 'very ripe plantains with a thin, almost entirely black peel and a few amber-yellow patches',
  };
  var FLESH = {
    verde: 'pale ivory, dense and dry', pinton: 'cream-yellow and firm', maduro: 'soft golden yellow', miel: 'deep amber and glistening',
  };
  var BACKDROP = {
    verde: 'peel green (#5A9A2D)', pinton: 'yellow-green (#CBBB2E)', maduro: 'golden yellow (#F7A712)', miel: 'black-brown (#2A150D)',
  };
  var BG = { verde: '#5A9A2D', pinton: '#CBBB2E', maduro: '#F7A712', miel: '#2A150D' };
  var DISH = {
    verde: 'a small clay bowl of chimichurri tico: finely chopped tomato, white onion and cilantro with lime',
    pinton: 'a small clay bowl of warm, smooth mashed black beans with a spoon resting in it',
    maduro: 'a small saucer of thick white sour cream and two slices of fresh white cheese',
    miel: 'an enamel cup of black coffee beside a cloth coffee filter on a small wooden stand',
  };

  var NAMES = { verde: 'Verde', pinton: 'Pintón', maduro: 'Maduro', miel: 'Miel' };
  var IDS = ['verde', 'pinton', 'maduro', 'miel'];
  var packRef = function (c) { return 'higgsfield/refs/' + c + '-pack.png'; };

  var gpt = function (o, quality) { o.model = 'gpt_image_2_6'; o.params = { resolution: '2k', quality: quality || 'high' }; return o; };
  var soul = function (o) { o.model = 'soul_cinematic'; o.params = { quality: '2k' }; return o; };
  var shots = [];

  /* ───────────── STAGE 1: fruit and chips, no reference ───────────── */
  IDS.forEach(function (c) {
    shots.push(
      gpt({
        id: c + '-fruit', stage: 1, aspect: '4:5', tone: 'studio', chip: c, art: 'fruit', bg: BG[c],
        used: [NAMES[c] + ' page: the day'],
        alt: 'Plantains on the day ' + NAMES[c] + ' is cut.',
        brief: 'Still life: three plantains at this ripeness on the ' + NAMES[c] + ' backdrop, one cut open to show the flesh.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[c] + '. Three ' + FRUIT[c] + ', lying on the surface on a loose diagonal. ' +
          'The front one is peeled halfway and cut clean across to show the flesh, which is ' + FLESH[c] + '. ' +
          'Camera slightly above, the group centred with even space around it. ' + NEG,
      }),
      gpt({
        id: c + '-pile', stage: 1, aspect: '1:1', tone: 'studio', chip: c, art: 'pile', bg: BG[c],
        used: ['Home: the four', NAMES[c] + ' page: the cut'],
        alt: 'A heap of Racimo ' + NAMES[c] + ' plantain chips seen from above.',
        brief: 'Top-down: a loose heap of ' + NAMES[c] + ' chips on its backdrop, a few stragglers, every chip sharp.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[c] + '. Top-down view looking straight down at a loose heap of ' + CHIP[c] + ', ' +
          'piled in the centre of the frame with a few single chips scattered around it. Every chip sharp edge to edge. ' + NEG,
      })
    );
  });

  shots.push(
    gpt({
      id: 'ripen-start', stage: 1, aspect: '16:9', tone: 'deep', art: 'racimo', ripe: 0, bg: '#0F3D26', priority: true,
      used: ['Home: first frame of the hero film', 'Social card'],
      alt: 'A bunch of green plantains hanging against a deep green backdrop.',
      brief: 'Day 1: a hand of bright green plantains hanging from its stalk, right side of the frame; the left 45% is empty deep green.',
      prompt:
        HANG + ' A single hand of about fourteen ' + FRUIT.verde + ', hanging from a thick green stalk tied to a short length of natural rope that leaves the top of the frame. ' +
        'The bunch hangs perfectly still in the right 55% of the frame, the whole bunch visible with space below it. ' +
        'The left 45% of the frame is empty backdrop: quiet negative space. ' + NEG,
    }),
    soul({
      id: 'finca', stage: 1, aspect: '3:2', tone: 'scene', art: 'wheel', bg: '#0F3D26',
      used: ['Home: origin'],
      alt: 'Rows of plantain plants in Talamanca under low cloud.',
      brief: 'The finca: a path between rows of tall plantain plants, a green bunch hanging on the nearest one, hills in cloud behind.',
      prompt:
        FINCA + ' A narrow mud path runs straight between two rows of plantain plants, seen from standing height. ' +
        'On the nearest plant a heavy bunch of green plantains hangs at head height. Forested hills fade into low cloud behind. No people. ' + NEG,
    }),
    soul({
      id: 'corte', stage: 1, aspect: '3:4', tone: 'scene', art: 'wheel', bg: '#0F3D26',
      used: ['Home: origin'],
      alt: 'A grower’s hands steady a green bunch as it is cut from the plant.',
      brief: 'The cut: weathered hands holding a green racimo by its stalk just after the machete has gone through. Hands and forearms only.',
      prompt:
        FINCA + ' Close view, 50mm lens: a grower’s weathered hands and forearms hold a heavy bunch of green plantains by its thick stalk, freshly cut, ' +
        'white sap beading on the cut face of the stalk, a machete resting against the plant behind. Only hands and forearms in frame, no face. ' + NEG,
    }),
    soul({
      id: 'rio', stage: 1, aspect: '3:2', tone: 'scene', art: 'wheel', bg: '#0F3D26',
      used: ['Home: origin'],
      alt: 'A wide, slow river between forested banks in the Caribbean lowlands.',
      brief: 'The valley: a wide, slow, tea-coloured river between forest banks, plantain plots on the far side, mist on the hills.',
      prompt:
        FINCA + ' Wide view from a low bank: a broad, slow, tea-brown river curving between dense forest, small plantain plots along the far bank, ' +
        'a narrow wooden boat pulled up on the mud in the foreground, mist lying on the hills. No people. ' + NEG,
    }),
    soul({
      id: 'tajar', stage: 1, aspect: '3:4', tone: 'scene', art: 'wheel', bg: '#1A130D',
      used: ['Home: the kettle'],
      alt: 'Hands slicing a peeled plantain lengthwise on a wooden board.',
      brief: 'Slicing: hands drawing a knife lengthwise through a peeled green plantain on a worn board, a bowl of ribbons beside it.',
      prompt:
        'Photoreal documentary food photography, 50mm lens, f/4, natural window light from the left, fine film grain, dark kitchen background. ' +
        'Close view from above: a cook’s hands draw a long thin knife lengthwise through a peeled green plantain on a worn wooden board, ' +
        'a steel bowl of pale plantain ribbons beside it, green peels at the edge of the board. Only hands in frame, no face. ' + NEG,
    }),
    gpt({
      id: 'paila-start', stage: 1, aspect: '16:9', tone: 'deep', art: 'pile', chip: 'verde', bg: '#1A130D',
      used: ['Home: first frame of the kettle film'],
      alt: 'Pale slices of plantain sliding into a kettle of hot oil.',
      brief: 'Macro: raw pale slices slip off a wooden paddle into clear golden oil, first bubbles rising. Subject in the right 60%, left 40% dark.',
      prompt:
        PAILA + ' Raw, pale ivory oval slices of plantain slide off a flat wooden paddle into the oil; the first slices have just touched the surface and a ring of fine bubbles is rising around them. ' +
        'The kettle and paddle sit in the right 60% of the frame; the left 40% is dark, quiet negative space. ' + NEG,
    })
  );

  /* ───────────── STAGE 2: every shot with a bag, referenced to the drawn pack; film last frames ───────────── */
  IDS.forEach(function (c) {
    shots.push(
      gpt({
        id: c + '-bag', stage: 2, aspect: '4:5', tone: 'studio', chip: c, art: 'bag', bg: BG[c], refs: [packRef(c)],
        used: ['Home: the four (replaces the real-time 3D bag in the card)'],
        alt: 'A bag of Racimo ' + NAMES[c] + ' plantain chips.',
        brief: 'The ' + NAMES[c] + ' bag standing upright, straight on, on its own colour, five of its chips at the base.',
        prompt:
          STUDIO + ' Backdrop: ' + BACKDROP[c] + '. A single bag of plantain chips standing upright, seen straight on, centred, filling about 70% of the frame height. ' +
          'Five ' + CHIP[c] + ' lie on the surface at its base. ' + PACK,
      }),
      gpt({
        id: c + '-pair', stage: 2, aspect: '3:2', tone: 'scene', chip: c, art: 'pair', bg: '#E9DFC4', refs: [packRef(c)],
        used: ['Home: con qué', NAMES[c] + ' page: con qué'],
        alt: 'Racimo ' + NAMES[c] + ' chips served with what they go with.',
        brief: NAMES[c] + ' on the table: the bag at the back, a bowl of its chips in front, and what it is eaten with.',
        prompt:
          TABLE + ' On the table: a bag of plantain chips standing at the back left, a shallow enamel bowl of ' + CHIP[c] + ' in front of it, and beside the bowl ' + DISH[c] + '. ' + PACK,
      })
    );
  });

  shots.push(
    gpt({
      id: 'ripen-end', stage: 2, aspect: '16:9', tone: 'deep', art: 'racimo', ripe: 1, bg: '#0F3D26', refs: ['higgsfield/renders/ripen-start.png'],
      used: ['Home: last frame of the hero film'],
      alt: 'The same bunch twelve days later, its peel gone black.',
      brief: 'Day 12, the same frame: the same bunch, every plantain now black with a few amber patches. Nothing else has changed.',
      prompt:
        'The same frame as the reference image, twelve days later. Same camera position, lens, framing, light, rope, stalk and backdrop. ' +
        'The same bunch hangs in exactly the same place and shape, but every plantain has ripened: ' + FRUIT.miel + '. The stalk has dried to brown. ' +
        'Nothing has moved and nothing has been added. ' + NEG,
    }),
    gpt({
      id: 'paila-end', stage: 2, aspect: '16:9', tone: 'deep', art: 'pile', chip: 'maduro', bg: '#1A130D', refs: ['higgsfield/renders/paila-start.png'],
      used: ['Home: last frame of the kettle film'],
      alt: 'A skimmer lifts golden plantain chips out of the oil.',
      brief: 'Same frame, a minute later: a steel skimmer lifts a heap of golden chips out of the kettle, oil running off in threads.',
      prompt:
        'The same frame as the reference image, ninety seconds later. Same camera position, lens, framing, light and kettle. ' +
        'The slices have fried into golden plantain chips; a round steel wire skimmer lifts a heap of them just clear of the surface, oil running off in fine bright threads, the oil below calm with a few last bubbles. ' +
        'Subject in the right 60% of the frame, the left 40% dark negative space. ' + NEG,
    }),
    gpt({
      id: 'box', stage: 2, aspect: '3:2', tone: 'studio', art: 'box', bg: '#0F3D26', refs: IDS.map(packRef),
      used: ['Home: la caja'],
      alt: 'An open box holding one bag of each of the four Racimo chips.',
      brief: 'La caja: an open kraft box on deep green, the four bags side by side inside in ripening order.',
      prompt:
        STUDIO + ' Backdrop: deep plantain-leaf green (#0F3D26). Top-down view of an open, shallow, unprinted kraft cardboard box lined with a fresh plantain leaf. ' +
        'Inside, four bags of plantain chips lie flat side by side, in this order from left to right: the green bag, the yellow-green bag, the golden-yellow bag, the black-brown bag. ' +
        'Each bag’s printed front is exactly the artwork in its reference image (four reference images, one per bag): same layout, colours, lettering, wheel illustration and round red day stamp. ' +
        'Do not redesign them and do not add or change any words. The only lettering in the frame is the printing on the bags. No other text, no watermark.',
    })
  );

  /* ───────────── STAGE 3: the scroll films ───────────── */
  var films = [
    {
      id: 'film-ripen', kind: 'film', stage: 3, model: 'kling4_0', aspect: '16:9', name: 'ripen',
      params: { mode: 'image-to-video', duration: 10, resolution: '1080p' },
      start: 'ripen-start', end: 'ripen-end', focus: 0.7,
      used: ['Home: hero, scrubbed by scrolling'],
      alt: 'A hanging bunch of plantains ripens from green to black.',
      brief: 'One locked shot, 10 s: twelve days in time-lapse. The bunch goes green, yellow, freckled, black. Nothing else moves.',
      beats: [
        { at: 0, text: 'Day 1. Cut green.' },
        { at: 0.3, text: 'Day 5. Yellow from the middle out.' },
        { at: 0.6, text: 'Day 9. Freckles.' },
        { at: 0.86, text: 'Day 12. Black.' },
      ],
      prompt:
        'One continuous locked-off time-lapse, no cuts, no camera movement. The hanging bunch of plantains ripens in place: the green peels turn yellow from the middle of each fruit outward, ' +
        'brown freckles appear and spread, and the peels darken to black. The bunch does not swing or move; only the colour of the fruit changes. ' +
        'Constant light and exposure, crisp detail. No text, no logos.',
    },
    {
      id: 'film-paila', kind: 'film', stage: 3, model: 'kling4_0', aspect: '16:9', name: 'paila',
      params: { mode: 'image-to-video', duration: 5, resolution: '1080p' },
      start: 'paila-start', end: 'paila-end', focus: 0.68,
      used: ['Home: the kettle, scrubbed by scrolling'],
      alt: 'Plantain slices fry in a kettle and are lifted out golden.',
      brief: 'Macro, 5 s: slices go into the oil, the kettle boils up around them, a skimmer lifts them out golden.',
      beats: [
        { at: 0, text: 'Slices off the paddle.' },
        { at: 0.3, text: 'The kettle boils up.' },
        { at: 0.62, text: 'The bubbles go quiet: the water is out.' },
        { at: 0.85, text: 'Lifted. Salted while hot.' },
      ],
      prompt:
        'One continuous macro shot, no cuts, locked-off camera. The plantain slices drop into the hot oil, the oil boils up around them in a dense rush of fine bubbles, ' +
        'the slices turn from pale to golden as the bubbling calms, and a steel skimmer rises through the surface lifting the finished chips, oil streaming off. ' +
        'Slightly slowed, natural motion, constant exposure, crisp detail. No text, no logos.',
    },
  ];

  /* the drawn packs: free, made from refs.html, used as references above */
  var refs = IDS.map(function (c) {
    return { id: c + '-pack', chip: c, file: packRef(c), brief: 'The printed front of the ' + NAMES[c] + ' bag, drawn in code. Not generated.' };
  });

  var all = shots.concat(films);
  root.RACIMO_SHOTS = {
    look: { STUDIO: STUDIO, HANG: HANG, FINCA: FINCA, PAILA: PAILA, TABLE: TABLE, NEG: NEG, PACK: PACK },
    chip: CHIP, fruit: FRUIT,
    shots: shots, films: films, refs: refs, models3d: [],
    all: all,
    byId: all.reduce(function (a, s) { a[s.id] = s; return a; }, {}),
  };
})(typeof window !== 'undefined' ? window : globalThis);
