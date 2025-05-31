const firebaseConfig = {
  apiKey: "AIzaSyDwCayQZ0JO6DjzQvAT6ToT33I4QXCS_NY",
  authDomain: "login-sample-c3af0.firebaseapp.com",
  projectId: "login-sample-c3af0",
  storageBucket: "login-sample-c3af0.appspot.com",
  messagingSenderId: "372688128666",
  appId: "1:372688128666:web:bbc529c73c4665f95f6d23"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Regex validation
function validateReferenceNumber(referenceNumber) {
  return /^\d{13}$/.test(referenceNumber);
}

// Image preview
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 2 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    alert("Please upload a valid image file (JPEG, PNG, GIF).");
    return;
  }

  if (file.size > maxSize) {
    alert("File size exceeds 2MB.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("modalImage").src = e.target.result;
    document.getElementById("openModalBtn").style.display = "inline-block";
  };
  reader.readAsDataURL(file);
}

// Step navigation
function prevStep(step) {
  document.getElementById(`step${step + 1}`).classList.add("hidden");
  document.getElementById(`step${step}`).classList.remove("hidden");
}

function nextStep(step) {
  const inputs = document.querySelectorAll(`#step${step} input, #step${step} select`);
  for (let input of inputs) {
    if (!input.value || (input.tagName === "SELECT" && input.selectedIndex === 0)) {
      alert('Please complete all required fields before proceeding.');
      return;
    }
  }
  document.getElementById(`step${step}`).classList.add("hidden");
  document.getElementById(`step${step + 1}`).classList.remove("hidden");
}

function updateFee() {
  const reason = document.getElementById("appointmentReason").value;
  let fee = { Consultation: 150, "Check-up": 100, "Follow-up": 120 }[reason] || 0;
  document.getElementById("feeAmount").value = fee;
  document.getElementById("displayFee").value = `₱${fee}`;
}

// Confirm appointment
function confirmAppointment() {
  const inputs = document.querySelectorAll('#step2 input:not([type="checkbox"]), #step2 select');
  for (let input of inputs) {
    if (!input.value || (input.tagName === "SELECT" && input.selectedIndex === 0)) {
      alert('Please complete all required fields.');
      return;
    }
  }

  const paymentConfirmed = document.getElementById("paymentConfirmed").checked;
  const noRefundAccepted = document.getElementById("noRefundAccepted").checked;
  if (!paymentConfirmed || !noRefundAccepted) {
    alert("Please confirm payment and refund agreement.");
    return;
  }

  const email = document.getElementById("email").value;
  const appointmentDateTime = document.getElementById("appointmentDateTime").value;
  const paymentRef = document.getElementById("paymentRef").value;

  if (!validateReferenceNumber(paymentRef)) {
    alert("Invalid payment reference number.");
    return;
  }

  db.collection("patients").where("email", "==", email).get()
    .then(snapshot => {
      if (snapshot.empty) {
        alert("This email is not registered.");
        return;
      }

      return db.collection("appointments")
        .where("appointmentDateTime", "==", appointmentDateTime)
        .where("email", "==", email)
        .get();
    })
    .then(snapshot => {
      if (!snapshot.empty) {
        alert("You already have an appointment at this time.");
        return;
      }

      const fileInput = document.getElementById("proofImage");
      if (fileInput.files.length === 0) {
        alert("Please upload proof of payment.");
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        const appointmentData = {
          fullName: document.getElementById("fullName").value,
          phone: document.getElementById("phone").value,
          email: email,
          age: document.getElementById("age").value,
          gender: document.getElementById("gender").value,
          address: document.getElementById("address").value,
          allergies: document.getElementById("allergies").value,
          medications: document.getElementById("medications").value,
          conditions: document.getElementById("conditions").value,
          familyHistory: document.getElementById("familyHistory").value,
          appointmentDateTime,
          reason: document.getElementById("appointmentReason").value,
          feeAmount: document.getElementById("feeAmount").value,
          paymentMethod: document.getElementById("paymentMethod").value,
          paymentRef,
          paymentProof: e.target.result,
          paymentConfirmed,
          noRefundAccepted,
          timestamp: new Date().toISOString(),
          status: "Pending",
          userId: auth.currentUser.uid
        };

        db.collection("appointments").add(appointmentData)
          .then(() => {
            document.getElementById("step2").classList.add("hidden");
            document.getElementById("step3").classList.remove("hidden");
          })
          .catch(err => {
            console.error("Error adding appointment: ", err);
            alert("Error scheduling appointment. Try again.");
          });
      };
      reader.readAsDataURL(fileInput.files[0]);
    })
    .catch(error => {
      console.error("Error checking appointments:", error);
      alert("Error checking records. Try again.");
    });
}

