import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase config for the new project
const firebaseConfig = {
  apiKey: "AIzaSyDwCayQZ0JO6DjzQvAT6ToT33I4QXCS_NY",
  authDomain: "login-sample-c3af0.firebaseapp.com",
  projectId: "login-sample-c3af0",
  storageBucket: "login-sample-c3af0.firebasestorage.app",
  messagingSenderId: "372688128666",
  appId: "1:372688128666:web:bbc529c73c4665f95f6d23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Custom Alert Function (MODERNIZED AND TOP-CENTERED) ---
function showCustomAlert(message, isSuccess = false) {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => alert.remove());

  // Create alert
  const alertDiv = document.createElement('div');
  const typeClass = isSuccess ? 'success' : 'error';

  alertDiv.className = `custom-alert ${typeClass}`;
  alertDiv.textContent = message;

  document.body.appendChild(alertDiv);

  // Show animation
  setTimeout(() => alertDiv.classList.add('show'), 10);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertDiv.classList.remove('show');
    setTimeout(() => alertDiv.remove(), 300);
  }, 5000);
}




// Add CSS styles for the custom alert
const style = document.createElement('style');
style.textContent = `
.custom-alert {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 99999;
  opacity: 0;
  transition: all 0.3s ease;
  max-width: 90%;
  width: max-content;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Only show color when .success or .error is added */
.custom-alert.success {
  background: #4CAF50; /* green */
}

.custom-alert.error {
  background: #f44336; /* red */
}

.custom-alert.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
`;


document.head.appendChild(style);


document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("id");

  if (!patientId) {
    showCustomAlert("No patient ID provided.", false); // Changed from alert
    return;
  }

  const patientDocRef = doc(db, "appointments", patientId);

  try {
    const snapshot = await getDoc(patientDocRef);
    if (!snapshot.exists()) {
      showCustomAlert("Patient not found.", false); // Changed from alert
      return;
    }

    const data = snapshot.data();

    document.getElementById("name").textContent = data.fullName || "N/A";
    document.getElementById("age").textContent = data.age || "N/A";
    document.getElementById("gender").textContent = data.gender || "N/A";
    document.getElementById("contact").textContent = data.phone || "N/A";
    document.getElementById("email").textContent = data.email || "N/A";
    document.getElementById("address").textContent = data.address || "N/A";
    document.getElementById("allergies").textContent = data.allergies || "N/A";
    document.getElementById("medications").textContent = data.medications || "N/A";
    document.getElementById("conditions").textContent = data.conditions || "N/A";
    document.getElementById("familyHistory").textContent = data.familyHistory || "N/A";
    document.getElementById("dateTime").textContent = data.appointmentDateTime || "N/A";
    document.getElementById("reason").textContent = data.reason || "N/A";
    document.getElementById("fee").textContent = data.feeAmount || "N/A";
    document.getElementById("paymentMethod").textContent = data.paymentMethod || "N/A";
    document.getElementById("paymentRef").textContent = data.paymentRef || "N/A";
    document.getElementById("paymentConfirmed").textContent = data.paymentConfirmed ? "Confirmed" : "Not Confirmed";
    document.getElementById("noRefundAccepted").textContent = data.noRefundAccepted ? "Acknowledged" : "Not Acknowledged";
    document.getElementById("status").textContent = data.status || "Pending";

    window.patientId = patientId;

    // Show Proof of Payment image
    if (data.paymentProof) {
      const img = document.getElementById("paymentProofImg");

      // If the string doesn't already start with "data:image/", prepend the JPEG prefix
      const isBase64 = data.paymentProof.startsWith("data:image/");
      img.src = isBase64 ? data.paymentProof : `data:image/jpeg;base64,${data.paymentProof}`;

      img.style.display = "block";

      img.onerror = () => {
        img.style.display = "none";
        console.warn("Payment proof image failed to load.");
      };
    }
  } catch (error) {
    console.error("Error fetching patient data:", error);
    showCustomAlert("Failed to fetch patient data.", false); // Changed from alert
  }
});

window.updateStatus = async function (status) {
  const appointmentRef = doc(db, "appointments", window.patientId);
  const destinationCollection = status.toLowerCase();

  try {
    const snapshot = await getDoc(appointmentRef);
    if (!snapshot.exists()) {
      showCustomAlert("Appointment data not found.", false);
      return;
    }

    const data = snapshot.data();
    data.status = status;

    const newDocRef = doc(db, destinationCollection, window.patientId);
    await updateDoc(appointmentRef, { status });
    await setDoc(newDocRef, data);
    await deleteDoc(appointmentRef);

    document.getElementById("status").textContent = status;
    document.getElementById("approve-button").parentElement.style.display = "none";

    // ✅ Send Email
    await sendEmailNotification(data.email, data.fullName, status, data.appointmentDateTime);

    const isSuccess = status.toLowerCase() === "approved";
    showCustomAlert(
      `Appointment has been moved to "${destinationCollection}" and email notification sent.`,
      isSuccess
    );
  } catch (error) {
    console.error("Error updating status:", error);
    showCustomAlert("Failed to update appointment: " + error.message, false);
  }
};


async function sendEmailNotification(email, fullName, status, appointmentDateTime) {
  const templateParams = {
    email: email,
    fullName: fullName,
    status: status,
    appointmentDateTime: appointmentDateTime || "N/A" // used directly as string
  };

  try {
    const result = await emailjs.send(
      "service_4neygh9",
      "template_yemsf53",
      templateParams,
      "uxowx8uL9zxSSj8V1"
    );
    console.log("✅ Email sent:", result);
    showCustomAlert("Email sent to " + email, true); // Changed from alert
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    showCustomAlert("Email send error: " + (error.text || error.message), false); // Changed from alert
  }
}
