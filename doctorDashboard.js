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

// Load doctor info
async function loadDoctorInfo(uid) {
  const docRef = doc(db, "doctors", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    fullNameEl.textContent = data.fullName || "No name";
    specializationEl.textContent = data.specialization || "No specialization";
    const profileImage = doctor.profileImageURL || "doctor1.png";

  }
}

// Utility to get YYYY-MM-DD from a Date object
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Keep only this loadAppointments function (merged and fixed)
async function loadAppointments(doctorId) {
  try {
    const appointmentsRef = collection(db, "approved"); // 👈 Changed from "appointments"
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

      highlightedDates.add(formatDate(dateObj));

      // Table row
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.fullName || "N/A"}</td>
        <td>${data.reason || "N/A"}</td>
        <td><a href="patient-details.html?id=${doc.id}">View Details</a></td>
      `;
      appointmentTableBody.appendChild(row);

      // Notifications
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

    renderFullCalendar(querySnapshot.docs);

    if (!hasAppointments) {
      appointmentTableBody.innerHTML =
        "<tr><td colspan='4' style='text-align:center;'>No appointment request</td></tr>";
    }

    notificationCount.textContent = upcomingCount;
    notificationCount.style.display = upcomingCount > 0 ? "inline-block" : "none";
  } catch (error) {
    console.error("Error loading approved appointments:", error);
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

function renderFullCalendar(appointmentDocs) {
  const allAppointments = appointmentDocs.map((doc) => {
    const data = doc.data();
    const dateObj = data.appointmentDateTime?.toDate?.() || new Date(data.appointmentDateTime);
    return {
  id: doc.id,
  title: ' ', // invisible title
start: toLocalDateString(dateObj),
  allDay: true,
  display: 'background', // Highlight background only
  backgroundColor: '#32CD32', // LimeGreen for full-day highlight
  extendedProps: {
    fullName: data.fullName,
    reason: data.reason,
    date: dateObj.toDateString(),
    time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
};


  });

  if (calendar) calendar.destroy();

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 'auto',
    contentHeight: 'auto',
    aspectRatio: 2, // Controls width vs height (try 1.5–2.5)
    events: allAppointments,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
  

    },
    dateClick: function(info) {
      displayAppointmentsForDate(info.dateStr, allAppointments);
    }
    
  });

  calendar.render();

  // Show today's appointments on load if no date is clicked
const todayStr = formatDate(new Date());
displayAppointmentsForDate(todayStr, allAppointments);

}


function displayAppointmentsForDate(dateStr, allAppointments) {
  const targetDate = new Date(dateStr);
  targetDate.setHours(0, 0, 0, 0);

  appointmentTableBody.innerHTML = "";

  const matches = allAppointments.filter(event => {
    const eventDate = new Date(event.start);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === targetDate.getTime();
  });

  if (matches.length === 0) {
    appointmentTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No appointment</td></tr>";
    return;
  }

  matches.sort((a, b) => new Date(a.start) - new Date(b.start)); // Sort by time

  for (const appt of matches) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${appt.extendedProps.fullName}</td>
      <td>${appt.extendedProps.reason}</td>
      <td>${appt.extendedProps.time}</td>
      <td><a href="patient-details.html?id=${appt.id}">View Details</a></td>
    `;
    appointmentTableBody.appendChild(row);
  }
}
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

