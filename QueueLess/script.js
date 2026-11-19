const STORAGE_KEY = "queuelessBookings";

let bookings = [];

try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    bookings = Array.isArray(stored) ? stored : [];
} catch {
    bookings = [];
}

const form = document.getElementById("bookingForm");
const bookingList = document.getElementById("bookingList");
const emptyMessage = document.getElementById("emptyMessage");

function saveBookings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function updateDashboard() {
    document.getElementById("totalBookings").textContent =
        bookings.length;

    document.getElementById("waitingCount").textContent =
        bookings.filter(b => b.status === "Waiting").length;

    document.getElementById("servingCount").textContent =
        bookings.filter(b => b.status === "In Service").length;

    document.getElementById("completedCount").textContent =
        bookings.filter(b => b.status === "Completed").length;
}

function renderBookings() {
    bookingList.innerHTML = "";

    const search = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const status = document.getElementById("statusFilter").value;

    const filtered = bookings.filter(booking => {
        const matchesSearch =
            booking.name.toLowerCase().includes(search) ||
            booking.token.toLowerCase().includes(search);

        const matchesStatus =
            status === "All" || booking.status === status;

        return matchesSearch && matchesStatus;
    });

    emptyMessage.style.display = filtered.length ? "none" : "block";

    filtered.forEach(booking => {
        const card = createElement(
            "article",
            "booking-card " + booking.status.toLowerCase().replace(" ", "-")
        );

        const title = createElement("h3", "", booking.name);

        const token = createElement(
            "span", "token", "Token: " + booking.token
        );

        const service = createElement(
            "p", "", "Service: " + booking.service
        );

        const date = createElement(
            "p", "", "Date: " + booking.date
        );

        const time = createElement(
            "p", "", "Time: " + booking.time
        );

        const position = createElement(
            "p", "", "Queue position: " + booking.position
        );

        const statusText = createElement(
            "p", "", "Status: " + booking.status
        );

        const actions = createElement("div", "booking-actions");

        const updateButton = createElement("button", "");

        updateButton.textContent =
            booking.status === "Waiting"
                ? "Start Service"
                : booking.status === "In Service"
                    ? "Complete"
                    : "Reset to Waiting";

        updateButton.addEventListener("click", () => {
            if (booking.status === "Waiting") {
                booking.status = "In Service";
            } else if (booking.status === "In Service") {
                booking.status = "Completed";
            } else {
                booking.status = "Waiting";
            }

            saveBookings();
            renderBookings();
        });

        const cancelButton = createElement(
            "button", "cancel-button", "Cancel"
        );

        cancelButton.disabled =
            booking.status === "Completed" ||
            booking.status === "Cancelled";

        cancelButton.addEventListener("click", () => {
            booking.status = "Cancelled";
            saveBookings();
            renderBookings();
        });

        actions.append(updateButton, cancelButton);

        card.append(
            title, token, service, date, time,
            position, statusText, actions
        );

        bookingList.appendChild(card);
    });

    updateDashboard();
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("customerName")
        .value.trim();

    const service = document.getElementById("service").value;
    const date = document.getElementById("appointmentDate").value;
    const time = document.getElementById("appointmentTime").value;

    if (!name || !service || !date || !time) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(date + "T00:00:00");

    if (selectedDate < today) {
        alert("Please select today or a future date.");
        return;
    }

    const sameSlot = bookings.some(booking =>
        booking.date === date &&
        booking.time === time &&
        booking.status !== "Cancelled"
    );

    if (sameSlot) {
        alert("This sample time slot is already booked. Please choose another.");
        return;
    }

    const tokenNumber = bookings.length + 1;

    const booking = {
        id: Date.now(),
        name,
        service,
        date,
        time,
        token: "Q" + String(tokenNumber).padStart(3, "0"),
        position: bookings.filter(b =>
            b.date === date &&
            b.status !== "Cancelled" &&
            b.status !== "Completed"
        ).length + 1,
        status: "Waiting"
    };

    bookings.push(booking);

    saveBookings();
    form.reset();
    renderBookings();
});

document.getElementById("searchInput")
    .addEventListener("input", renderBookings);

document.getElementById("statusFilter")
    .addEventListener("change", renderBookings);

const dateInput = document.getElementById("appointmentDate");
const todayString = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000
).toISOString().split("T")[0];

dateInput.min = todayString;

renderBookings();