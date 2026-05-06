const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  },
});

const port = 3000;
const uploadsDir = path.join(__dirname, "uploads");
const databaseFilePath = path.join(__dirname, "database.json");

function resolveFrontendDistDir() {
  const candidates = [
    path.join(__dirname, "dist"),
    path.join(__dirname, "..", "frontend", "dist"),
  ];

  return candidates.find((dir) => fs.existsSync(path.join(dir, "index.html"))) || null;
}

const frontendDistDir = resolveFrontendDistDir();

const DEFAULT_SETTINGS = {
  dual: false,
  contestants: 10,
  isLaughCounter: false,
  cardTypes: ["yellow", "red", "black", "white"],
  teamCardTypes: ["orange1", "orange2"],
};

app.use(cors());
app.use(express.json());

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sanitizeSettingsPatch(patch) {
  const sanitized = {};

  if (typeof patch.dual === "boolean") {
    sanitized.dual = patch.dual;
  }

  if (Number.isInteger(patch.contestants) && patch.contestants >= 2 && patch.contestants <= 30) {
    sanitized.contestants = patch.contestants;
  }

  if (typeof patch.isLaughCounter === "boolean") {
    sanitized.isLaughCounter = patch.isLaughCounter;
  }

  if (Array.isArray(patch.cardTypes)) {
    const normalized = patch.cardTypes
      .filter((type) => typeof type === "string")
      .map((type) => type.trim().toLowerCase())
      .filter((type) => /^[a-z][a-z0-9-]{1,23}$/.test(type));

    const unique = [...new Set(normalized)];
    if (!unique.includes("yellow")) {
      unique.unshift("yellow");
    }
    if (!unique.includes("red")) {
      unique.push("red");
    }

    sanitized.cardTypes = unique;
  }

  if (Array.isArray(patch.teamCardTypes)) {
    const normalized = patch.teamCardTypes
      .filter((type) => typeof type === "string")
      .map((type) => type.trim().toLowerCase())
      .filter((type) => /^[a-z][a-z0-9-]{1,23}$/.test(type));

    sanitized.teamCardTypes = [...new Set(normalized)];
  }

  return sanitized;
}

function normalizeCard(card) {
  return {
    single: safeObject(card.single),
    left: safeObject(card.left),
    right: safeObject(card.right),
    pair: safeObject(card.pair),
  };
}

