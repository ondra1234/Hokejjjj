// script.js

// Připojení k socket.io serveru
const socket = io();

let globalData = null; // (trainingDates, players)

// HTML reference
const trainingDatesRow = document.getElementById("trainingDatesRow");
const playersCountRow = document.getElementById("playersCountRow");
const playersTbody = document.getElementById("playersTbody");
const playerSelect = document.getElementById("playerSelect");
const statsText = document.getElementById("statsText");

const adminNameInput = document.getElementById("adminName");
const adminPassInput = document.getElementById("adminPass");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminTools = document.getElementById("adminTools");

const addPlayerBtn = document.getElementById("addPlayerBtn");
const addTrainingDateBtn = document.getElementById("addTrainingDateBtn");

// Jednoduché přihlašovací údaje
const ADMIN_NAME = "admin";
const ADMIN_PASS = "admin";

// 1) Načteme data při startu aplikace
fetchData();

// 2) Když přijde událost "dataUpdated" přes Socket.IO, vezmeme nová data
socket.on("dataUpdated", (newData) => {
  globalData = newData;
  console.log("Přišla dataUpdated:", newData);
  renderAll();
});

/**
 * Načtení dat z našeho REST API (GET /api/attendance)
 */
async function fetchData() {
  try {
    const res = await fetch("/api/attendance");
    globalData = await res.json();
    console.log("Načtena data:", globalData);
    renderAll();
  } catch (err) {
    console.error("Chyba při načítání dat:", err);
  }
}

/**
 * Uložení dat (POST /api/attendance) – pošleme celé globalData
 */
async function postData(data) {
  try {
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    // Odpověď = { success: true }, a server následně vyvolá socket "dataUpdated"
  } catch (err) {
    console.error("Chyba při ukládání dat:", err);
  }
}

/**
 * Přerenderování celé tabulky a statistiky
 */
function renderAll() {
  if (!globalData) return;
  renderHeadings(globalData.trainingDates);
  renderPlayersTable(globalData.players, globalData.trainingDates);
  fillPlayerSelect(globalData.players);
}

/* ---------------------------------------
   3) Zobrazení hlavičky tabulky
      s (datum + čas) na dvou řádcích
      a řádkem, který hlásí: "Hráčů jde: X/Y"
   --------------------------------------- */
function renderHeadings(trainingDates) {
  trainingDatesRow.innerHTML = "";

  // První sloupec: "Hráč"
  const firstTh = document.createElement("th");
  firstTh.textContent = "Hráč / Datum";
  trainingDatesRow.appendChild(firstTh);

  // Pro každý termín -> TH s datumem a časem (rozděleným mezerou)
  trainingDates.forEach((fullStr) => {
    const [datePart, timePart] = fullStr.split(" ");
    const th = document.createElement("th");
    // Dvě řádky: <div>YYYY-MM-DD</div><div>HH:MM</div>
    th.innerHTML = `<div>${datePart}</div><div>${timePart}</div>`;
    trainingDatesRow.appendChild(th);
  });

  // Druhý (celý) řádek v THEAD: "Hráčů jde: X/Y"
  playersCountRow.innerHTML = "";
  const firstTd = document.createElement("td");
  firstTd.textContent = "Hráčů jde:";
  playersCountRow.appendChild(firstTd);

  // Každý sloupec – spočítáme, kolik hráčů "chce jít" (včetně náhradníků!)
  // a kolik je celkem hráčů
  trainingDates.forEach((fullStr) => {
    const td = document.createElement("td");
    // Spočítáme, kolik jich má "status=jdu"
    const totalPlayers = globalData.players.length;
    const { goingCount } = getOrderedPlayersForDate(fullStr);

    // Např. "3/10" (3 jdou z 10)
    td.textContent = `${goingCount}/${totalPlayers}`;
    playersCountRow.appendChild(td);
  });
}

/* ---------------------------------------
   4) Zobrazení těla tabulky (hráči)
      Každý řádek = 1 hráč, sloupce = tréninky
      Místo klikání => <select>
   --------------------------------------- */
