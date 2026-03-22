// ============================================================
// Chaos Goblins - Roll Tables
// ============================================================

export const FORMS = [
  "A High Society Noble (Duke, Duchess, Fancypants)",
  "A Decrepit, Ancient Elder (Fragile Wizard, Grandma, Professor)",
  'A "Domesticated" Animal (Prize-winning Poodle, War Horse, Falcon in a vest)',
  "A Town Official (Executioner, Tax Collector, Judge)",
  "A Beautiful Performer (Bard, Opera Singer, Mime)",
  "A Human Child (The Prince/Princess, a creepy orphan)",
];

export const OBSESSIONS = [
  "Shiny Things — You must touch anything that glitters.",
  "Bugs — You are constantly looking for snacks in corners.",
  "Textures — You need to rub your face on expensive fabrics.",
  "Hiding — You feel exposed and constantly try to crawl under furniture.",
  "Smells — You are constantly smelling and interested in the smell of things.",
  'Sus — You are convinced that one of the goblins is lying about being a goblin.',
];

export const POCKET_ITEMS = [
  "A dead rat (stiff)",
  "A rusty spoon",
  "A live frog",
  "A very nice stolen handkerchief",
  "A piece of chalk",
  "A long piece of string",
  "A human tooth (not yours)",
  "A shiny button",
  "A half-eaten sandwich",
  "A candle stub",
  "A bag of flour (leaking)",
  "A semi magical Crystal",
  "A jar of angry bees",
  "A heavy rock",
  "A severed doll head",
  "A sausage link",
  "A glass eye",
  "A small bell",
  "A jar of grease",
  "A discarded love letter in ornate calligraphy",
];

export const NEMESES = [
  {
    name: "The Confused Goose",
    description: "It thinks you are bread. Honks loudly during stealth.",
  },
  {
    name: "Sir Prance-a-lot",
    description:
      "A genius Royal Horse. Bites and kicks when guards aren't looking.",
  },
  {
    name: "Steve, the Evil Twin",
    description:
      "The Wizard's twin brother. Casts minor annoyances. Not a very good wizard.",
  },
  {
    name: "Timmy, the Boy Detective",
    description: "He's read a lot of mystery novels.",
  },
  {
    name: "Lady Gwendolyn",
    description:
      "An intensely clingy ex-lover. Convinced you're her fiancé back from the war.",
  },
  {
    name: "The Safety Inspector",
    description:
      'A bureaucrat constantly blocking your path for "Code Violations."',
  },
];

export const MISSION_GOALS = [
  "Deliver",
  "Steal",
  "Protect",
  '"Fix" / Repair',
  "Impersonate someone to get",
  "Destroy",
];

export const MISSION_TARGETS = [
  "The King's Wedding Cake",
  "The Peace Treaty",
  "The Crown Jewels",
  "The Royal Toupee",
  "The Alchemist's Unstable Prototype",
  "The Duchess's pet kinkajou",
];

export const SUSPICION_DESCRIPTIONS: Record<number, string> = {
  1: "Everything seems normal.",
  2: "People are looking at you funny.",
  3: "People are whispering.",
  4: "Guards are moving closer.",
  5: "Someone is actively accusing you of being a monster.",
  6: "CALL FOR BACKUP!",
};

export const WIZARD_HAZARDS = [
  "The floor is now lava (actually just very hot jam).",
  "All doors scream when opened.",
  "Gravity reverses for 10 seconds.",
  "Every nearby animal starts talking, but only to complain.",
  "It starts raining... indoors. Just in this room.",
  "An exact duplicate of one random goblin appears.",
  "All metal objects become magnetically attracted to the nearest goblin.",
  "The lights go out and are replaced by ominous mood lighting.",
  "A swarm of butterflies erupts from the solved problem.",
  "Time hiccups — everyone repeats their last sentence involuntarily.",
  "The nearest wall becomes transparent for 1 minute.",
  "A very loud trumpet fanfare announces what just happened to everyone nearby.",
];
