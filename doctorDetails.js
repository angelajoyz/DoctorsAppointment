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
const storage = firebase.storage();

let isEditMode = false;

function toggleMenu() {
  document.getElementById("sidebarMenu").classList.toggle("active");
}

// Function to display custom alerts (instead of default browser alerts)
function showCustomAlert(message, isSuccess = false) {
  let alertDiv = document.getElementById('custom-alert');
  if (!alertDiv) {
    alertDiv = document.createElement('div');
    alertDiv.id = 'custom-alert';
    // Add basic styling for the custom alert
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #f44336; /* Red for errors */
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      text-align: center;
      min-width: 300px;
    `;
    document.body.appendChild(alertDiv);
  }

  alertDiv.textContent = message;
  alertDiv.style.backgroundColor = isSuccess ? "#4CAF50" : "#f44336"; // Green for success, Red for error
  alertDiv.style.opacity = 1;

  setTimeout(() => {
    alertDiv.style.opacity = 0;
    // Optional: remove the element after it fades out
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 500);
  }, 5000); // Alert disappears after 5 seconds
}


document.addEventListener('DOMContentLoaded', () => {
  // Image click
  document.getElementById("profileImage").addEventListener("click", () => {
    if (isEditMode) document.getElementById("imageUpload").click();
  });

  // Image upload
  document.getElementById("imageUpload").addEventListener("change", function () {
    const file = this.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64Image = e.target.result;
      document.getElementById("profileImage").src = base64Image;

      const user = auth.currentUser;
      if (user) {
        db.collection("doctors").doc(user.uid).update({
          profileImageURL: base64Image
        }).then(() => {
          console.log("Base64 image saved to Firestore");
          showCustomAlert("Profile image updated successfully!", true); // Custom alert for success
        }).catch(err => {
          console.error("Error saving base64 image:", err);
          showCustomAlert("Failed to update profile image. Please try again.", false); // Custom alert for error
        });
      }
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  });
});


function enableEditing() {
  document.querySelectorAll("input").forEach(input => {
    if (input.id !== "email") input.disabled = false;
  });
  document.getElementById('fullName').disabled = false;
  document.getElementById('username').disabled = false;
  document.getElementById('phone').disabled = false;
  document.getElementById('gender').disabled = false;
  document.getElementById('specialization').disabled = false; // ✅ ADD THIS
  document.getElementById("bio").disabled = false;
  document.getElementById("imageUpload").disabled = false;
  document.getElementById("editBtn").style.display = "none";
  document.getElementById("saveBtn").style.display = "inline-block";
  isEditMode = true;

  const user = auth.currentUser;
  if (user) {
    db.collection("doctors").doc(user.uid).get().then(doc => {
      const data = doc.data();
      const schedule = data.schedule && Array.isArray(data.schedule) ? data.schedule : [];
      renderDoctorSchedule(schedule); // ✅ Always render the schedule section
    });
  }
}

function saveProfile() {
  const user = auth.currentUser;
  if (!user) {
    showCustomAlert("No user logged in. Please log in to save changes."); // Custom alert
    return;
  }

  const updatedData = {
    fullName: document.getElementById("fullName").value.trim(),
    username: document.getElementById("username").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    gender: document.getElementById("gender").value.trim(),
    specialization: document.getElementById("specialization").value.trim(),
    bio: document.getElementById("bio").value.trim(),
    profileImageURL: document.getElementById("profileImage").src,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  db.collection("doctors").doc(user.uid).update(updatedData)
    .then(async () => {
      // 🔥 Call this to save the schedule too!
      await saveScheduleToFirestore();

      showCustomAlert("Profile and schedule updated successfully!", true); // Custom alert for success

      document.getElementById("fullNameDisplay").textContent = updatedData.fullName;
      document.getElementById("specializationDisplay").textContent = updatedData.specialization;

      document.querySelectorAll("input").forEach(i => i.disabled = true);
      document.getElementById("bio").disabled = true;
      document.getElementById("imageUpload").disabled = true;

      document.getElementById("editBtn").style.display = "inline-block";
      document.getElementById("saveBtn").style.display = "none";

      isEditMode = false;
    })
    .catch(error => {
      showCustomAlert("Error saving profile: " + error.message, false); // Custom alert for error
    });
}

function loadProfile(uid) {
  db.collection("doctors").doc(uid).get().then(doc => {
    if (!doc.exists) return;

    const data = doc.data();
    document.getElementById("fullName").value = data.fullName || "";
    document.getElementById("username").value = data.username || "";
    document.getElementById("phone").value = data.phone || "";
    document.getElementById("gender").value = data.gender || "";
    document.getElementById("specialization").value = data.specialization || "";
    document.getElementById("bio").value = data.bio || "";
    document.getElementById("email").textContent = data.email || "";
    document.getElementById("fullNameDisplay").textContent = data.fullName || "No Name";
    document.getElementById("specializationDisplay").textContent = data.specialization || "";
    if (data.profileImageURL) {
      document.getElementById("profileImage").src = data.profileImageURL;
    } else if (data.email) {
      const hash = md5(data.email.trim().toLowerCase());
      document.getElementById("profileImage").src = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
    }
    if (data.schedule && Array.isArray(data.schedule)) {
      renderDoctorSchedule(data.schedule);
    }
  });
}

auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadProfile(user.uid);
  }
});

function renderDoctorSchedule(schedule) {
  console.log("👉 Add Schedule button clicked!");
  console.log("✅ renderDoctorSchedule was called with schedule:", schedule);
  const container = document.getElementById('doctorScheduleEdit');
  container.innerHTML = ''; // Clear old content

  if (schedule.length > 0) {
    const header = document.createElement('h3');
    header.textContent = 'Current Schedule';
    header.style.marginBottom = '12px';
    container.appendChild(header);
  }

  schedule.forEach((entry, index) => {
    const scheduleDiv = document.createElement('div');
    scheduleDiv.classList.add('schedule-input');
    scheduleDiv.style.marginBottom = '12px';
    scheduleDiv.style.display = 'block';

    const daySelect = document.createElement('select');
    daySelect.name = `scheduleDay_${index}`;
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    days.forEach(day => {
      const option = document.createElement('option');
      option.value = day;
      option.textContent = day;
      if (day === entry.day) option.selected = true;
      daySelect.appendChild(option);
    });

    function parseTime(timeStr) {
      const [time, period] = timeStr.split(' ');
      const [hour] = time.split(':');
      return {
        hour: parseInt(hour),
        period
      };
    }

    const start = parseTime(entry.startTime);
    const end = parseTime(entry.endTime);

    // Helper: Create hour select
    function createHourSelect(name, selectedHour) {
      const select = document.createElement('select');
      select.name = name;
      for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === selectedHour) option.selected = true;
        select.appendChild(option);
      }
      return select;
    }

    // Helper: Create AM/PM select
    function createPeriodSelect(name, selectedPeriod) {
      const select = document.createElement('select');
      select.name = name;
      ['AM', 'PM'].forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        if (p === selectedPeriod) option.selected = true;
        select.appendChild(option);
      });
      return select;
    }

    const startHourSelect = createHourSelect(`startHour_${index}`, start.hour);
    const startPeriodSelect = createPeriodSelect(`startPeriod_${index}`, start.period);
    const endHourSelect = createHourSelect(`endHour_${index}`, end.hour);
    const endPeriodSelect = createPeriodSelect(`endPeriod_${index}`, end.period);


    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.title = 'Delete this schedule';
    deleteBtn.style.marginLeft = '10px';
    deleteBtn.style.backgroundColor = '#ff4d4d';
    deleteBtn.style.border = 'none';
    deleteBtn.style.color = 'white';
    deleteBtn.style.padding = '4px 8px';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.height = '30px'; // Align button height with selects
    deleteBtn.addEventListener('click', () => {
      scheduleDiv.remove();
    });

    // Container for time selects + delete button
    const timeWrapper = document.createElement('div');
    timeWrapper.style.display = 'flex';
    timeWrapper.style.gap = '8px';
    timeWrapper.style.alignItems = 'center';

    // Append all in one line
    timeWrapper.append(
      document.createTextNode('Start:'),
      startHourSelect,
      startPeriodSelect,
      document.createTextNode('End:'),
      endHourSelect,
      endPeriodSelect,
      deleteBtn
    );

    // Container for times (optional margin top)
    const timesContainer = document.createElement('div');
    timesContainer.style.marginTop = '8px';
    timesContainer.appendChild(timeWrapper);

    // Add everything to scheduleDiv
    const rowWrapper = document.createElement('div');
    rowWrapper.style.display = 'flex';
    rowWrapper.style.gap = '8px';
    rowWrapper.style.alignItems = 'center';
    rowWrapper.style.marginBottom = '8px';

    daySelect.style.minWidth = '120px';

    rowWrapper.appendChild(daySelect);
    rowWrapper.appendChild(timeWrapper);

    scheduleDiv.appendChild(rowWrapper);


    // Disable inputs if not in edit mode
    if (!isEditMode) {
      daySelect.disabled = true;
      startHourSelect.disabled = true;
      startPeriodSelect.disabled = true;
      endHourSelect.disabled = true;
      endPeriodSelect.disabled = true;
      deleteBtn.style.display = 'none'; // Hide delete button in view-only mode
    }

    container.appendChild(scheduleDiv);
  });

  // Add button to add new blank schedule row
  const addScheduleBtn = document.createElement('button');
  addScheduleBtn.textContent = 'Add Schedule';
  addScheduleBtn.classList.add('schedule-add-btn');
  addScheduleBtn.style.marginTop = '12px';
  addScheduleBtn.addEventListener('click', () => {
    addEmptyScheduleInput(container);
  });
  addScheduleBtn.disabled = !isEditMode;
  container.appendChild(addScheduleBtn);
}


// Helper to add empty schedule input block
function addEmptyScheduleInput(container) {
  const index = container.querySelectorAll('.schedule-input').length;
  const scheduleDiv = document.createElement('div');
  scheduleDiv.classList.add('schedule-input');
  scheduleDiv.style.marginBottom = '12px';

  // Day select
  const daySelect = document.createElement('select');
  daySelect.name = `scheduleDay_${index}`;
  daySelect.style.minWidth = '120px'; // Match current schedule layout
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  days.forEach(day => {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  });

  // Time selectors helpers
  function createHourSelect(name, selectedHour = 9) {
    const select = document.createElement('select');
    select.name = name;
    for (let i = 1; i <= 12; i++) {
      const option = document.createElement('option');
      option.value = i;
      option.textContent = i;
      if (i === selectedHour) option.selected = true;
      select.appendChild(option);
    }
    return select;
  }

  function createPeriodSelect(name, selectedPeriod = 'AM') {
    const select = document.createElement('select');
    select.name = name;
    ['AM', 'PM'].forEach(p => {
      const option = document.createElement('option');
      option.value = p;
      option.textContent = p;
      if (p === selectedPeriod) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  const startHourSelect = createHourSelect(`startHour_${index}`, 9);
  const startPeriodSelect = createPeriodSelect(`startPeriod_${index}`, 'AM');
  const endHourSelect = createHourSelect(`endHour_${index}`, 5);
  const endPeriodSelect = createPeriodSelect(`endPeriod_${index}`, 'PM');

  // Delete button styled exactly the same
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.title = 'Delete this schedule';
  deleteBtn.style.marginLeft = '10px';
  deleteBtn.style.backgroundColor = '#ff4d4d';
  deleteBtn.style.border = 'none';
  deleteBtn.style.color = 'white';
  deleteBtn.style.padding = '4px 8px';
  deleteBtn.style.borderRadius = '4px';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.style.height = '30px';
  deleteBtn.addEventListener('click', () => {
    scheduleDiv.remove();
  });

  // timeWrapper with flex and gap 8px, align center
  const timeWrapper = document.createElement('div');
  timeWrapper.style.display = 'flex';
  timeWrapper.style.gap = '8px';
  timeWrapper.style.alignItems = 'center';

  timeWrapper.append(
    document.createTextNode('Start:'),
    startHourSelect,
    startPeriodSelect,
    document.createTextNode('End:'),
    endHourSelect,
    endPeriodSelect,
    deleteBtn
  );

  // rowWrapper for daySelect + timeWrapper, same styles as current schedule rows
  const rowWrapper = document.createElement('div');
  rowWrapper.style.display = 'flex';
  rowWrapper.style.gap = '8px';
  rowWrapper.style.alignItems = 'center';
  rowWrapper.style.marginBottom = '8px';

  rowWrapper.appendChild(daySelect);
  rowWrapper.appendChild(timeWrapper);

  scheduleDiv.appendChild(rowWrapper);
  container.appendChild(scheduleDiv);
}

// Save function — collects all inputs and updates Firestore
async function saveScheduleToFirestore() {
  const user = auth.currentUser;
  if (!user) {
    showCustomAlert('User not logged in. Please log in to update schedule.', false); // Custom alert
    return;
  }
  const doctorId = user.uid; // ← ito ang dinagdag

  const container = document.getElementById('doctorScheduleEdit');
  const scheduleDivs = container.querySelectorAll('.schedule-input');

  const newSchedule = [];

  scheduleDivs.forEach((div, index) => {
    const day = div.querySelector(`select[name="scheduleDay_${index}"]`)?.value;
    const startHour = parseInt(div.querySelector(`select[name="startHour_${index}"]`)?.value);
    const startPeriod = div.querySelector(`select[name="startPeriod_${index}"]`)?.value;
    const endHour = parseInt(div.querySelector(`select[name="endHour_${index}"]`)?.value);
    const endPeriod = div.querySelector(`select[name="endPeriod_${index}"]`)?.value;

    if (day && startHour && startPeriod && endHour && endPeriod) {
      // Format time strings like "10:00 AM"
      const startTime = `${startHour}:00 ${startPeriod}`;
      const endTime = `${endHour}:00 ${endPeriod}`;

      newSchedule.push({
        day,
        startTime,
        endTime
      });
    }
  });

  // Optional: validate schedule (e.g. start < end, no overlaps)

  try {
    await db.collection('doctors').doc(doctorId).update({
      schedule: newSchedule
    });

    showCustomAlert('Schedule updated successfully!', true); // Custom alert for success

    // After save, disable edit mode
    isEditMode = false;

    // Disable inputs and buttons again after save
    renderDoctorSchedule(newSchedule); // Rerender para ma-disable ang inputs at button

    // Hide the save schedule button


  } catch (error) {
    console.error('Error updating schedule:', error);
    showCustomAlert('Failed to update schedule. Please try again.', false); // Custom alert for error
  }
}