// Weekday mapping
const weekdayMap = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6
};

async function setupCalendar(doctorId) {
  const doc = await db.collection("doctors").doc(doctorId).get();
  if (!doc.exists) return alert("Doctor not found");

  const doctor = doc.data();
  const availableDays = doctor.schedule.map(entry => entry.day);
  const availableDates = getAvailableDates(availableDays, 30);

  flatpickr("#calendarContainer", {
    inline: true,
    dateFormat: "Y-m-d",
    enable: availableDates,
    onChange: (dates, dateStr) => {
      if (dateStr) displayTimeSlots(doctor.schedule, dateStr);
    }
  });
}

function getAvailableDates(availableDays, daysAhead = 30) {
  const result = [];
  const today = new Date();
  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const day = Object.keys(weekdayMap).find(k => weekdayMap[k] === date.getDay());
    if (availableDays.includes(day)) result.push(date);
  }
  return result;
}

function displayTimeSlots(schedule, dateStr) {
  const day = Object.keys(weekdayMap).find(key => weekdayMap[key] === new Date(dateStr).getDay());
  const timeContainer = document.getElementById("timeSlots");
  timeContainer.innerHTML = "";

  const entry = schedule.find(s => s.day === day);
  if (!entry) {
    timeContainer.textContent = "No available times.";
    return;
  }

  entry.times.forEach(time => {
    const btn = document.createElement("button");
    btn.textContent = time;
    Object.assign(btn.style, {
      padding: "8px 14px", borderRadius: "20px", border: "1px solid #10b981",
      backgroundColor: "#ecfdf5", color: "#065f46", cursor: "pointer",
      fontWeight: "500", margin: "4px"
    });

    btn.addEventListener("click", () => {
      document.getElementById("appointmentDateTime").value = `${dateStr}T${time}`;
      alert(`Selected appointment: ${dateStr} at ${time}`);
      Array.from(timeContainer.children).forEach(b => {
        b.style.backgroundColor = "#ecfdf5";
        b.style.color = "#065f46";
      });
      btn.style.backgroundColor = "#10b981";
      btn.style.color = "white";
    });

    timeContainer.appendChild(btn);
  });
}

function fetchDoctorDetails(doctorId) {
  db.collection("doctors").doc(doctorId).get().then(doc => {
    if (!doc.exists) return alert("Doctor not found");

    const doctor = doc.data();
    document.getElementById("doctorName").textContent = doctor.fullName;
    document.getElementById("doctorSpecialization").textContent = doctor.specialization;

    const container = document.getElementById("scheduleContainer");
    container.innerHTML = "";
    doctor.schedule.forEach(entry => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${entry.day}:</strong> ${entry.times.join(", ")}`;
      container.appendChild(div);
    });
  }).catch(console.error);
}

function restart() {
  document.getElementById("step3").classList.add("hidden");
  document.getElementById("step1").classList.remove("hidden");
}

function fetchUserData(uid) {
  db.collection("patients").doc(uid).get().then(doc => {
    if (doc.exists) {
      const d = doc.data();
      ["fullName", "phone", "email", "age", "address", "gender"].forEach(id => {
        document.getElementById(id).value = d[id] || "";
      });
    }
  }).catch(console.error);
}

document.addEventListener("DOMContentLoaded", () => {
  const doctorId = new URLSearchParams(window.location.search).get("doctorId");
  if (doctorId) {
    setupCalendar(doctorId);
    fetchDoctorDetails(doctorId);
  }

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      fetchUserData(user.uid);
    }

    document.getElementById("confirmButton").addEventListener("click", confirmAppointment);
    document.getElementById("proofImage").addEventListener("change", handleFileUpload);

    document.getElementById("openModalBtn").addEventListener("click", () => {
      document.getElementById("imageModal").style.display = "block";
    });

    document.getElementById("closeModal").addEventListener("click", () => {
      document.getElementById("imageModal").style.display = "none";
    });

    window.addEventListener("click", event => {
      const modal = document.getElementById("imageModal");
      if (event.target === modal) modal.style.display = "none";
    });
  });

  const savedDate = localStorage.getItem("selectedDate");
  const savedTime = localStorage.getItem("selectedTime");
  if (savedDate && savedTime) {
    const [hour, minute] = savedTime.split(/[: ]/);
    let hour24 = parseInt(hour);
    const isPM = savedTime.includes("PM");
    if (isPM && hour24 < 12) hour24 += 12;
    if (!isPM && hour24 === 12) hour24 = 0;
    document.getElementById("appointmentDateTime").value = `${savedDate}T${String(hour24).padStart(2, '0')}:${minute}`;
  }
});
