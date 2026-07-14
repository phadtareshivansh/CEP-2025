// ====== FY Dashboard - Firebase Integration (Compat SDK) ======
// Uses shared firebase-config.js loaded before this script

const db = firebase.firestore();
const auth = firebase.auth();

// ====== Tab Switching ======
const tabs = document.querySelectorAll(".tab-btn");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(btn => {
  btn.addEventListener("click", () => {
    tabs.forEach(b => b.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ====== Attendance Form ======
const form = document.getElementById("attendanceForm");
const tableBody = document.getElementById("recordsTable");

form.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("studentName").value.trim();
  const roll = document.getElementById("rollNo").value.trim();
  const status = document.getElementById("status").value;
  const date = new Date().toLocaleDateString();

  if (!name || !roll) {
    alert("Please enter both name and roll number");
    return;
  }

  try {
    await db.collection("attendance").add({
      rollNo: roll,
      name: name,
      status: status,
      date: date,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("✅ Attendance saved to Firestore!");
    form.reset();
    fetchRecords();
  } catch (err) {
    console.error("❌ Error saving:", err);
    alert("Failed to save attendance. Check console for details.");
  }
});

// ====== Fetch Records ======
async function fetchRecords() {
  tableBody.innerHTML = "";
  try {
    const snapshot = await db.collection("attendance")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = `<tr>
        <td>${data.rollNo}</td>
        <td>${data.name}</td>
        <td>${data.status}</td>
        <td>${data.date}</td>
      </tr>`;
      tableBody.innerHTML += row;
    });
    updateAttendanceStats(snapshot);
  } catch (err) {
    console.error("❌ Error fetching:", err);
  }
}

// ====== Update Average Attendance ======
function updateAttendanceStats(snapshot) {
  let total = 0, present = 0;
  snapshot.forEach(doc => {
    total++;
    if (doc.data().status === "Present") present++;
  });
  const avg = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
  document.getElementById("avgAttendance").textContent = avg + "%";
}

// ====== Academic Chart ======
const ctx = document.getElementById("marksChart").getContext("2d");
new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Math", "Science", "English", "AI", "ML"],
    datasets: [{
      label: "Marks",
      data: [78, 85, 69, 90, 80],
      backgroundColor: "#3b82f6"
    }]
  },
  options: { responsive: true }
});

// ====== Load Data On Page Start ======
window.onload = fetchRecords;

// ====== Placeholder Features (to be implemented) ======
function uploadNotes() {
  alert("Upload Notes feature coming soon! Will save to Firebase Storage + Firestore 'notes' collection.");
}

function createAnnouncement() {
  alert("Announcements feature coming soon! Will write to Firestore 'notices' collection.");
}

function uploadAssignment() {
  alert("Assignment Upload feature coming soon! Will save to Firebase Storage + Firestore 'assignments' collection.");
}

// Make functions globally accessible for onclick handlers
window.uploadNotes = uploadNotes;
window.createAnnouncement = createAnnouncement;
window.uploadAssignment = uploadAssignment;