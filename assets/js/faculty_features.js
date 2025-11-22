// assets/js/faculty_features.js
// Load as <script type="module" src="assets/js/faculty_features.js"></script>

// Paste your firebaseConfig (same as other files)
const firebaseConfig = {
  apiKey: "AIzaSyCmr6ohetgRU38w1UPf5WlviPc869MqrKE",
  authDomain: "aiml-portal.firebaseapp.com",
  projectId: "aiml-portal",
  storageBucket: "aiml-portal.firebasestorage.app",
  messagingSenderId: "976880421269",
  appId: "1:976880421269:web:33d16bf4147259032b4e9c",
  measurementId: "G-M8X3YJF1GK"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM elements
const noteTitleEl = document.getElementById("noteTitle");
const noteLinkEl = document.getElementById("noteLink");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const noteMsg = document.getElementById("noteMsg");

const announceTitleEl = document.getElementById("announceTitle");
const announceBodyEl = document.getElementById("announceBody");
const saveAnnouncementBtn = document.getElementById("saveAnnouncementBtn");
const announceMsg = document.getElementById("announceMsg");

const noticeTitleEl = document.getElementById("noticeTitle");
const noticeBodyEl = document.getElementById("noticeBody");
const noticeStudentListEl = document.getElementById("noticeStudentList");
const saveNoticeBtn = document.getElementById("saveNoticeBtn");
const noticeMsg = document.getElementById("noticeMsg");

const selectAllStudentsBtn = document.getElementById("selectAllStudentsBtn");
const clearAllStudentsBtn = document.getElementById("clearAllStudentsBtn");

let students = []; // array of { id, roll, name, prn, division }

// fetch and render students (subscribe real-time)
function subscribeStudentsForNotices() {
  const studentsCol = collection(db, "students");
  const q = query(studentsCol, orderBy("roll"));
  onSnapshot(q, (snapshot) => {
    students = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStudentCheckboxes();
  }, (err) => {
    noticeStudentListEl.innerHTML = `<p class="small muted">Failed to load students. Check console.</p>`;
    console.error("students subscription error:", err);
  });
}

function renderStudentCheckboxes() {
  if (!students || students.length === 0) {
    noticeStudentListEl.innerHTML = `<p class="small muted">No students found.</p>`;
    return;
  }
  noticeStudentListEl.innerHTML = "";
  students.forEach((s, idx) => {
    const id = s.id || "";
    const roll = s.roll || s.prn || "";
    const name = s.name || "";
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "6px";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = `notice-stu-${idx}`;
    cb.dataset.id = id;
    cb.dataset.roll = roll;
    cb.name = "notice-student";
    cb.style.marginRight = "8px";

    const label = document.createElement("label");
    label.htmlFor = cb.id;
    label.textContent = `${roll} — ${name}`;
    label.style.fontSize = "14px";

    wrapper.appendChild(cb);
    wrapper.appendChild(label);
    noticeStudentListEl.appendChild(wrapper);
  });
}

// helper to read selected student ids
function getSelectedStudentIds() {
  const checked = Array.from(noticeStudentListEl.querySelectorAll('input[name="notice-student"]:checked') || []);
  return checked.map(el => ({ studentId: el.dataset.id, roll: el.dataset.roll }));
}

// Save a Note (drive link)
saveNoteBtn.addEventListener("click", async () => {
  const title = (noteTitleEl.value || "").trim();
  const link = (noteLinkEl.value || "").trim();
  if (!title || !link) {
    noteMsg.textContent = "Provide both title and drive link.";
    return;
  }
  noteMsg.textContent = "Saving…";
  try {
    await addDoc(collection(db, "notes"), {
      title,
      driveLink: link,
      createdBy: "faculty", // you can set real faculty id if available
      createdAt: serverTimestamp()
    });
    noteMsg.textContent = "Saved.";
    noteTitleEl.value = "";
    noteLinkEl.value = "";
    setTimeout(()=> noteMsg.textContent = "", 3000);
  } catch (err) {
    console.error("save note error", err);
    noteMsg.textContent = "Failed to save. See console.";
  }
});

// Save announcement (broadcast)
saveAnnouncementBtn.addEventListener("click", async () => {
  const title = (announceTitleEl.value || "").trim();
  const body = (announceBodyEl.value || "").trim();
  if (!title || !body) {
    announceMsg.textContent = "Provide both title and body.";
    return;
  }
  announceMsg.textContent = "Publishing…";
  try {
    await addDoc(collection(db, "announcements"), {
      title,
      body,
      createdBy: "faculty",
      createdAt: serverTimestamp()
    });
    announceMsg.textContent = "Published.";
    announceTitleEl.value = "";
    announceBodyEl.value = "";
    setTimeout(()=> announceMsg.textContent = "", 3000);
  } catch (err) {
    console.error("save announcement error", err);
    announceMsg.textContent = "Failed to publish. See console.";
  }
});

// Send Notice (to selected students)
saveNoticeBtn.addEventListener("click", async () => {
  const title = (noticeTitleEl.value || "").trim();
  const body = (noticeBodyEl.value || "").trim();
  const selected = getSelectedStudentIds();
  if (!title || !body) {
    noticeMsg.textContent = "Provide title and body.";
    return;
  }
  if (!selected.length) {
    noticeMsg.textContent = "Select at least one student.";
    return;
  }
  noticeMsg.textContent = "Sending…";
  try {
    // create a notice doc and store recipients
    await addDoc(collection(db, "notices"), {
      title,
      body,
      recipients: selected.map(s => s.studentId), // array of Firestore student doc IDs
      recipientRolls: selected.map(s => s.roll),
      createdBy: "faculty",
      createdAt: serverTimestamp()
    });
    noticeMsg.textContent = `Notice sent to ${selected.length} student(s).`;
    noticeTitleEl.value = "";
    noticeBodyEl.value = "";
    // clear selection
    noticeStudentListEl.querySelectorAll('input[name="notice-student"]:checked').forEach(cb => cb.checked = false);
    setTimeout(()=> noticeMsg.textContent = "", 4000);
  } catch (err) {
    console.error("send notice error", err);
    noticeMsg.textContent = "Failed to send. See console.";
  }
});

// select all / clear all helpers
selectAllStudentsBtn.addEventListener("click", () => {
  noticeStudentListEl.querySelectorAll('input[name="notice-student"]').forEach(cb => cb.checked = true);
});
clearAllStudentsBtn.addEventListener("click", () => {
  noticeStudentListEl.querySelectorAll('input[name="notice-student"]').forEach(cb => cb.checked = false);
});

// start subscription
subscribeStudentsForNotices();