function renderPlayersTable(players, trainingDates) {
  playersTbody.innerHTML = "";

  // Každý hráč => 1 <tr>
  players.forEach((player) => {
    const tr = document.createElement("tr");

    // 1) Buňka se jménem
    const nameTd = document.createElement("td");
    nameTd.textContent = player.name;
    tr.appendChild(nameTd);

    // 2) Buňky pro každý trénink
    trainingDates.forEach((fullStr) => {
      const td = document.createElement("td");

      // Stav z DB (status=jdu/nejdu, joinTs=timestamp)
      const attendance = player.attendance?.[fullStr] || {
        status: "nejdu",
        joinTs: null
      };

      // Ale musíme zjistit, jestli je hráč "top 20" nebo "nahradník X"
      // => getOrderedPlayersForDate() nám vrátí pole ve správném pořadí
      // a my podle indexu poznáme, jestli je to top 20, nahradník atd.

      const { orderedPlayers } = getOrderedPlayersForDate(fullStr);
      // Najdeme index hráče v orderedPlayers
      const idx = orderedPlayers.findIndex((p) => p.name === player.name);

      let displayStatus = "nejdu";
      let selectValue = "nejdu"; // co se zobrazí v selectu
      if (attendance.status === "jdu") {
        // Hráč chce jít (v DB)
        if (idx >= 0) {
          if (idx < 20) {
            // Patří do top 20 => "jdu"
            displayStatus = "jdu";
            selectValue = "jdu";
          } else {
            // Je "nahradník" => "nahradník X"
            const nahradnikPoradi = idx - 20 + 1;
            displayStatus = `nahradník ${nahradnikPoradi}`;
            selectValue = "jdu"; // v selectu to bude "jdu", ale v buňce zobrazíme "nahradník X"
          }
        }
      } else {
        // V DB je "nejdu"
        displayStatus = "nejdu"; 
        selectValue = "nejdu";
      }

      // Vytvoříme <select> s možnostmi ["nejdu", "jdu"]
      const selectEl = document.createElement("select");
      selectEl.classList.add("attendance-select");
      // Option NEJDU
      const optNejdu = document.createElement("option");
      optNejdu.value = "nejdu";
      optNejdu.textContent = "nejdu";
      // Option JDU
      const optJdu = document.createElement("option");
      optJdu.value = "jdu";
      optJdu.textContent = "jdu";

      selectEl.appendChild(optNejdu);
      selectEl.appendChild(optJdu);

      // Nastavíme vybranou hodnotu
      selectEl.value = selectValue;

      // Podbarvení (pokud je selectValue="jdu")
      if (selectValue === "jdu") {
        // Je to bud top 20 => .going, nebo nahradník => .going s textem "nahradník"
        td.classList.add("going");
      } else {
        td.classList.add("not-going");
      }

      // Do buňky nejdřív vložíme SELECT
      td.appendChild(selectEl);

      // Pod SELECT můžeme textem uvést "nahradník 1" atd. pokud je to nahradník
      if (displayStatus.startsWith("nahradník")) {
        const small = document.createElement("div");
        small.style.fontSize = "0.8rem";
        small.style.opacity = "0.7";
        td.classList.add("nahradnik");
        small.textContent = displayStatus; // např. "nahradník 1"
        td.appendChild(small);
      }

      // Reakce na změnu selectu => updateAttendance
      selectEl.addEventListener("change", () => {
        updateAttendance(player.name, fullStr, selectEl.value);
      });

      tr.appendChild(td);
    });

    playersTbody.appendChild(tr);
  });
}

/* 
  Funkce getOrderedPlayersForDate() vrací:
  {
    orderedPlayers: (všichni, kteří v DB mají status="jdu", seřazení podle joinTs),
    goingCount: celkový počet těch, co v DB mají status="jdu"
  }
  Tím zjistíme, kdo je v top 20 a kdo je "nahradník".
*/
function getOrderedPlayersForDate(fullStr) {
  // Sebereme všechny, co mají attendance[fullStr].status = "jdu"
  const jduList = [];
  globalData.players.forEach((p) => {
    const att = p.attendance?.[fullStr];
    if (att && att.status === "jdu") {
      jduList.push({
        name: p.name,
        joinTs: att.joinTs
      });
    }
  });
  // Seřadíme podle joinTs
  jduList.sort((a, b) => {
    return (a.joinTs || 0) - (b.joinTs || 0);
  });
  return {
    orderedPlayers: jduList,
    goingCount: jduList.length
  };
}

/* ---------------------------------------
   5) updateAttendance()
   Když uživatel změní v selectu "nejdu" -> "jdu" nebo naopak,
   uložíme to do DB:
   - status = "jdu"/"nejdu"
   - joinTs = Date.now() pokud "jdu", jinak null
--------------------------------------- */
function updateAttendance(playerName, trainingKey, newStatus) {
  if (!globalData) return;

  // Najdeme hráče
  const player = globalData.players.find((p) => p.name === playerName);
  if (!player) return;

  // Ujisti se, že attendance[trainingKey] existuje
  if (!player.attendance) {
    player.attendance = {};
  }
  if (!player.attendance[trainingKey]) {
    player.attendance[trainingKey] = { status: "nejdu", joinTs: null };
  }

  if (newStatus === "jdu") {
    // Nastav status="jdu", joinTs = Date.now()
    player.attendance[trainingKey].status = "jdu";
    player.attendance[trainingKey].joinTs = Date.now();
  } else {
    // "nejdu"
    player.attendance[trainingKey].status = "nejdu";
    player.attendance[trainingKey].joinTs = null;
  }

  // Po úpravě pošleme data do backendu
  postData(globalData);
}

