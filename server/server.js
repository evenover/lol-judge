const express = require('express');
const multer = require("multer");
const fs = require('fs')
const path = require("path");
const os = require("os"); // Add this line to import the os module
const app = express();
const http = require('http')
const {Server} = require('socket.io')
const cors  = require('cors')

app.use(cors())
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },

})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files to the "uploads" folder
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Extract the file extension
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName); // Save the file with a unique name and its original extension
    },
});

const upload = multer({ storage }); // Use the custom storage configuration

// Function to get the server's IP address
function getServerIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address; // Return the first non-internal IPv4 address
            }
        }
    }
    return "localhost"; // Fallback to localhost if no external IP is found
}

// Use the dynamic IP address in the file URL
app.post("/uploadpicture", upload.single("file"), (req, res) => {
    console.log("File upload request received");

    if (!req.file) {
        console.error("No file uploaded");
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded file details:", req.file);

    const serverIp = getServerIp(); // Get the server's IP address
    const filePath = path.join(__dirname, "uploads", req.file.filename);

    if (!fs.existsSync(filePath)) {
        console.error("File not found after upload:", filePath);
        return res.status(404).json({ error: "File not found after upload" });
    }

    const fileUrl = `http://${serverIp}:3000/uploads/${req.file.filename}`; // Use the IP address in the URL
    console.log("File uploaded successfully. URL:", fileUrl);
    res.json({ url: fileUrl });
});

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

app.get('/view', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
  }
});

const port = 3000;

const databaseFilePath = path.join(__dirname, "database.json");

// Function to load the database from the JSON file
function loadDatabase() {
    if (fs.existsSync(databaseFilePath)) {
        try {
            const data = fs.readFileSync(databaseFilePath, "utf8");
            return JSON.parse(data);
        } catch (err) {
            console.error("Error reading database file:", err);
        }
    }
    return []; // Return an empty array if the file doesn't exist or fails to load
}

// Function to save the database to the JSON file
function saveDatabase() {
    try {
        fs.writeFileSync(databaseFilePath, JSON.stringify(database, null, 2), "utf8");
        console.log("Database saved successfully.");
    } catch (err) {
        console.error("Error saving database file:", err);
    }
}

// Load the database when the server starts
const database = loadDatabase();
database.dual = database.dual || true;
database.contestants = database.contestants || 8;

