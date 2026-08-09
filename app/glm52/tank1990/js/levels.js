// ============================================================
// Tank 1990 - Level Data
// Each level is a 13x13 grid of blocks (each block = 2x2 tiles).
// Characters: . empty, B brick, S steel, W water, T trees, I ice
// ============================================================

const LEVELS = [
  // Level 1 - simple bricks and steel
  [
    ".............",
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".............",
    ".B.B.S.S.B.B.",
    ".B.B.S.S.B.B.",
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".............",
    ".............",
    "............."
  ],
  // Level 2 - corridors
  [
    ".............",
    ".BBBBBBBBBBB.",
    ".B.........B.",
    ".B.BB.BB.B.B.",
    ".B.B.....B.B.",
    ".B.B.BBB.B.B.",
    ".B...B.B...B.",
    ".B.B.BBB.B.B.",
    ".B.B.....B.B.",
    ".B.BB.BB.B.B.",
    ".B.........B.",
    ".............",
    "............."
  ],
  // Level 3 - waterways
  [
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".............",
    ".BB.WWWWWW.BB",
    ".BB.WWWWWW.BB",
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".............",
    ".B.B.B.B.B.B.",
    ".............",
    "............."
  ],
  // Level 4 - forest (trees hide tanks)
  [
    ".............",
    ".BT.T.T.T.TB.",
    ".BT.T.T.T.TB.",
    ".............",
    ".B.B.S.S.B.B.",
    ".B.B.S.S.B.B.",
    ".............",
    ".BT.T.T.T.TB.",
    ".BT.T.T.T.TB.",
    ".............",
    ".B.B.B.B.B.B.",
    ".............",
    "............."
  ],
  // Level 5 - fortress
  [
    ".............",
    ".BBBBBBBBBBB.",
    ".B.........B.",
    ".B.SSSSSSS.B.",
    ".B.S.....S.B.",
    ".B.S.BBB.S.B.",
    ".B.S.B...S.B.",
    ".B.S.BBB.S.B.",
    ".B.S.....S.B.",
    ".B.SSSSSSS.B.",
    ".B.........B.",
    ".............",
    "............."
  ],
  // Level 6 - mixed challenge
  [
    ".............",
    ".S.B.B.B.B.S.",
    ".S.B.B.B.B.S.",
    ".............",
    ".B.W.W.W.W.B.",
    ".B.W.W.W.W.B.",
    ".............",
    ".B.T.T.T.T.B.",
    ".B.T.T.T.T.B.",
    ".............",
    ".S.B.B.B.B.S.",
    ".............",
    "............."
  ],
  // Level 7 - maze
  [
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".B...........",
    ".B.BBBBBBBBB.",
    ".B.B.......B.",
    ".B.B.BBBBB.B.",
    ".B.B.B...B.B.",
    ".B.BBBBB.B.B.",
    ".B.......B.B.",
    ".BBBBBBBBB.B.",
    ".............",
    "............."
  ],
  // Level 8 - final
  [
    ".............",
    ".S.S.S.S.S.S.",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".............",
    ".BB.SSSSSS.BB",
    ".BB.S....S.BB",
    ".............",
    ".B.B.B.B.B.B.",
    ".B.B.B.B.B.B.",
    ".S.B.B.B.B.S.",
    ".............",
    "............."
  ]
];
