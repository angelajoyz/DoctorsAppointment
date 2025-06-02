  // Hash function using SHA-256
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }



    
   

    // Validate Password
    function validatePassword(password) {
      const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
      return regex.test(password);
    }

    // Initialize Firebase
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

    // Registration Logic
    // Registration Logic
    document.addEventListener("DOMContentLoaded", () => {
      const roleSelect = document.querySelector("select[name='role']");
      const doctorFields = document.querySelectorAll(".doctor-only");
      const licenseInput = document.querySelector("input[name='licenseNumber']");
  if (licenseInput) {
    licenseInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/\D/g, '').slice(0, 7);
    });
  }
  

      // Show/hide doctor-only fields based on selected role

        roleSelect.addEventListener("change", () => {
        if (roleSelect.value === "doctor") {
          doctorFields.forEach(field => field.style.display = "block");
        } else {
          doctorFields.forEach(field => field.style.display = "none");
        }
      });

document.getElementById("addSchedule").addEventListener("click", () => {
  const additionalSchedulesDiv = document.getElementById("additionalSchedules");

  const scheduleContainer = document.createElement("div");
  scheduleContainer.classList.add("schedule-input");
  scheduleContainer.style.display = "flex";
  scheduleContainer.style.flexWrap = "wrap";
  scheduleContainer.style.alignItems = "center";
  scheduleContainer.style.gap = "10px";
  scheduleContainer.style.marginBottom = "10px";

  const daySelect = document.createElement("select");
  daySelect.name = "scheduleDay";
  daySelect.required = true;
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Select day";
  placeholderOption.disabled = true;
  placeholderOption.selected = true;
  daySelect.appendChild(placeholderOption);

  days.forEach(day => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  });

  const timeInputsDiv = document.createElement("div");

  const addTimeButton = document.createElement("button");
  addTimeButton.type = "button";
  addTimeButton.textContent = "Add Time";
  addTimeButton.style.backgroundColor = "#2ecc71";
  addTimeButton.style.color = "white";
  addTimeButton.style.border = "none";
  addTimeButton.style.borderRadius = "5px";
  addTimeButton.style.padding = "6px 12px";
  addTimeButton.style.cursor = "pointer";

addTimeButton.addEventListener("click", () => {
  const timeWrapper = document.createElement("div");
  timeWrapper.style.display = "flex";
  timeWrapper.style.alignItems = "center";
  timeWrapper.style.gap = "8px";
  timeWrapper.style.marginTop = "5px";

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.name = "scheduleTime";
  timeInput.required = true;

  const deleteTimeBtn = document.createElement("button");
  deleteTimeBtn.type = "button";
  deleteTimeBtn.textContent = "🗑";
  deleteTimeBtn.style.backgroundColor = "#e74c3c";
  deleteTimeBtn.style.color = "white";
  deleteTimeBtn.style.border = "none";
  deleteTimeBtn.style.borderRadius = "5px";
  deleteTimeBtn.style.padding = "4px 8px";
  deleteTimeBtn.style.cursor = "pointer";

  deleteTimeBtn.addEventListener("click", () => {
    timeWrapper.remove();
  });

  timeWrapper.appendChild(timeInput);
  timeWrapper.appendChild(deleteTimeBtn);
  timeInputsDiv.appendChild(timeWrapper);
});



  // Add one time input by default
  addTimeButton.click();

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "Delete";
  deleteBtn.style.backgroundColor = "#e74c3c";
  deleteBtn.style.color = "white";
  deleteBtn.style.border = "none";
  deleteBtn.style.borderRadius = "5px";
  deleteBtn.style.padding = "4px 8px";  // smaller padding
  deleteBtn.style.cursor = "pointer";
  deleteBtn.style.height = "30px"; // aligns with select height
  deleteBtn.style.marginTop = "0";

  deleteBtn.addEventListener("click", () => {
    scheduleContainer.remove();
  });

  // Wrap delete button and day select side by side, with delete first
  const dayDeleteWrapper = document.createElement("div");
  dayDeleteWrapper.style.display = "flex";
  dayDeleteWrapper.style.alignItems = "center";
  dayDeleteWrapper.style.gap = "8px";
  dayDeleteWrapper.style.marginRight = "10px";

  dayDeleteWrapper.appendChild(deleteBtn);
  dayDeleteWrapper.appendChild(daySelect);

  scheduleContainer.appendChild(dayDeleteWrapper);
  scheduleContainer.appendChild(timeInputsDiv);
  scheduleContainer.appendChild(addTimeButton);

  additionalSchedulesDiv.appendChild(scheduleContainer);
});




      document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = e.target.fullname.value.trim();
        const username = e.target.username.value.trim();
        const email = e.target.email.value.trim();
         const phoneInput = document.getElementById("phone").value;
        if (!/^\d+$/.test(phoneInput)) {
            alert("Please enter a valid phone number (digits only).");
            event.preventDefault();
        }
        
    
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;
        const gender = e.target.gender.value;
        const role = e.target.role.value;
        

        // Doctor-specific fields
       // const doctorName = e.target.doctorName?.value.trim();
        const specialization = e.target.specialization?.value.trim();
        const bio = e.target.bio?.value.trim();
        const availableDays = e.target.availableDays?.value.split(',').map(day => day.trim());
        const schedule = e.target.schedule?.value.split(',').map(time => time.trim());
        const licenseNumber = e.target.licenseNumber?.value.trim();

        // New hospital fields
        const hospitalName = e.target.hospitalName?.value.trim();
        const hospitalAddress = e.target.hospitalAddress?.value.trim();

        if (password !== confirmPassword) {
          alert("Password and Confirm Password must match.");
          return;
        }

        if (!validatePassword(password)) {
          alert("Password must be at least 8 characters long, include one uppercase letter and one number.");
          return;
        }