io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);
  socket.emit("dual", { dual: database.dual });
  socket.emit("contestants", { contestants: database.contestants });

  socket.on("yellow", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isYellow = data.isYellow;
      } else {
        database.push({ index: data.index, isYellow: data.isYellow });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in yellow event handler:", error);
    }
  });

  socket.on("yellowleft", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isYellowLeft = data.isYellowLeft;
      } else {
        database.push({ index: data.index, isYellowLeft: data.isYellowLeft });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in yellowleft event handler:", error);
    }
  });

  socket.on("yellowright", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isYellowRight = data.isYellowRight;
      } else {
        database.push({ index: data.index, isYellowRight: data.isYellowRight });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in yellowright event handler:", error);
    }
  });

  socket.on("red", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isRed = data.isRed;
      } else {
        database.push({ index: data.index, isRed: data.isRed });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in red event handler:", error);
    }
  });

  socket.on("redleft", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isRedLeft = data.isRedLeft;
      } else {
        database.push({ index: data.index, isRedLeft: data.isRedLeft });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in redleft event handler:", error);
    }
  });

  socket.on("redright", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isRedRight = data.isRedRight;
      } else {
        database.push({ index: data.index, isRedRight: data.isRedRight });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in redright event handler:", error);
    }
  });

  socket.on("black", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isBlack = data.isBlack;
      } else {
        database.push({ index: data.index, isBlack: data.isBlack });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in black event handler:", error);
    }
  });

  socket.on("blackleft", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isBlackLeft = data.isBlackLeft;
      } else {
        database.push({ index: data.index, isBlackLeft: data.isBlackLeft });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in blackleft event handler:", error);
    }
  });

  socket.on("blackright", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isBlackRight = data.isBlackRight;
      } else {
        database.push({ index: data.index, isBlackRight: data.isBlackRight });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in blackright event handler:", error);
    }
  });

  socket.on("white", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isWhite = data.isWhite;
      } else {
        database.push({ index: data.index, isWhite: data.isWhite });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in white event handler:", error);
    }
  });

  socket.on("whiteleft", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isWhiteLeft = data.isWhiteLeft;
      } else {
        database.push({ index: data.index, isWhiteLeft: data.isWhiteLeft });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in whiteleft event handler:", error);
    }
  });

  socket.on("whiteright", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isWhiteRight = data.isWhiteRight;
      } else {
        database.push({ index: data.index, isWhiteRight: data.isWhiteRight });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in whiteright event handler:", error);
    }
  });
  socket.on("orange1", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange1 = data.isOrange1;
      } else {
        database.push({ index: data.index, isOrange1: data.isOrange1 });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange1 event handler:", error);
    }
  });

  socket.on("orange1left", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange1Left = data.isOrange1Left;
      } else {
        database.push({ index: data.index, isOrange1Left: data.isOrange1Left });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange1left event handler:", error);
    }
  });

  socket.on("orange1right", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange1Right = data.isOrange1Right;
      } else {
        database.push({ index: data.index, isOrange1Right: data.isOrange1Right });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange1right event handler:", error);
    }
  });
  socket.on("orange2", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange2 = data.isOrange2;
      } else {
        database.push({ index: data.index, isOrange2: data.isOrange2 });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange2 event handler:", error);
    }
  });

  socket.on("orange2left", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange2Left = data.isOrange2Left;
      } else {
        database.push({ index: data.index, isOrange2Left: data.isOrange2Left });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange2left event handler:", error);
    }
  });

  socket.on("orange2right", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.isOrange2Right = data.isOrange2Right;
      } else {
        database.push({ index: data.index, isOrange2Right: data.isOrange2Right });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in orange2right event handler:", error);
    }
  });
  socket.on("updateLabel", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.Label = data.Label;
      } else {
        database.push({ index: data.index, Label: data.Label });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in label event handler:", error);
    }
  });

  socket.on("updateLabelLeft", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.LabelLeft = data.LabelLeft;
      } else {
        database.push({ index: data.index, LabelLeft: data.LabelLeft });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in labelleft event handler:", error);
    }
  });

  socket.on("updateLabelRight", (data) => {
    try {
      io.emit("receiveinfo", data);
      console.log(data);
      const existingEntry = database.find((entry) => entry.index === data.index);
      if (existingEntry) {
        existingEntry.LabelRight = data.LabelRight;
      } else {
        database.push({ index: data.index, LabelRight: data.LabelRight });
      }
      console.log("Updated database:", database);
      saveDatabase();
    } catch (error) {
      console.error("Error in labelright event handler:", error);
    }
  });

  socket.on("contestants", (data) => {
    try {
      database.contestants = data.contestants;
      socket.broadcast.emit("contestants", data);
      saveDatabase();
    } catch (error) {
      console.error("Error in contestants event handler:", error);
    }
  });

  socket.on("updatepicture", (data) => {
    try {
      console.log("updating picture");
      const { index, picture } = data;
      console.log(`Updating picture for index: ${index}`);
      const entry = database.find((entry) => entry.index === index);
      if (entry) {
        entry.picture = picture;
      } else {
        database.push({ index, picture });
      }
      io.emit("receiveinfo", { index, picture });
      saveDatabase();
    } catch (error) {
      console.error("Error in updatepicture event handler:", error);
    }
  });

  socket.on("updatepictureleft", (data) => {
    try {
      const { index, picture } = data;
      console.log(`Updating picture left for index: ${index}`);
      const entry = database.find((entry) => entry.index === index);
      if (entry) {
        entry.pictureLeft = picture;
      } else {
        database.push({ index, pictureLeft: picture });
      }
      io.emit("receiveinfo", { index, pictureLeft: picture });
      saveDatabase();
    } catch (error) {
      console.error("Error in updatepictureleft event handler:", error);
    }
  });

  socket.on("updatepictureright", (data) => {
    try {
      const { index, picture } = data;
      console.log(`Updating picture right for index: ${index}`);
      const entry = database.find((entry) => entry.index === index);
      if (entry) {
        entry.pictureRight = picture;
      } else {
        database.push({ index, pictureRight: picture });
      }
      io.emit("receiveinfo", { index, pictureRight: picture });
      saveDatabase();
    } catch (error) {
      console.error("Error in updatepictureright event handler:", error);
    }
  });
  socket.on("getinfo", (data) => {
    console.log("Getinfo event received:", data);

    // Find the entry in the database that matches the provided index
    const entry = database.find((entry) => entry.index === data.index);

    // Emit the entry back to the client
    if (entry) {
        io.emit("receiveinfo", entry);
    } else {
        io.emit("receiveinfo", { error: "No data found for the given index" });
    }
  });

  socket.on("resetstats", () => {
    database.length = 0;

    // Delete all files in the "uploads" folder
    const uploadsDir = path.join(__dirname, "uploads");
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error("Error reading uploads directory:", err);
            return;
        }

        for (const file of files) {
            const filePath = path.join(uploadsDir, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file}:`, err);
                } else {
                    console.log(`Deleted file: ${file}`);
                }
            });
        }
    });

    // Save an empty array to the JSON file
    saveDatabase();

    io.emit("resetstats");
  });

  socket.on("dual", (data) => {
    database.dual = data.dual
    socket.broadcast.emit("dual", data)
    saveDatabase(); // Save the updated database
  })
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});