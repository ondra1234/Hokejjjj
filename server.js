// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Cesta k souboru s daty
const DATA_FILE = path.join(__dirname, "data.json");

/**
 * Načtení dat ze souboru data.json
 */
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    // Pokud soubor neexistuje, vrátíme nějakou výchozí strukturu
    return {
      trainingDates: [],
      players: []
    };
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

/**
 * Uložení dat do souboru data.json
 */
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Slouží statické soubory z "public" (index.html, style.css, script.js...)
app.use(express.static(path.join(__dirname, "public")));
// Abychom mohli číst JSON v těle requestu (např. z REST API)
app.use(express.json());

/* ------------------------------------------
   1) REST API pro čtení a zápis dat
   ------------------------------------------ */

// [GET] /api/attendance – vrátí veškerá data
app.get("/api/attendance", (req, res) => {
  const data = loadData();
  res.json(data);
});

// [POST] /api/attendance – nastaví nová data (přepíše data.json)
app.post("/api/attendance", (req, res) => {
  const newData = req.body;
  saveData(newData);
  // Po uložení vyvoláme na Socket.IO událost "dataUpdated"
  io.emit("dataUpdated", newData);
  res.json({ success: true });
});

/* ------------------------------------------
   2) Socket.IO pro realtime notifikace
   ------------------------------------------ */
io.on("connection", (socket) => {
  console.log("Klient připojen:", socket.id);

  socket.on("disconnect", () => {
    console.log("Klient odpojen:", socket.id);
  });

  // Případně další eventy, pokud by frontend něco posílal
});

/* ------------------------------------------
   3) Spuštění serveru
   ------------------------------------------ */
server.listen(PORT, () => {
  console.log(`Server běží na portu ${PORT}`);
});
