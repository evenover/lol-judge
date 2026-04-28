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

    return { settings, cards };
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

  return { settings, cards };
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
    card[lane] = { ...card[lane], ...safePatch };
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
    card.pair = { ...card.pair, ...safePatch };
    saveDatabase();

    io.emit("pair:update", {
      index,
      patch: card.pair,
    });
  });

  socket.on("resetstats", () => {
    database.cards = {};
    clearUploadedImages();
    saveDatabase();
    io.emit("cards:reset");
  });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
