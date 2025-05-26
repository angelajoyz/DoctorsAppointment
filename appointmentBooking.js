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

function validateReferenceNumber(referenceNumber) {
    const regex = /^\d{13}$/;
    return regex.test(referenceNumber);
}

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

function nextStep(step) {
    const inputs = document.querySelectorAll('#step1 input, #step1 select');
    for (let input of inputs) {
        if (!input.value || input.value === input.querySelector('option[disabled]')?.value) {
            alert('Please complete all required fields before proceeding.');
            return;
        }
    }
    document.getElementById(`step${step}`).classList.add("hidden");
    document.getElementById(`step${step + 1}`).classList.remove("hidden");
}

function prevStep(step) {
    document.getElementById(`step${step + 1}`).classList.add("hidden");
    document.getElementById(`step${step}`).classList.remove("hidden");
}

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

function confirmAppointment() {
    const inputs = document.querySelectorAll('#step2 input:not([type="checkbox"]), #step2 select');
    for (let input of inputs) {
        if (!input.value || input.value === input.querySelector('option[disabled]')?.value) {
            alert('Please complete all required fields before confirming.');
            return;
        }
    }

    if (!document.getElementById("paymentConfirmed").checked ||
        !document.getElementById("noRefundAccepted").checked) {
        alert("Please confirm payment and refund policy.");
        return;
    }

    const email = document.getElementById("email").value;
    const appointmentDateTime = document.getElementById("appointmentDateTime").value;
    const paymentRef = document.getElementById("paymentRef").value;

    if (!validateReferenceNumber(paymentRef)) {
        alert("Invalid reference number.");
        return;
    }

    const file = document.getElementById("proofImage").files[0];
    if (!file) {
        alert("Upload proof of payment.");
        return;
    }

    // Check for duplicate reference number
    db.collection("appointments").where("paymentRef", "==", paymentRef).get().then((snapshot) => {
        if (!snapshot.empty) {
            alert("This GCash reference number has already been used.");
            return;
        }

        // OCR validation
        Tesseract.recognize(file, 'eng')
            .then(({ data: { text } }) => {
                if (!text.includes(paymentRef)) {
                    alert("Reference number not found in uploaded image.");
                    return;
                }

                // Proceed with appointment creation
                db.collection("patients").where("email", "==", email).get()
                    .then((querySnapshot) => {
                        if (querySnapshot.empty) {
                            alert("Email not registered.");
                            return;
                        }

                        db.collection("appointments")
                            .where("appointmentDateTime", "==", appointmentDateTime)
                            .where("email", "==", email)
                            .get()
                            .then((snapshot) => {
                                if (!snapshot.empty) {
                                    alert("Appointment already exists.");
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
                                        appointmentDateTime: appointmentDateTime,
                                        reason: document.getElementById("appointmentReason").value,
                                        feeAmount: document.getElementById("feeAmount").value,
                                        paymentMethod: document.getElementById("paymentMethod").value,
                                        paymentRef: paymentRef,
                                        paymentProof: e.target.result,
                                        paymentConfirmed: true,
                                        noRefundAccepted: true,
                                        timestamp: new Date().toISOString(),
                                        status: "Pending",
                                        userId: auth.currentUser.uid
                                    };

                                    db.collection("appointments").add(appointmentData)
                                        .then(() => {
                                            document.getElementById("step2").classList.add("hidden");
                                            document.getElementById("step3").classList.remove("hidden");
                                        })
                                        .catch(error => {
                                            console.error("Error saving appointment:", error);
                                            alert("Error scheduling appointment.");
                                        });
                                };
                                reader.readAsDataURL(file);
                            });
                    });
            });
    });
}


function fetchUserData(uid) {
    db.collection("patients").doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById("fullName").value = data.fullName || "";
                document.getElementById("phone").value = data.phone || "";
                document.getElementById("email").value = data.email || "";
                document.getElementById("age").value = data.age || "";
                document.getElementById("address").value = data.address || "";
                document.getElementById("gender").value = data.gender || "";
            }
        })
        .catch(error => {
            console.error("Error fetching user data:", error);
        });
}

window.onload = function () {
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchUserData(user.uid);
        } else {
            console.log("No user signed in.");
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
            if (event.target === document.getElementById("imageModal")) {
                document.getElementById("imageModal").style.display = "none";
            }
        });
    });

    const dateInput = document.getElementById("appointmentDateTime");
    const selectedDate = localStorage.getItem("selectedDate");
    const selectedTime = localStorage.getItem("selectedTime");

    if (selectedDate && selectedTime && dateInput) {
        const [hour, minutePart] = selectedTime.split(':');
        const minute = minutePart.split(' ')[0];
        const isAM = selectedTime.includes("AM");
        let hour24 = parseInt(hour);
        if (!isAM && hour24 !== 12) hour24 += 12;
        if (isAM && hour24 === 12) hour24 = 0;
        const hourStr = hour24.toString().padStart(2, '0');
        dateInput.value = `${selectedDate}T${hourStr}:${minute}`;
    }
};
