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

// --- Custom Alert Function (MODERNIZED AND TOP-CENTERED) ---
function showCustomAlert(message, isSuccess = false) {
    let alertDiv = document.getElementById('custom-alert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'custom-alert';

        // Modern styling with top-center positioning
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px; /* Distance from the top */
            left: 50%;
            transform: translateX(-50%); /* Center horizontally */
            background-color: #f44336; /* Dark background for modern look */
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow */
            z-index: 10000; /* Ensure it's on top of everything */
            opacity: 0;
            transition: all 0.3s ease-out; /* Smooth transition for fade and slide */
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            min-width: 300px;
            max-width: 90vw; /* Responsive width */
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px); /* Frosted glass effect */
            border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
            /* Initial state for animation */
            transform: translateX(-50%) translateY(-20px); 
        `;

        // Add keyframes for slideDown animation if not already present
        if (!document.getElementById('slideDownKeyframes')) {
            const style = document.createElement('style');
            style.id = 'slideDownKeyframes';
            style.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(alertDiv);
    }

    // Set message and styling based on type
    alertDiv.textContent = message;
    alertDiv.style.backgroundColor = isSuccess ? "#4CAF50" : "#f44336"; // Green for success, red for error
    alertDiv.style.opacity = 1;
    alertDiv.style.animation = 'slideDown 0.3s forwards'; // Apply slideDown animation

    // Auto-hide after 5 seconds with fade-out animation
    setTimeout(() => {
        alertDiv.style.opacity = 0;
        alertDiv.style.animation = 'none'; // Remove animation to prevent re-trigger on hide
        // Optional: remove the element after it fades out
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 300); // Match transition duration
    }, 5000); // Alert disappears after 5 seconds
}


// --- Step navigation ---
function nextStep(step) {
    if (step === 1) {
        const inputs = document.querySelectorAll('#step1 input, #step1 select');
        for (let input of inputs) {
            // Exclude parent consent fields from general validation if not visible
            if (input.closest('#parentConsentSection') && input.closest('#parentConsentSection').classList.contains('hidden')) {
                continue;
            }
            if (!input.value || input.value === input.querySelector('option[disabled]')?.value) {
                showCustomAlert('Please complete all required fields before proceeding.');
                return;
            }
        }

        const age = parseInt(document.getElementById("age").value, 10);
        const MINOR_AGE_THRESHOLD = 18; // Ensure this matches the one in DOMContentLoaded

        if (!isNaN(age) && age < MINOR_AGE_THRESHOLD) {
            const parentFullName = document.getElementById("parentFullName").value;
            const parentPhone = document.getElementById("parentPhone").value;
            const parentEmail = document.getElementById("parentEmail").value;
            const parentConsentChecked = document.getElementById("parentConsent").checked;

            if (!parentFullName || !parentPhone || !parentEmail || !parentConsentChecked) {
                showCustomAlert('As the patient is a minor, parent/guardian information and consent are required.');
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
        return true; // Credit card numbers are validated client-side or by payment gateway
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
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!validTypes.includes(file.type)) {
        showCustomAlert("Invalid file type. Please upload a JPEG, PNG, or GIF image.");
        return;
    }

    if (file.size > maxSize) {
        showCustomAlert("File too large. Maximum size is 2MB.");
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
            showCustomAlert('Please complete all required fields before confirming.');
            return;
        }
    }

    if (!document.getElementById("paymentConfirmed").checked || !document.getElementById("noRefundAccepted").checked) {
        showCustomAlert("Please confirm payment and acknowledge the refund policy.");
        return;
    }

    const email = document.getElementById("email").value;
    const appointmentDateTime = document.getElementById("appointmentDateTime").value;
    const paymentRef = document.getElementById("paymentRef").value;
    const paymentMethod = document.getElementById("paymentMethod").value;
    const file = document.getElementById("proofImage").files[0];

    if (!validateReferenceNumber(paymentRef, paymentMethod)) {
        showCustomAlert(`Invalid reference number for ${paymentMethod}. Please check the format.`);
        return;
    }

    if (!file) {
        showCustomAlert("Please upload proof of payment.");
        return;
    }

    function sendEmailToDoctor(doctorEmail, doctorFullName, patientFullName, appointmentDateTime) {
        const templateParams = {
            email: doctorEmail, // For the "To Email" field
            doctor_fullname: doctorFullName, // For {{doctor_fullname}}
            patient_fullname: patientFullName, // For {{patient_fullname}}
            appointmentDateTime: appointmentDateTime // For {{appointmentDateTime}}
        };

        emailjs.send("service_4neygh9", "template_11mgiux", templateParams, "uxowx8uL9zxSSj8V1")
            .then((result) => {
                console.log("✅ Email sent to doctor:", result.text);
                showCustomAlert("Doctor has been notified.", true);
            })
            .catch((error) => {
                console.error("❌ Failed to send email to doctor:", error);
                showCustomAlert("Doctor email notification failed. Please try again later.");
            });
    }

    async function saveAppointmentToFirestore() {
        try {
            // Step 1: Check if patient is registered
            const patientSnapshot = await db.collection("patients").where("email", "==", email).get();
            if (patientSnapshot.empty) {
                showCustomAlert("Your email is not registered. Please register an account first.");
                return;
            }

            // Step 2: Check for existing appointment with same dateTime & same doctor in 'appointments' and 'approved'
            const checkAppointments = db.collection("appointments")
                .where("appointmentDateTime", "==", appointmentDateTime)
                .where("doctorId", "==", selectedDoctor.id)
                .get();

            const checkApproved = db.collection("approved")
                .where("appointmentDateTime", "==", appointmentDateTime)
                .where("doctorId", "==", selectedDoctor.id)
                .get();

            const [appointmentsSnapshot, approvedSnapshot] = await Promise.all([checkAppointments, checkApproved]);

            if (!appointmentsSnapshot.empty || !approvedSnapshot.empty) {
                showCustomAlert("This time slot is already booked for this doctor. Please choose another slot.");
                return;
            }

            // Step 3: Read payment proof
            const fileInput = document.getElementById("proofImage");
            const file = fileInput?.files[0];
            if (!file) {
                showCustomAlert("Please upload a payment proof.");
                return;
            }

            const reader = new FileReader();
            reader.onload = async function (e) {
                const age = parseInt(document.getElementById("age").value, 10);
                const MINOR_AGE_THRESHOLD = 18; // Ensure consistency
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
                // Add parent/guardian information if applicable
                if (!isNaN(age) && age < MINOR_AGE_THRESHOLD) {
                    appointmentData.parentFullName = document.getElementById("parentFullName").value;
                    appointmentData.parentPhone = document.getElementById("parentPhone").value;
                    appointmentData.parentEmail = document.getElementById("parentEmail").value;
                    appointmentData.parentConsent = document.getElementById("parentConsent").checked;
                }
                await db.collection("appointments").add(appointmentData);

                document.getElementById("step2").classList.add("hidden");
                document.getElementById("step3").classList.remove("hidden");

                showCustomAlert("Appointment successfully scheduled!", true); // Final success message

                sendEmailToDoctor(
                    selectedDoctor.email,
                    selectedDoctor.name,
                    document.getElementById("fullName").value,
                    appointmentDateTime
                );
            };

            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Error scheduling appointment:", error);
            showCustomAlert("Error scheduling appointment. Please try again.");
        }
    }

    function proceedWithOCRIfNeeded() {
        if (paymentMethod === "GCash") {
            Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
                if (!text.includes(paymentRef)) {
                    showCustomAlert("Reference number not found in the uploaded image. Please ensure it's visible.");
                    return;
                }
                saveAppointmentToFirestore();
            }).catch(ocrError => {
                console.error("OCR Error:", ocrError);
                showCustomAlert("Failed to process image for OCR. Please ensure the image is clear.");
            });
        } else {
            saveAppointmentToFirestore();
        }
    }

    if (paymentMethod === "GCash" || paymentMethod === "Bank Transfer") {
        db.collection("appointments").where("paymentRef", "==", paymentRef).get().then(snapshot => {
            if (!snapshot.empty) {
                showCustomAlert("This reference number has already been used. Please use a unique reference.");
                return;
            }
            proceedWithOCRIfNeeded();
        }).catch(dbError => {
            console.error("Firestore query error:", dbError);
            showCustomAlert("An error occurred while checking reference number. Please try again.");
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
        showCustomAlert("Failed to load patient data. Please refresh the page.");
    });
}

// --- Fetch doctor data ---
function fetchDoctorDetails(doctorId) {
    db.collection("doctors").doc(doctorId).get().then(doc => {
        if (!doc.exists) {
            showCustomAlert("Doctor not found. Please select a valid doctor.");
            return;
        }

        const doctor = doc.data();
        document.getElementById("doctorName").textContent = doctor.fullName || "";
        document.getElementById("doctorSpecialization").textContent = doctor.specialization || "";

        selectedDoctor = {
            id: doctorId,
            name: doctor.fullName || "",
            email: doctor.email || ""
        };

        // The scheduleContainer is not directly used for display in this HTML,
        // but the schedule data is used by setupCalendar.
        // Keeping this block for consistency if it was intended for other uses.
        const container = document.getElementById("scheduleContainer");
        if (container) {
            container.innerHTML = "";
            doctor.schedule.forEach(entry => {
                const div = document.createElement("div");
                div.innerHTML = `<strong>${entry.day}:</strong> ${entry.times.join(", ")}`;
                container.appendChild(div);
            });
        }
    }).catch(error => {
        console.error("Error fetching doctor details:", error);
        showCustomAlert("Failed to load doctor details. Please try again.");
    });
}

// --- Calendar ---
async function setupCalendar(doctorId) {
    if (!doctorId) {
        console.error("Doctor ID is not provided.");
        showCustomAlert("Doctor ID is missing. Cannot set up calendar.");
        return;
    }

    const doc = await db.collection("doctors").doc(doctorId).get();
    if (!doc.exists) {
        showCustomAlert("Doctor not found. Cannot set up calendar.");
        return;
    }

    const doctor = doc.data();
    const availableDays = doctor.schedule.map(entry => entry.day);
    const availableDates = getAvailableDates(availableDays, 30);

    flatpickr("#calendarContainer", {
        inline: true,
        dateFormat: "Y-m-d",
        enable: availableDates,
        onChange: async (dates, dateStr) => {
            if (dateStr) {
                selectedDate = dateStr;

                // Find day of week string for dateStr
                const date = new Date(dateStr);
                const dayOfWeekNum = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

                // Reverse map day number to day string
                const dayOfWeekStr = Object.keys(weekdayMap).find(key => weekdayMap[key] === dayOfWeekNum);

                console.log(`📅 Selected date: ${dateStr}`);
                console.log(`📅 Day of week string: ${dayOfWeekStr}`);

                // Find doctor's schedule entry for this day
                const scheduleEntry = doctor.schedule.find(entry => entry.day === dayOfWeekStr);

                console.log(`📅 Schedule entry for ${dayOfWeekStr}:`, scheduleEntry);

                if (!scheduleEntry) {
                    showCustomAlert(`No available schedule for ${dayOfWeekStr}. Please select another day.`);
                    document.getElementById('available-slots').innerHTML = '<p>No available slots for this date.</p>';
                    return;
                }

                // Check if we have startTime and endTime
                if (!scheduleEntry.startTime || !scheduleEntry.endTime) {
                    console.error("❌ Missing startTime or endTime in schedule entry:", scheduleEntry);
                    showCustomAlert("Invalid schedule format for the doctor. Please contact support.");
                    document.getElementById('available-slots').innerHTML = '<p>Invalid schedule format.</p>';
                    return;
                }

                // Destructure startTime and endTime from scheduleEntry
                const { startTime, endTime } = scheduleEntry;

                // Create a time range string from startTime and endTime
                const timeRange = `${startTime} - ${endTime}`;
                console.log(`📅 Time range: ${timeRange}`);

                // Generate individual time slots from the time range
                const timeSlots = generateTimeSlots([timeRange]);
                console.log(`📋 Generated slots:`, timeSlots);

                if (!timeSlots || timeSlots.length === 0) {
                    console.error("❌ No slots generated!");
                    showCustomAlert("No time slots generated for this day. Please try another date.");
                    document.getElementById('available-slots').innerHTML = '<p>No available slots.</p>';
                    return;
                }

                // Get booked slots from Firestore for this date and doctor
                const bookedSlots = await fetchBookedSlotsForDate(dateStr, doctorId);

                // Pass the generated slots to displayAvailableSlots
                displayAvailableSlots(timeSlots, bookedSlots, doctorId);

                // Clear any previously selected date/time
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

async function fetchBookedSlotsForDate(dateStr, doctorId) {
    const booked = [];
    console.log(`🔍 Fetching booked slots for date: ${dateStr}, doctorId: ${doctorId}`);

    try {
        // Query both appointments and approved collections
        const collections = ['appointments', 'approved'];

        for (const collectionName of collections) {
            console.log(`📋 Checking ${collectionName} collection...`);

            // Query all appointments for this doctor
            const snapshot = await db.collection(collectionName)
                .where("doctorId", "==", doctorId)
                .get();

            console.log(`📊 Found ${snapshot.size} documents in ${collectionName} collection`);

            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`📄 Document data:`, {
                    appointmentDateTime: data.appointmentDateTime,
                    doctorId: data.doctorId,
                    status: data.status
                });

                if (data.appointmentDateTime) {
                    // Check if the appointment is for the selected date
                    if (data.appointmentDateTime.startsWith(dateStr)) {
                        console.log(`✅ Found matching appointment for ${dateStr}:`, data.appointmentDateTime);
                        booked.push(data.appointmentDateTime);
                    } else {
                        console.log(`❌ Appointment not for selected date:`, data.appointmentDateTime);
                    }
                }
            });
        }

        console.log(`✅ Total booked slots found: ${booked.length}`, booked);
        return booked;

    } catch (error) {
        console.error("❌ Error fetching booked slots:", error);
        showCustomAlert("Failed to fetch booked slots. Please try again.");
        return [];
    }
}

// Update your existing formatTime function to ensure consistent formatting
function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    if (hours === 0) hours = 12;

    // Always pad with zero for consistency
    const hourStr = hours.toString().padStart(2, "0");
    const minuteStr = minutes.toString().padStart(2, "0");

    return `${hourStr}:${minuteStr} ${ampm}`;
}

function generateTimeSlots(timeRanges) {
    console.log(`🔧 generateTimeSlots called with:`, timeRanges);
    console.log(`🔧 Type:`, typeof timeRanges);
    console.log(`🔧 Is array:`, Array.isArray(timeRanges));

    if (!timeRanges || !Array.isArray(timeRanges)) {
        console.error("❌ timeRanges is not a valid array:", timeRanges);
        return [];
    }

    const slots = [];

    timeRanges.forEach((range, index) => {
        console.log(`🔧 Processing range ${index}:`, range);

        if (!range || typeof range !== 'string') {
            console.error(`❌ Invalid range at index ${index}:`, range);
            return;
        }

        // Parse time range like "9:00 AM - 5:00 PM"
        const [startStr, endStr] = range.split(' - ');

        if (!startStr || !endStr) {
            console.error(`❌ Could not split range: ${range}`);
            return;
        }

        // Parse start time
        const startMatch = startStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!startMatch) {
            console.error(`Could not parse start time: ${startStr}`);
            return;
        }

        let startHour = parseInt(startMatch[1]);
        const startMin = parseInt(startMatch[2]);
        const startPeriod = startMatch[3].toUpperCase();

        // Convert to 24-hour format
        if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
        if (startPeriod === 'AM' && startHour === 12) startHour = 0;

        // Parse end time
        const endMatch = endStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!endMatch) {
            console.error(`Could not parse end time: ${endStr}`);
            return;
        }

        let endHour = parseInt(endMatch[1]);
        const endMin = parseInt(endMatch[2]);
        const endPeriod = endMatch[3].toUpperCase();

        // Convert to 24-hour format
        if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
        if (endPeriod === 'AM' && endHour === 12) endHour = 0;

        // Generate 30-minute slots
        const startTime = new Date();
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date();
        endTime.setHours(endHour, endMin, 0, 0);

        const current = new Date(startTime);

        while (current < endTime) {
            const slotStart = new Date(current);
            current.setMinutes(current.getMinutes() + 30); // 30-minute slots
            const slotEnd = new Date(current);

            if (slotEnd <= endTime) {
                const startFormatted = formatTime(slotStart);
                const endFormatted = formatTime(slotEnd);
                slots.push(`${startFormatted} - ${endFormatted}`);
            }
        }
    });

    // Define lunch break start and end in minutes from midnight
    const lunchStart = 12 * 60; // 12:00 PM
    const lunchEnd = 13 * 60;   // 1:00 PM

    // Helper to convert "HH:MM AM/PM" to minutes since midnight
    function timeStrToMinutes(timeStr) {
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;

        let hour = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return hour * 60 + minutes;
    }

    // Filter out slots overlapping lunch break
    const filteredSlots = slots.filter(slot => {
        const [startStr, endStr] = slot.split(' - ');
        const startMinutes = timeStrToMinutes(startStr);
        const endMinutes = timeStrToMinutes(endStr);

        // Exclude if slot overlaps lunch break
        return !(startMinutes < lunchEnd && endMinutes > lunchStart);
    });

    console.log(`🔧 Generated ${filteredSlots.length} time slots after excluding lunch break:`, filteredSlots);
    return filteredSlots;
}

// Add this helper function to normalize existing time slot strings for comparison
function normalizeTimeFormat(timeSlot) {
    // Extract the time part from "YYYY-MM-DD HH:MM AM/PM - HH:MM AM/PM"
    const timeMatch = timeSlot.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);

    if (!timeMatch) return timeSlot;

    const startTime = timeMatch[1].trim();
    const endTime = timeMatch[2].trim();

    // Normalize to always use zero-padded hours (same format as formatTime function)
    const normalizeTime = (time) => {
        const parts = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!parts) return time;

        const hour = parts[1].padStart(2, '0');
        const minute = parts[2];
        const period = parts[3].toUpperCase();

        return `${hour}:${minute} ${period}`;
    };

    const normalizedStart = normalizeTime(startTime);
    const normalizedEnd = normalizeTime(endTime);

    // Return the date part + normalized time
    const datePart = timeSlot.substring(0, 10); // "YYYY-MM-DD"
    return `${datePart} ${normalizedStart} - ${normalizedEnd}`;
}

function displayAvailableSlots(timeSlots, bookedSlots, doctorId) {
    console.log(`🔍 Displaying slots for date: ${selectedDate}, doctorId: ${doctorId}`);
    console.log(`📋 Booked slots:`, bookedSlots);
    console.log(`📋 Generated slots:`, timeSlots);

    const availableSlotsContainer = document.getElementById('available-slots');
    availableSlotsContainer.innerHTML = '';

    // Check if timeSlots is an array
    if (!Array.isArray(timeSlots)) {
        console.error("❌ timeSlots is not an array:", timeSlots);
        availableSlotsContainer.innerHTML = '<p>Error loading time slots.</p>';
        return;
    }

    // Normalize all booked slots for comparison
    const normalizedBookedSlots = Array.isArray(bookedSlots)
        ? bookedSlots.map(slot => normalizeTimeFormat(slot))
        : [];

    console.log(`📋 Normalized booked slots:`, normalizedBookedSlots);

    let availableCount = 0;
    let bookedCount = 0;
    let pastCount = 0; // New counter for past slots

    const now = new Date(); // Get current date and time

    timeSlots.forEach(slot => {
        // Create the full slot string for comparison
        const fullSlot = `${selectedDate} ${slot}`;
        const normalizedSlot = normalizeTimeFormat(fullSlot);
        const isBooked = normalizedBookedSlots.includes(normalizedSlot);

        // --- NEW LOGIC: Check if the slot is in the past ---
        // Extract the start time from the slot string (e.g., "07:30 PM")
        const slotStartTimeStr = slot.split(' - ')[0];

        // Combine selectedDate and slotStartTimeStr to create a Date object for the slot's start time
        // We need to parse this carefully to ensure correct comparison
        let slotDateTime;
        try {
            // Example: "2025-06-25 07:30 PM"
            const dateTimeStringForParsing = `${selectedDate} ${slotStartTimeStr}`;
            const [datePart, timePart, ampm] = dateTimeStringForParsing.split(' ');
            const [year, month, day] = datePart.split('-');
            let [hours, minutes] = timePart.split(':');

            hours = parseInt(hours);
            minutes = parseInt(minutes);

            if (ampm === 'PM' && hours < 12) {
                hours += 12;
            } else if (ampm === 'AM' && hours === 12) { // Midnight (12 AM) is 00 hours
                hours = 0;
            }
            slotDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0); // Month is 0-indexed
        } catch (e) {
            console.error("Error parsing slot date time for comparison:", dateTimeStringForParsing, e);
            return; // Skip this slot if parsing fails
        }

        const isPast = (selectedDate === now.toISOString().split('T')[0] && slotDateTime < now);
        // The condition `selectedDate === now.toISOString().split('T')[0]` checks if the selected date is today.
        // If it's today, then `slotDateTime < now` checks if the slot's start time is before the current time.
        // If the selected date is in the future, `isPast` will always be false, which is correct.
        // --- END NEW LOGIC ---


        console.log(`🔍 Checking slot: ${slot}`);
        console.log(`   Full slot: ${fullSlot}`);
        console.log(`   Normalized: ${normalizedSlot}`);
        console.log(`   Is booked: ${isBooked}`);
        console.log(`   Is past: ${isPast}`); // Log the new check

        if (isBooked) {
            bookedCount++;
            console.log(`❌ Slot ${slot} is booked`);
        } else if (isPast) { // New condition for past slots
            pastCount++;
            console.log(`🕰️ Slot ${slot} is in the past`);
            const slotElement = document.createElement('button');
            slotElement.className = 'time-slot past-slot'; // Add a class for styling past slots
            slotElement.textContent = slot;
            slotElement.disabled = true; // Disable the button
            availableSlotsContainer.appendChild(slotElement);
        }
        else {
            availableCount++;
            console.log(`✅ Slot ${slot} is available`);

            const slotElement = document.createElement('button');
            slotElement.className = 'time-slot';
            slotElement.textContent = slot;
            slotElement.onclick = () => selectTimeSlot(slot);
            availableSlotsContainer.appendChild(slotElement);
        }
    });

    console.log(`📊 Summary: ${timeSlots.length} total slots, ${bookedCount} booked, ${pastCount} past, ${availableCount} available`);

    if (availableCount === 0 && bookedCount === 0 && pastCount === timeSlots.length) {
        availableSlotsContainer.innerHTML = '<p>No available slots for this date (all are in the past).</p>';
    } else if (availableCount === 0 && bookedCount > 0 && pastCount === 0) {
        availableSlotsContainer.innerHTML = '<p>No available slots for this date (all are booked).</p>';
    } else if (availableCount === 0) {
        availableSlotsContainer.innerHTML = '<p>No available slots for this date.</p>';
    }
}


function selectTimeSlot(slotText) {
    // Remove 'selected' class from all slots
    document.querySelectorAll('.time-slot').forEach(slotDiv => {
        slotDiv.classList.remove('selected');
        // Reset color and background if needed (optional, depends on CSS)
        // But usually CSS handles default state
    });

    // Find and add 'selected' class to the clicked slot
    const clickedSlot = Array.from(document.querySelectorAll('.time-slot')).find(
        div => div.textContent === slotText
    );

    if (clickedSlot) {
        clickedSlot.classList.add('selected');
    }

    // Set the appointment date time (full format for the hidden input)
    const fullDateTimeRange = `${selectedDate} ${slotText}`;
    document.getElementById("appointmentDateTime").value = fullDateTimeRange;

    console.log(`✅ Selected slot: ${slotText}`);
    console.log(`📅 Full appointment date time: ${fullDateTimeRange}`);
}


// --- Weekday map ---
const weekdayMap = {
    Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
    Thursday: 4, Friday: 5, Saturday: 6
};

// --- DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
    // Add the custom alert div to the body when the DOM is ready
    // This is now handled by the showCustomAlert function itself if it doesn't exist.
    // No need to explicitly create it here.
    const ageInput = document.getElementById("age");
    const parentConsentSection = document.getElementById("parentConsentSection");
    const MINOR_AGE_THRESHOLD = 18; // Define the age threshold for consent
    ageInput.addEventListener("input", () => {
        const age = parseInt(ageInput.value, 10);
        if (!isNaN(age) && age < MINOR_AGE_THRESHOLD) {
            parentConsentSection.classList.remove("hidden");
        } else {
            parentConsentSection.classList.add("hidden");
            // Optionally clear parent fields if section is hidden
            document.getElementById("parentFullName").value = "";
            document.getElementById("parentPhone").value = "";
            document.getElementById("parentEmail").value = "";
            document.getElementById("parentConsent").checked = false;
        }
    });

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
