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

// State
let selectedDate = null;
let selectedDoctor = { id: "", name: "", email: "" };

// --- Step navigation ---
function nextStep(step) {
    if (step === 1) {
        const inputs = document.querySelectorAll('#step1 input, #step1 select');
        for (let input of inputs) {
            if (!input.value || input.value === input.querySelector('option[disabled]')?.value) {
                alert('Please complete all required fields before proceeding.');
                return;
            }
        }
    }
    document.getElementById(`step${step}`).classList.add("hidden");
    document.getElementById(`step${step + 1}`).classList.remove("hidden");
}

function prevStep(step) {
    document.getElementById(`step${step + 1}`).classList.add("hidden");
    document.getElementById(`step${step}`).classList.remove("hidden");
}

// --- Validation ---
function validateReferenceNumber(referenceNumber, paymentMethod) {
    if (paymentMethod === "GCash") {
        return /^\d{13}$/.test(referenceNumber);
    } else if (paymentMethod === "Bank Transfer") {
        return /^[a-zA-Z0-9]{6,20}$/.test(referenceNumber);
    } else if (paymentMethod === "Credit Card") {
        return true;
    }
    return false;
}

// --- Fee Calculation ---
function updateFee() {
    let feeAmount;
    const reason = document.getElementById("appointmentReason").value;
    switch (reason) {
        case "Consultation": feeAmount = 150; break;
        case "Check-up": feeAmount = 100; break;
        case "Follow-up": feeAmount = 120; break;
        default: feeAmount = 0;
    }
    document.getElementById("feeAmount").value = feeAmount;
    document.getElementById("displayFee").value = `₱${feeAmount}`;
}

// --- File Upload Preview ---
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
        alert("Invalid file type.");
        return;
    }

    if (file.size > maxSize) {
        alert("File too large. Max 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        document.getElementById("modalImage").src = e.target.result;
        document.getElementById("openModalBtn").style.display = "inline-block";
    };
    reader.readAsDataURL(file);
}

// --- Confirm Appointment ---
function confirmAppointment() {
    const inputs = document.querySelectorAll('#step2 input:not([type="checkbox"]), #step2 select');
    for (let input of inputs) {
        if (!input.value || input.value === input.querySelector('option[disabled]')?.value) {
            alert('Please complete all required fields before confirming.');
            return;
        }
    }

    if (!document.getElementById("paymentConfirmed").checked || !document.getElementById("noRefundAccepted").checked) {
        alert("Please confirm payment and refund policy.");
        return;
    }

    const email = document.getElementById("email").value;
    const appointmentDateTime = document.getElementById("appointmentDateTime").value;
    const paymentRef = document.getElementById("paymentRef").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const file = document.getElementById("proofImage").files[0];

    if (!validateReferenceNumber(paymentRef, paymentMethod)) {
        alert(`Invalid reference number for ${paymentMethod}.`);
        return;
    }

    if (!file) {
        alert("Upload proof of payment.");
        return;
    }

    function sendEmailToDoctor(doctorEmail, doctorFullName, patientFullName, appointmentDateTime) {
        const templateParams = {
            email: doctorEmail, // For the "To Email" field
            doctor_fullname: doctorFullName, // For {{doctor_fullname}}
            patient_fullname: patientFullName, // For {{patient_fullname}}
            appointmentDateTime: new Date(appointmentDateTime).toLocaleString() // For {{appointmentDateTime}}
        };

        emailjs.send("service_4neygh9", "template_11mgiux", templateParams, "uxowx8uL9zxSSj8V1")
            .then((result) => {
                console.log("✅ Email sent to doctor:", result.text);
                alert("Doctor has been notified.");
            })
            .catch((error) => {
                console.error("❌ Failed to send email to doctor:", error);
                alert("Doctor email notification failed.");
            });
    }


    function saveAppointmentToFirestore() {
        db.collection("patients").where("email", "==", email).get().then(querySnapshot => {
            if (querySnapshot.empty) {
                alert("Email not registered.");
                return;
            }

            db.collection("appointments")
                .where("appointmentDateTime", "==", appointmentDateTime)
                .where("email", "==", email)
                .get()
                .then(snapshot => {
                    if (!snapshot.empty) {
                        alert("Appointment already exists.");
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const appointmentData = {
                            fullName: document.getElementById("fullName").value,
                            phone: document.getElementById("phone").value,
                            email,
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
                            paymentMethod,
                            paymentRef,
                            paymentProof: e.target.result,
                            paymentConfirmed: true,
                            noRefundAccepted: true,
                            timestamp: new Date().toISOString(),
                            status: "Pending",
                            userId: auth.currentUser?.uid || "",
                            doctorId: selectedDoctor.id,
                            doctorName: selectedDoctor.name,
                            doctorEmail: selectedDoctor.email
                        };

                        db.collection("appointments").add(appointmentData)
                            .then(() => {
                                document.getElementById("step2").classList.add("hidden");
                                document.getElementById("step3").classList.remove("hidden");

                                sendEmailToDoctor(
                                    selectedDoctor.email,
                                    selectedDoctor.name,
                                    document.getElementById("fullName").value,
                                    appointmentDateTime
                                );
                            })
                            .catch(error => {
                                console.error("Error saving appointment:", error);
                                alert("Error scheduling appointment.");
                            });
                    };
                    reader.readAsDataURL(file);
                });
        });
    }

    function proceedWithOCRIfNeeded() {
        if (paymentMethod === "GCash") {
            Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
                if (!text.includes(paymentRef)) {
                    alert("Reference number not found in uploaded image.");
                    return;
                }
                saveAppointmentToFirestore();
            });
        } else {
            saveAppointmentToFirestore();
        }
    }

    if (paymentMethod === "GCash" || paymentMethod === "Bank Transfer") {
        db.collection("appointments").where("paymentRef", "==", paymentRef).get().then(snapshot => {
            if (!snapshot.empty) {
                alert("This reference number has already been used.");
                return;
            }
            proceedWithOCRIfNeeded();
        });
    } else {
        proceedWithOCRIfNeeded();
    }
}

