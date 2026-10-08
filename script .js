const CITIES = ["Chennai", "Madurai", "Coimbatore", "Trichy", "Theni", "Bengaluru", "Tirunelveli", "Salem"];
const ROWS = 10;
const COLUMNS = ["A", "B", null, "C", "D"]; // null = aisle
const MAX_SEATS = 4;

const fromSel = document.getElementById("from");
const toSel = document.getElementById("to");
const dateInput = document.getElementById("date");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const errorBox = document.getElementById("error");
const seatMap = document.getElementById("seat-map");
const confirmBtn = document.getElementById("confirm-btn");

const bookingView = document.getElementById("booking-view");
const ticketView = document.getElementById("ticket-view");

let selected = [];

/* ---------- helpers ---------- */

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function tripKey() {
  return fromSel.value + "|" + toSel.value + "|" + dateInput.value;
}

// Same route + date always gives the same fare
function getFare() {
  const pair = [fromSel.value, toSel.value].sort().join("-");
  return 300 + (hash(pair) % 9) * 50; // 300 to 700
}

// Pretend some seats are already taken (stable for a given trip)
function demoBookedSeats() {
  const seats = [];
  const seed = hash(tripKey());
  for (let r = 1; r <= ROWS; r++) {
    COLUMNS.forEach((col, i) => {
      if (!col) return;
      if ((seed + r * 7 + i * 13) % 5 === 0) seats.push(r + col);
    });
  }
  return seats;
}

function getSavedBookings() {
  return JSON.parse(localStorage.getItem("bus-bookings")) || {};
}

function bookedSeats() {
  const saved = getSavedBookings()[tripKey()] || [];
  return [...demoBookedSeats(), ...saved];
}

function formatDate(str) {
  return new Date(str + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.hidden = !msg;
}

/* ---------- rendering ---------- */

function fillCities() {
  CITIES.forEach((c) => {
    fromSel.add(new Option(c, c));
    toSel.add(new Option(c, c));
  });
  fromSel.value = CITIES[0];
  toSel.value = CITIES[1];
}

function renderSeats() {
  seatMap.innerHTML = "";
  const taken = bookedSeats();

  for (let r = 1; r <= ROWS; r++) {
    COLUMNS.forEach((col) => {
      if (!col) {
        seatMap.appendChild(document.createElement("span"));
        return;
      }
      const id = r + col;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "seat" + (col === "A" || col === "D" ? " window" : "");
      btn.textContent = id;
      btn.setAttribute("aria-label", "Seat " + id);

      if (taken.includes(id)) {
        btn.disabled = true;
      } else {
        if (selected.includes(id)) btn.classList.add("selected");
        btn.addEventListener("click", () => toggleSeat(id));
      }
      seatMap.appendChild(btn);
    });
  }
}

function renderSummary() {
  const same = fromSel.value === toSel.value;
  document.getElementById("sum-route").textContent = same ? "-" : fromSel.value + " to " + toSel.value;
  document.getElementById("sum-date").textContent = dateInput.value ? formatDate(dateInput.value) : "-";
  document.getElementById("sum-seats").textContent = selected.length ? selected.join(", ") : "None selected";
  document.getElementById("sum-fare").textContent = same ? "-" : "₹" + getFare();
  document.getElementById("sum-total").textContent = "₹" + (same ? 0 : selected.length * getFare());
}

function refresh() {
  renderSeats();
  renderSummary();
}

/* ---------- actions ---------- */

function toggleSeat(id) {
  if (selected.includes(id)) {
    selected = selected.filter((s) => s !== id);
  } else {
    if (selected.length >= MAX_SEATS) {
      showError("You can book up to " + MAX_SEATS + " seats at a time.");
      return;
    }
    selected.push(id);
  }
  showError("");
  refresh();
}

function onTripChange() {
  selected = []; // seats belong to a specific trip
  showError("");
  refresh();
}

function validate() {
  if (fromSel.value === toSel.value) return "Choose different cities for From and To.";
  if (!dateInput.value) return "Select a travel date.";
  if (dateInput.value < todayStr()) return "Travel date cannot be in the past.";
  if (nameInput.value.trim().length < 2) return "Enter the passenger name.";
  if (!/^[6-9]\d{9}$/.test(phoneInput.value)) return "Enter a valid 10-digit mobile number.";
  if (selected.length === 0) return "Select at least one seat.";
  return "";
}

function confirmBooking() {
  const problem = validate();
  if (problem) {
    showError(problem);
    return;
  }

  // Save seats so they show as booked next time
  const all = getSavedBookings();
  const key = tripKey();
  all[key] = [...(all[key] || []), ...selected];
  localStorage.setItem("bus-bookings", JSON.stringify(all));

  showTicket();
}

function launchConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#7c4dff", "#ff4fa3", "#ff9a3c", "#12c2a5", "#ffd23f"];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[i % colors.length];
    piece.style.animationDuration = 2 + Math.random() * 2 + "s";
    piece.style.animationDelay = Math.random() * 0.6 + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 5000);
  }
}

function showTicket() {
  const id = "BK" + Date.now().toString().slice(-8);

  document.getElementById("t-id").textContent = id;
  document.getElementById("t-from").textContent = fromSel.value;
  document.getElementById("t-to").textContent = toSel.value;
  document.getElementById("t-name").textContent = nameInput.value.trim();
  document.getElementById("t-phone").textContent = phoneInput.value;
  document.getElementById("t-date").textContent = formatDate(dateInput.value);
  document.getElementById("t-seats").textContent = selected.join(", ");
  document.getElementById("t-total").textContent = "₹" + selected.length * getFare();

  bookingView.hidden = true;
  ticketView.hidden = false;
  window.scrollTo(0, 0);
  launchConfetti();
}

function newBooking() {
  selected = [];
  nameInput.value = "";
  phoneInput.value = "";
  showError("");
  ticketView.hidden = true;
  bookingView.hidden = false;
  refresh();
}

/* ---------- init ---------- */

fillCities();
dateInput.min = todayStr();
dateInput.value = todayStr();

[fromSel, toSel, dateInput].forEach((el) => el.addEventListener("change", onTripChange));
phoneInput.addEventListener("input", () => {
  phoneInput.value = phoneInput.value.replace(/\D/g, "");
});
confirmBtn.addEventListener("click", confirmBooking);
document.getElementById("print-btn").addEventListener("click", () => window.print());
document.getElementById("new-btn").addEventListener("click", newBooking);

refresh();