/* ---------------------------------------
   6) Vyplnění <select> s hráči pro statistiky
--------------------------------------- */
function fillPlayerSelect(players) {
  playerSelect.innerHTML = "<option value=''>-- Vyber hráče --</option>";
  players.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = p.name;
    playerSelect.appendChild(opt);
  });
}

// Při změně hráče zobrazíme statistiku
playerSelect.addEventListener("change", () => {
  if (!globalData) return;
  const playerName = playerSelect.value;
  if (!playerName) {
    statsText.textContent = "Zde se zobrazí statistika účasti vybraného hráče.";
    return;
  }
  const player = globalData.players.find((p) => p.name === playerName);
  if (!player) return;

  // Spočítat, na kolika trénincích je "jdu" (byť třeba jako nahradník)
  let total = 0;
  let attended = 0;
  globalData.trainingDates.forEach((trainKey) => {
    total++;
    const att = player.attendance?.[trainKey];
    if (att && att.status === "jdu") {
      attended++;
    }
  });

  const percent = total ? ((attended / total) * 100).toFixed(1) : 0;
  statsText.textContent = `Hráč ${playerName} je "jdu" na ${attended} z ${total} tréninků. (${percent}%)`;
});

/* ---------------------------------------
   7) Odpočet do příštího tréninku
--------------------------------------- */
let trainingHour = 20; // Jen pro ukázku - definujeme "nejbližší čtvrtek 20:00"
const countdownElement = document.getElementById("countdown");
let nextTrainingDate = getNextTrainingDate();

function getNextTrainingDate() {
  const now = new Date();
  const result = new Date(now.getTime());
  while (result.getDay() !== 4) {
    result.setDate(result.getDate() + 1);
  }
  result.setHours(trainingHour, 0, 0, 0);
  if (result.getTime() < now.getTime()) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

function updateCountdown() {
  const now = Date.now();
  let distance = nextTrainingDate - now;
  if (distance < 0) {
    nextTrainingDate = getNextTrainingDate();
    distance = nextTrainingDate - now;
  }
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownElement.textContent = `${days}d:${hours}h:${minutes}m:${seconds}s`;
}
setInterval(updateCountdown, 1000);

/* ---------------------------------------
   8) Admin přihlášení
--------------------------------------- */
adminLoginBtn.addEventListener("click", () => {
  const nameVal = adminNameInput.value;
  const passVal = adminPassInput.value;
  if (nameVal === ADMIN_NAME && passVal === ADMIN_PASS) {
    adminTools.classList.remove("hidden");
  } else {
    alert("Nesprávné jméno nebo heslo!");
  }
});

/* ---------------------------------------
   9) Přidání nového hráče (Admin)
--------------------------------------- */
addPlayerBtn.addEventListener("click", () => {
  if (!globalData) return;
  const newName = prompt("Zadej jméno nového hráče:");
  if (!newName) return;

  // Zkontrolujeme, zda už hráč neexistuje
  const exists = globalData.players.some((p) => p.name.toLowerCase() === newName.toLowerCase());
  if (exists) {
    alert("Hráč s tímto jménem už existuje!");
    return;
  }

  // Vytvoříme nového hráče
  const newPlayer = {
    name: newName,
    attendance: {}
  };
  globalData.players.push(newPlayer);

  postData(globalData);
});

/* ---------------------------------------
   10) Přidání nového tréninku (Admin)
   Zadáváme "YYYY-MM-DD HH:MM"
--------------------------------------- */
addTrainingDateBtn.addEventListener("click", () => {
  if (!globalData) return;
  const newDateTime = prompt("Zadej datum a čas (např. 2025-02-03 19:30):");
  if (!newDateTime) return;
  // Příklad validace (velmi jednoduchá)
  // if (!/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(newDateTime)) { ... }

  // Zkontroluj, zda tento trénink už neexistuje
  if (globalData.trainingDates.includes(newDateTime)) {
    alert("Tento trénink už v seznamu je!");
    return;
  }

  globalData.trainingDates.push(newDateTime);
  // Seřadit je možné taky, ale museli bychom je seřadit jako řetězce
  // globalData.trainingDates.sort();

  // Všem hráčům => attendance[newDateTime] = {status: "nejdu", joinTs: null} (lze i dynamicky)
  // Ale není nutné – až hráč poprvé změní select, teprve se vytvoří.

  postData(globalData);
});