// --- Fetch patient data ---
function fetchUserData(uid) {
    db.collection("patients").doc(uid).get().then(doc => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById("fullName").value = data.fullName || "";
            document.getElementById("phone").value = data.phone || "";
            document.getElementById("email").value = data.email || "";
            document.getElementById("age").value = data.age || "";
            document.getElementById("address").value = data.address || "";
            document.getElementById("gender").value = data.gender || "";
        }
    }).catch(error => {
        console.error("Error fetching user data:", error);
    });
}

// --- Fetch doctor data ---
function fetchDoctorDetails(doctorId) {
    db.collection("doctors").doc(doctorId).get().then(doc => {
        if (!doc.exists) return alert("Doctor not found");

        const doctor = doc.data();
        document.getElementById("doctorName").textContent = doctor.fullName || "";
        document.getElementById("doctorSpecialization").textContent = doctor.specialization || "";

        selectedDoctor = {
            id: doctorId,
            name: doctor.fullName || "",
            email: doctor.email || ""
        };

        const container = document.getElementById("scheduleContainer");
        if (container) {
            container.innerHTML = "";
            doctor.schedule.forEach(entry => {
                const div = document.createElement("div");
                div.innerHTML = `<strong>${entry.day}:</strong> ${entry.times.join(", ")}`;
                container.appendChild(div);
            });
        }
    }).catch(console.error);
}

// --- Calendar ---
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
            if (dateStr) {
                selectedDate = dateStr;
                displayTimeSlots(doctor.schedule, dateStr);
                document.getElementById("appointmentDateTime").value = "";
            }
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

    // Parse start and end times from strings to Date objects on the same day
    const parseTime = (timeStr) => {
        // Example input: "10:00 AM"
        const [time, meridian] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (meridian === "PM" && hours !== 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;

        const date = new Date(dateStr);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const start = parseTime(entry.startTime);
    const end = parseTime(entry.endTime);

    const lunchStart = new Date(dateStr);
    lunchStart.setHours(12, 0, 0, 0);
    const lunchEnd = new Date(dateStr);
    lunchEnd.setHours(13, 0, 0, 0);

    let current = new Date(start);

    while (current < end) {
        const next = new Date(current.getTime() + 30 * 60000); // 30 minutes later

        // Skip slots overlapping lunch break
        if (!(next > lunchStart && current < lunchEnd)) {
            const slotStr = `${formatTime(current)} - ${formatTime(next)}`;
            const btn = document.createElement("button");
            btn.textContent = slotStr;
            btn.classList.add("time-slot-btn");

            Object.assign(btn.style, {
                padding: "8px 14px",
                borderRadius: "20px",
                border: "1px solid #10b981",
                backgroundColor: "#ecfdf5",
                color: "#065f46",
                cursor: "pointer",
                fontWeight: "500",
                margin: "4px"
            });

            btn.addEventListener("click", () => {
                if (!selectedDate) {
                    alert("Please select a date first.");
                    return;
                }

                Array.from(timeContainer.children).forEach(b => {
                    b.style.backgroundColor = "#ecfdf5";
                    b.style.color = "#065f46";
                });

                btn.style.backgroundColor = "#10b981";
                btn.style.color = "white";

                const selectedTime = formatTime(current);
                document.getElementById("appointmentDateTime").value = `${dateStr} ${selectedTime}`;
            });


            timeContainer.appendChild(btn);
        }

        current = next;
    }
}

function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// --- Weekday map ---
const weekdayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6
};

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
    const doctorId = new URLSearchParams(window.location.search).get("doctorId");
    if (doctorId) {
        setupCalendar(doctorId);
        fetchDoctorDetails(doctorId);
    }

    auth.onAuthStateChanged(user => {
        if (user) fetchUserData(user.uid);
    });

    document.getElementById("appointmentReason")?.addEventListener("change", updateFee);
    document.getElementById("confirmButton")?.addEventListener("click", confirmAppointment);
    document.getElementById("proofImage")?.addEventListener("change", handleFileUpload);

    document.getElementById("openModalBtn")?.addEventListener("click", () => {
        document.getElementById("imageModal").style.display = "block";
    });

    document.getElementById("closeModal")?.addEventListener("click", () => {
        document.getElementById("imageModal").style.display = "none";
    });

    window.addEventListener("click", event => {
        if (event.target === document.getElementById("imageModal")) {
            document.getElementById("imageModal").style.display = "none";
        }
    });

    updateFee();
});