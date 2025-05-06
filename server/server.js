const express = require('express');
const multer = require("multer");
const fs = require('fs')
const path = require("path");
const app = express();
const http = require('http')
const {Server} = require('socket.io')
const cors  = require('cors')

app.use(cors())
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
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

app.post("/uploadpicture", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate a URL for the uploaded file
    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
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

const port = 3000;

const database = []
database.dual = true;
database.contestants = 8

io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`)
  socket.emit("dual", {dual: database.dual})
  socket.emit("contestants", {contestants: database.contestants})

  socket.on("yellow", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isYellow = data.isYellow; // Update existing entry
    } else {
      database.push({ index: data.index, isYellow: data.isYellow }); // Add new entry
    }
    console.log("Updated database:", database);
  })
  socket.on("yellowleft", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isYellowLeft = data.isYellowLeft; // Update existing entry
    } else {
      database.push({ index: data.index, isYellowLeft: data.isYellowLeft }); // Add new entry
    }
    console.log("Updated database:", database);
  })
  socket.on("yellowright", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isYellowRight = data.isYellowRight; // Update existing entry
    } else {
      database.push({ index: data.index, isYellowRight: data.isYellowRight }); // Add new entry
    }
    console.log("Updated database:", database);
  })

  socket.on("red", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isRed = data.isRed; // Update existing entry
    } else {
      database.push({ index: data.index, isRed: data.isRed }); // Add new entry
    }
    console.log("Updated database:", database);
  })
  socket.on("redleft", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isRedLeft = data.isRedLeft; // Update existing entry
    } else {
      database.push({ index: data.index, isRedLeft: data.isRedLeft }); // Add new entry
    }
    console.log("Updated database:", database);
  })
  socket.on("redright", (data) => {
    io.emit("receiveinfo", data);
    console.log(data)
    const existingEntry = database.find((entry) => entry.index === data.index);
    if (existingEntry) {
      existingEntry.isRedRight = data.isRedRight; // Update existing entry
    } else {
      database.push({ index: data.index, isRedRight: data.isRedRight }); // Add new entry
    }
    console.log("Updated database:", database);
  })

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

    io.emit("resetstats");
  });

  socket.on("dual", (data) => {
    database.dual = data.dual
    socket.broadcast.emit("dual", data)
  })

  socket.on("contestants", (data) => {
    database.contestants = data.contestants
    socket.broadcast.emit("contestants", data)
  })

  socket.on("updatepicture", (data) => {
    console.log("updating picture")
    const { index, picture } = data;
    console.log(`Updating picture for index: ${index}`)
    const entry = database.find((entry) => entry.index === index);
    if (entry) {
        entry.picture = picture; // Update the picture in the database
    } else {
        database.push({ index, picture }); // Add a new entry if it doesn't exist
    }
    io.emit("receiveinfo", { index, picture }); // Broadcast the updated picture
  });

  socket.on("updatepictureleft", (data) => {
    const { index, picture } = data;
    console.log(`Updating picture left for index: ${index}`)
    const entry = database.find((entry) => entry.index === index);
    if (entry) {
        entry.pictureLeft = picture;
    } else {
        database.push({ index, pictureLeft: picture });
    }
    io.emit("receiveinfo", { index, pictureLeft: picture });
  });

  socket.on("updatepictureright", (data) => {
    const { index, picture } = data;
    console.log(`Updating picture right for index: ${index}`)
    const entry = database.find((entry) => entry.index === index);
    if (entry) {
        entry.pictureRight = picture;
    } else {
        database.push({ index, pictureRight: picture });
    }
    io.emit("receiveinfo", { index, pictureRight: picture });
  });

}
)

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});