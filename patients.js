// Firebase Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Config
const firebaseConfig = {
  apiKey: "AIzaSyDwCayQZ0JO6DjzQvAT6ToT33I4QXCS_NY",
  authDomain: "login-sample-c3af0.firebaseapp.com",
  projectId: "login-sample-c3af0",
  storageBucket: "login-sample-c3af0.appspot.com",
  messagingSenderId: "372688128666",
  appId: "1:372688128666:web:bbc529c73c4665f95f6d23"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.querySelector(".menu-icon").addEventListener("click", () => {
  document.getElementById("sidebarMenu").classList.toggle("active");
});

function toggleMenu() {
  document.getElementById("sidebarMenu").classList.toggle("active");
}


// UI references
const fullNameEl = document.getElementById("fullNameDisplay");
const specializationEl = document.getElementById("specializationDisplay");
const profileImageEl = document.getElementById("profileImage");
const appointmentTableBody = document.querySelector("tbody");

// Load doctor info
async function loadDoctorInfo(uid) {
  const docRef = doc(db, "doctors", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    fullNameEl.textContent = data.fullName || "No name";
    specializationEl.textContent = data.specialization || "No specialization";
    if (data.profileImageURL) {
      profileImageEl.src = data.profileImageURL;
    }
  }
}

import { query, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

async function loadAppointments(doctorUid) {
  const appointmentsRef = collection(db, "appointments");
  const q = query(appointmentsRef, where("doctorId", "==", doctorUid));
  const querySnapshot = await getDocs(q);

  appointmentTableBody.innerHTML = ""; // Clear existing table

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let count = 0;

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();

    // Extract and parse the appointment start time
    const [start, end] = data.appointmentDateTime.split(" - ");
    const startDate = new Date(start);

    // ❌ Skip if appointment already passed
    if (startDate < today) return;

    // ✅ Still upcoming — display it
    const formattedStart = startDate.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formattedStart} - ${end}</td>
      <td>${data.fullName}</td>
      <td>${data.reason || "N/A"}</td>
      <td><a href="patient-details.html?id=${docSnap.id}">View Details</a></td>
    `;
    appointmentTableBody.appendChild(row);
    count++;
  });

  if (count === 0) {
    appointmentTableBody.innerHTML = "<tr><td colspan='4' style='text-align: center; padding: 1em;'>No upcoming appointments found.</td></tr>";
  }
}



onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDoctorInfo(user.uid);
    loadAppointments(user.uid); // pass UID here
  } else {
    fullNameEl.textContent = "Not logged in";
    appointmentTableBody.innerHTML = "<tr><td colspan='4'>Please log in.</td></tr>";
  }
});