function normalizePressLog(rawLog) {
  if (!Array.isArray(rawLog)) {
    return [];
  }

  return rawLog
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const safeEntry = safeObject(entry);
      return {
        id: typeof safeEntry.id === "string" ? safeEntry.id : `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        timestamp: typeof safeEntry.timestamp === "string" ? safeEntry.timestamp : new Date().toISOString(),
        timeOfDay: typeof safeEntry.timeOfDay === "string" ? safeEntry.timeOfDay : "00:00:00",
        index: Number.isInteger(safeEntry.index) ? safeEntry.index : 0,
        lane: ["single", "left", "right", "pair"].includes(safeEntry.lane) ? safeEntry.lane : "single",
        cardType: typeof safeEntry.cardType === "string" ? safeEntry.cardType : "unknown",
        player: typeof safeEntry.player === "string" ? safeEntry.player : "Unknown",
        label: typeof safeEntry.label === "string" ? safeEntry.label : "",
      };
    });
}

function normalizeDatabase(raw) {
  const rawObject = safeObject(raw);

  if (rawObject.settings && rawObject.cards) {
    const settings = {
      ...DEFAULT_SETTINGS,
      ...sanitizeSettingsPatch(rawObject.settings),
    };

    if (settings.dual && settings.contestants % 2 !== 0) {
      settings.contestants += 1;
    }

    const cards = {};
    const sourceCards = safeObject(rawObject.cards);

    for (const [key, card] of Object.entries(sourceCards)) {
      cards[String(key)] = normalizeCard(card);
    }

    return {
      settings,
      cards,
      pressLog: normalizePressLog(rawObject.pressLog),
    };
  }

  const settings = {
    ...DEFAULT_SETTINGS,
    dual: typeof rawObject.dual === "boolean" ? rawObject.dual : DEFAULT_SETTINGS.dual,
    contestants: Number.isInteger(rawObject.contestants) ? rawObject.contestants : DEFAULT_SETTINGS.contestants,
    isLaughCounter:
      typeof rawObject.isLaughCounter === "boolean"
        ? rawObject.isLaughCounter
        : DEFAULT_SETTINGS.isLaughCounter,
    cardTypes: Array.isArray(rawObject.cardTypes)
      ? sanitizeSettingsPatch({ cardTypes: rawObject.cardTypes }).cardTypes || DEFAULT_SETTINGS.cardTypes
      : DEFAULT_SETTINGS.cardTypes,
    teamCardTypes: Array.isArray(rawObject.teamCardTypes)
      ? sanitizeSettingsPatch({ teamCardTypes: rawObject.teamCardTypes }).teamCardTypes || DEFAULT_SETTINGS.teamCardTypes
      : DEFAULT_SETTINGS.teamCardTypes,
  };

  if (settings.dual && settings.contestants % 2 !== 0) {
    settings.contestants += 1;
  }

  const cards = {};
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (!entry || typeof entry.index !== "number") {
        continue;
      }

      const card = normalizeCard({});
      const source = safeObject(entry);

      const singleKeys = ["isYellow", "isRed", "isBlack", "isWhite", "laughCounter", "Label", "picture"];
      const leftKeys = [
        "isYellowLeft",
        "isRedLeft",
        "isBlackLeft",
        "isWhiteLeft",
        "laughCounterLeft",
        "LabelLeft",
        "pictureLeft",
      ];
      const rightKeys = [
        "isYellowRight",
        "isRedRight",
        "isBlackRight",
        "isWhiteRight",
        "laughCounterRight",
        "LabelRight",
        "pictureRight",
      ];
      const pairKeys = ["isOrange1", "isOrange2"];

      for (const key of singleKeys) {
        if (source[key] !== undefined) {
          card.single[key] = source[key];
        }
      }
      for (const key of leftKeys) {
        if (source[key] !== undefined) {
          card.left[key] = source[key];
        }
      }
      for (const key of rightKeys) {
        if (source[key] !== undefined) {
          card.right[key] = source[key];
        }
      }
      for (const key of pairKeys) {
        if (source[key] !== undefined) {
          card.pair[key] = source[key];
        }
      }

      cards[String(entry.index)] = card;
    }
  }

  return {
    settings,
    cards,
    pressLog: [],
  };
}

function loadDatabase() {
  if (!fs.existsSync(databaseFilePath)) {
    const defaultDb = normalizeDatabase({});
    fs.writeFileSync(databaseFilePath, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }

  try {
    const data = fs.readFileSync(databaseFilePath, "utf8");
    return normalizeDatabase(JSON.parse(data));
  } catch (error) {
    console.error("Error reading database file:", error);
    const fallback = normalizeDatabase({});
    fs.writeFileSync(databaseFilePath, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(databaseFilePath, JSON.stringify(database, null, 2), "utf8");
  } catch (error) {
    console.error("Error saving database file:", error);
  }
}

function getCard(index) {
  const key = String(index);
  if (!database.cards[key]) {
    database.cards[key] = normalizeCard({});
  }
  return database.cards[key];
}

function buildPlayerName(index, lane) {
  if (lane === "left") {
    return `Player ${index * 2 + 1}`;
  }
  if (lane === "right") {
    return `Player ${index * 2 + 2}`;
  }
  if (lane === "pair") {
    return `Pair ${index + 1}`;
  }
  return `Player ${index + 1}`;
}

function buildLabelKey(lane) {
  if (lane === "single") {
    return "Label";
  }
  if (lane === "left") {
    return "LabelLeft";
  }
  if (lane === "right") {
    return "LabelRight";
  }
  return "";
}

function appendPressLogEntries(index, lane, previousCards, nextCards, stateForLabel) {
  const now = new Date();
  const timeOfDay = now.toLocaleTimeString("en-GB", { hour12: false });
  const player = buildPlayerName(index, lane);
  const labelKey = buildLabelKey(lane);
  const label = labelKey ? String(stateForLabel[labelKey] || "") : "";

  const pressedEntries = [];
  for (const [cardType, value] of Object.entries(nextCards)) {
    const wasPressed = Boolean(previousCards[cardType]);
    const isPressed = Boolean(value);
    if (!wasPressed && isPressed) {
      pressedEntries.push({
        id: `${now.getTime()}-${Math.round(Math.random() * 1e9)}`,
        timestamp: now.toISOString(),
        timeOfDay,
        index,
        lane,
        cardType,
        player,
        label,
      });
    }
  }

  if (pressedEntries.length === 0) {
    return;
  }

  const existingLog = Array.isArray(database.pressLog) ? database.pressLog : [];
  database.pressLog = [...pressedEntries, ...existingLog].slice(0, 500);
  io.emit("card:press-log:update", pressedEntries);
}

function clearUploadedImages() {
  if (!fs.existsSync(uploadsDir)) {
    return;
  }

  for (const fileName of fs.readdirSync(uploadsDir)) {
    const filePath = path.join(uploadsDir, fileName);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
    }
  }
}

ensureUploadsDir();
const database = loadDatabase();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

app.post("/uploadpicture", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl });
});

app.get("/api/settings", (_, res) => {
  res.json(database.settings);
});

app.put("/api/settings", (req, res) => {
  const patch = sanitizeSettingsPatch(safeObject(req.body));
  database.settings = { ...database.settings, ...patch };

  if (database.settings.dual && database.settings.contestants % 2 !== 0) {
    database.settings.contestants += 1;
  }

  saveDatabase();
  io.emit("settings:update", database.settings);
  res.json(database.settings);
});

app.use("/uploads", express.static(uploadsDir));
if (frontendDistDir) {
  app.use(express.static(frontendDistDir));

  app.get(["/", "/view"], (_, res) => {
    res.sendFile(path.join(frontendDistDir, "index.html"));
  });
} else {
  app.get(["/", "/view"], (_, res) => {
    res.status(503).send("Frontend is not built yet. Run: cd frontend && npm run build");
  });
}

io.on("connection", (socket) => {
  socket.emit("app:init", {
    settings: database.settings,
    pressLog: database.pressLog,
  });

  socket.on("settings:update", (patch) => {
    const safePatch = sanitizeSettingsPatch(safeObject(patch));
    database.settings = { ...database.settings, ...safePatch };

    if (database.settings.dual && database.settings.contestants % 2 !== 0) {
      database.settings.contestants += 1;
    }

    saveDatabase();
    io.emit("settings:update", database.settings);
  });

  socket.on("card:get", ({ index }) => {
    if (!Number.isInteger(index) || index < 0) {
      return;
    }

    socket.emit("card:state", {
      index,
      card: getCard(index),
    });
  });

  socket.on("card:update", ({ index, lane, patch }) => {
    if (!Number.isInteger(index) || index < 0) {
      return;
    }
    if (!["single", "left", "right"].includes(lane)) {
      return;
    }

    const safePatch = safeObject(patch);
    const card = getCard(index);
    const previousLaneState = safeObject(card[lane]);
    const previousCards = safeObject(previousLaneState.cards);
    card[lane] = { ...card[lane], ...safePatch };

    const nextLaneState = safeObject(card[lane]);
    const nextCards = safeObject(nextLaneState.cards);
    appendPressLogEntries(index, lane, previousCards, nextCards, nextLaneState);

    saveDatabase();

    io.emit("card:update", {
      index,
      lane,
      patch: card[lane],
    });
  });

  socket.on("pair:update", ({ index, patch }) => {
    if (!Number.isInteger(index) || index < 0) {
      return;
    }

    const safePatch = safeObject(patch);
    const card = getCard(index);
    const previousPairState = safeObject(card.pair);
    const previousCards = safeObject(previousPairState.cards);
    card.pair = { ...card.pair, ...safePatch };

    const nextPairState = safeObject(card.pair);
    const nextCards = safeObject(nextPairState.cards);
    appendPressLogEntries(index, "pair", previousCards, nextCards, nextPairState);

    saveDatabase();

    io.emit("pair:update", {
      index,
      patch: card.pair,
    });
  });

  socket.on("resetstats", () => {
    database.cards = {};
    database.pressLog = [];
    clearUploadedImages();
    saveDatabase();
    io.emit("cards:reset");
    io.emit("card:press-log", []);
  });

  socket.on("card:press-log:get", () => {
    socket.emit("card:press-log", Array.isArray(database.pressLog) ? database.pressLog : []);
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
