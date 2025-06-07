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

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get("id");

  if (!patientId) {
    alert("No patient ID provided.");
    return;
  }

  const patientDocRef = doc(db, "appointments", patientId);

  try {
    const snapshot = await getDoc(patientDocRef);
    if (!snapshot.exists()) {
      alert("Patient not found.");
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
    alert("Failed to fetch patient data.");
  }
});

window.updateStatus = async function (status) {
  const appointmentRef = doc(db, "appointments", window.patientId);
  const destinationCollection = status.toLowerCase();

  try {
    const snapshot = await getDoc(appointmentRef);
    if (!snapshot.exists()) {
      alert("Appointment data not found.");
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

    alert(`Appointment has been moved to "${destinationCollection}" and email notification sent.`);
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update appointment: " + error.message);
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
    alert("Email sent to " + email);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    alert("Email send error: " + (error.text || error.message));
  }
}
