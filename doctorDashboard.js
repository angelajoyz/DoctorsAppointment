import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwCayQZ0JO6DjzQvAT6ToT33I4QXCS_NY",
  authDomain: "login-sample-c3af0.firebaseapp.com",
  projectId: "login-sample-c3af0",
  storageBucket: "login-sample-c3af0.appspot.com",
  messagingSenderId: "372688128666",
  appId: "1:372688128666:web:bbc529c73c4665f95f6d23",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

const fullNameEl = document.getElementById("fullNameDisplay");
const specializationEl = document.getElementById("specializationDisplay");
const profileImageEl = document.getElementById("profileImage");
const appointmentTableBody = document.querySelector("tbody");
const notificationDropdown = document.getElementById("notificationDropdown");
const notificationCount = document.getElementById("notificationCount");

function toggleMenu() {
  document.getElementById('hiddenMenu').classList.toggle('active');
}
window.toggleMenu = toggleMenu;

async function loadDoctorInfo(doctorId) {
  try {
    const docRef = doc(db, "doctors", doctorId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      fullNameEl.textContent = data.fullName || "No name found";
      specializationEl.textContent = data.specialization || "No specialization found";
      if (data.profileImageUrl) {
        profileImageEl.src = data.profileImageUrl;
      }
    } else {
      fullNameEl.textContent = "Doctor not found";
      specializationEl.textContent = "";
    }
  } catch (error) {
    console.error("Error fetching doctor info:", error);
  }
}

// Utility to get YYYY-MM-DD from a Date object
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Keep only this loadAppointments function (merged and fixed)
async function loadAppointments(doctorId) {
  try {
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("doctorId", "==", doctorId));
    const querySnapshot = await getDocs(q);

    appointmentTableBody.innerHTML = "";
    notificationDropdown.innerHTML = "";
    let upcomingCount = 0;
    let hasAppointments = false;

    const now = new Date();
    const highlightedDates = new Set();

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const dateObj = data.appointmentDateTime?.toDate?.() || new Date(data.appointmentDateTime);

      if (dateObj < now) return;

      hasAppointments = true;

      // Collect dates with appointments for calendar highlight
      highlightedDates.add(formatDate(dateObj));

      // Append row to appointment table
      const row = document.createElement("tr");
      row.innerHTML = `
        
        <td>${data.fullName || "N/A"}</td>
        <td>${data.reason || "N/A"}</td>
        <td><a href="patient-details.html?id=${doc.id}">View Details</a></td>
      `;
      appointmentTableBody.appendChild(row);

      // Notifications for tomorrow's appointments
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);

      if (
        dateObj.getDate() === tomorrow.getDate() &&
        dateObj.getMonth() === tomorrow.getMonth() &&
        dateObj.getFullYear() === tomorrow.getFullYear()
      ) {
        upcomingCount++;
        const notifItem = document.createElement("div");
        notifItem.classList.add("notification-item");
        notifItem.innerHTML = `
          <strong>${data.fullName}</strong> has an appointment<br/>
          <small>${dateObj.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</small>
        `;
        notificationDropdown.appendChild(notifItem);
      }
    });

    // Render calendar with appointment events
renderFullCalendar(querySnapshot.docs.map(doc => doc.data()));

    if (!hasAppointments) {
      appointmentTableBody.innerHTML =
        "<tr><td colspan='4' style='text-align:center;'>No appointment request</td></tr>";
    }

    notificationCount.textContent = upcomingCount;
    notificationCount.style.display = upcomingCount > 0 ? "inline-block" : "none";
  } catch (error) {
    console.error("Error loading appointments:", error);
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDoctorInfo(user.uid);
    loadAppointments(user.uid);
  } else {
    fullNameEl.textContent = "Please log in";
    specializationEl.textContent = "";
    appointmentTableBody.innerHTML =
      "<tr><td colspan='4'>You must be logged in to view appointments.</td></tr>";
  }
});

const calendarEl = document.getElementById('calendar');

let calendar; // global so we can manipulate it later

function renderFullCalendar(appointments) {
  const calendarEl = document.getElementById('calendar');

  // Convert appointment dates to FullCalendar event format
  const events = appointments.map(app => ({
    title: app.fullName || "Appointment",
start: app.appointmentDateTime?.toDate?.().toISOString?.() || null,
    allDay: true
  }));

  // If calendar already exists, destroy and re-render
  if (calendar) {
    calendar.destroy();
  }

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    events: events,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
  });

  calendar.render();
}