try {
  // Check for duplicate email or username
  const collectionRef = db.collection(role === "doctor" ? "doctors" : "patients");

  const emailSnapshot = await collectionRef.where("email", "==", email).get();
  if (!emailSnapshot.empty) {
    alert("An account with this email already exists.");
    return;
  }

  const usernameSnapshot = await collectionRef.where("username", "==", username).get();
  if (!usernameSnapshot.empty) {
    alert("Username is already taken.");
    return;
  }

  // Create user
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  const user = userCredential.user;

  await user.sendEmailVerification();

  alert("A verification email has been sent. Please verify your email before logging in.");

  // Hash password and prepare user data
  const hashedPassword = await hashPassword(password);
  const userData = {
    fullName,
    username,
    email,
    phone,
    gender,
    role,
    password: hashedPassword,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (role === "doctor") {
    const scheduleEntries = document.querySelectorAll("#additionalSchedules .schedule-input");
    const schedule = [];

    scheduleEntries.forEach(entry => {
      const day = entry.querySelector("select[name='scheduleDay']").value;
      const timeInputs = entry.querySelectorAll("input[name='scheduleTime']");
      const times = Array.from(timeInputs).map(input => input.value);
      if (day && times.length > 0) {
        schedule.push({ day, times });
      }
    });

    //userData.name = doctorName;
    userData.specialization = specialization;
    userData.bio = bio;
    userData.schedule = schedule;
    userData.licenseNumber = licenseNumber;
    userData.hospitalName = hospitalName;
    userData.hospitalAddress = hospitalAddress;
  }

  // Save user data immediately
  await db.collection(role === "doctor" ? "doctors" : "patients")
          .doc(user.uid)
          .set(userData);

  alert("Registration successful! Please verify your email before logging in.");
  window.location.href = "patientLogin.html";

} catch (error) {
  console.error("Registration Error:", error);
  alert("Error: " + error.message);
}

      });
    });

  function onlyNumberKey(evt) {
  var charCode = evt.which ? evt.which : evt.keyCode;
  if (charCode > 31 && (charCode < 48 || charCode > 57)) {
    evt.preventDefault();
    return false;
  }
  return true;
}
