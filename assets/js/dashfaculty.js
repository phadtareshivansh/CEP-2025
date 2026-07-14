// Faculty Dashboard - Firebase Integration
// Uses shared auth.js and firebase-config.js

let db, auth;
let currentCourseStudents = [];

// Initialize Firebase
function initFirebase() {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    db = firebase.firestore();
    auth = firebase.auth();
    return true;
  }
  console.warn('Firebase not configured - using demo mode');
  return false;
}

// Show/hide sections
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
  const section = document.getElementById(sectionId);
  if (section) section.style.display = 'block';
  
  // Update sidebar active state
  document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar .nav-link[onclick*="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');
}

// ============ ATTENDANCE SYSTEM ============

// Load students for selected course
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  setupAttendanceListeners();
  
  // Check auth
  Auth.init((user) => {
    if (!user || (user.role !== 'faculty' && user.role !== 'admin')) {
      window.location.href = 'login.html';
    }
  });
});

function setupAttendanceListeners() {
  const courseSelect = document.getElementById('courseSelect');
  if (courseSelect) {
    courseSelect.addEventListener('change', loadStudentsForCourse);
    loadStudentsForCourse(); // Load default
  }
  
  const attendanceForm = document.getElementById('attendanceForm');
  if (attendanceForm) {
    attendanceForm.addEventListener('submit', saveAttendance);
  }
  
  const recommendBtn = document.getElementById('recommendBtn');
  if (recommendBtn) {
    recommendBtn.addEventListener('click', getProjectRecommendations);
  }
}

async function loadStudentsForCourse() {
  const courseSelect = document.getElementById('courseSelect');
  const table = document.getElementById('studentTable');
  const courseId = courseSelect.value;
  
  if (!courseId) return;
  
  table.innerHTML = '<tr><td colspan="4" class="text-center">Loading students...</td></tr>';
  
  try {
    if (db) {
      // Fetch from Firestore
      const studentsSnapshot = await db.collection('students')
        .where('courses', 'array-contains', courseId)
        .orderBy('rollNo')
        .get();
      
      currentCourseStudents = [];
      studentsSnapshot.forEach(doc => {
        currentCourseStudents.push({ id: doc.id, ...doc.data() });
      });
    } else {
      // Demo data fallback
      currentCourseStudents = getDemoStudents(courseId);
    }
    
    renderStudentTable(currentCourseStudents);
  } catch (error) {
    console.error('Error loading students:', error);
    currentCourseStudents = getDemoStudents(courseId);
    renderStudentTable(currentCourseStudents);
  }
}

function getDemoStudents(courseId) {
  const demoData = {
    AIML101: [
      { rollNo: 1, name: "Alice Johnson" },
      { rollNo: 2, name: "Bob Smith" },
      { rollNo: 3, name: "Charlie Brown" }
    ],
    AIML201: [
      { rollNo: 1, name: "David Wilson" },
      { rollNo: 2, name: "Eva Martinez" }
    ],
    AIML301: [
      { rollNo: 1, name: "Frank Anderson" },
      { rollNo: 2, name: "Grace Taylor" },
      { rollNo: 3, name: "Hannah Thomas" }
    ]
  };
  return demoData[courseId] || [];
}

function renderStudentTable(students) {
  const table = document.getElementById('studentTable');
  if (!students.length) {
    table.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No students enrolled in this course</td></tr>';
    return;
  }
  
  table.innerHTML = students.map(student => `
    <tr>
      <td>${student.rollNo}</td>
      <td>${student.name}</td>
      <td><input type="radio" name="att_${student.rollNo}" value="Present" required></td>
      <td><input type="radio" name="att_${student.rollNo}" value="Absent"></td>
    </tr>
  `).join('');
}

async function saveAttendance(e) {
  e.preventDefault();
  const courseSelect = document.getElementById('courseSelect');
  const courseId = courseSelect.value;
  const resultDiv = document.getElementById('attendanceResult');
  
  if (!currentCourseStudents.length) {
    alert('No students loaded');
    return;
  }
  
  const records = [];
  let hasErrors = false;
  
  currentCourseStudents.forEach(student => {
    const radio = document.querySelector(`input[name="att_${student.rollNo}"]:checked`);
    if (radio) {
      records.push({
        studentId: student.id || student.rollNo,
        studentName: student.name,
        rollNo: student.rollNo,
        status: radio.value
      });
    } else {
      hasErrors = true;
    }
  });
  
  if (hasErrors) {
    alert('Please mark attendance for all students');
    return;
  }
  
  const attendanceData = {
    courseId,
    date: new Date().toISOString().split('T')[0],
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    markedBy: Auth.getCurrentUser()?.uid || 'demo-faculty',
    records
  };
  
  try {
    if (db) {
      await db.collection('attendance').add(attendanceData);
    }
    
    resultDiv.style.display = 'block';
    resultDiv.className = 'mt-3 alert alert-success';
    resultDiv.innerHTML = `
      <strong>Attendance Saved for ${courseId}</strong><br>
      ${records.map(r => `${r.studentName} - ${r.status}`).join('<br>')}
      <br><small>Saved to ${db ? 'Firestore' : 'demo mode'}</small>
    `;
    
    // Reset form
    document.getElementById('attendanceForm').reset();
    loadStudentsForCourse();
  } catch (error) {
    console.error('Save attendance error:', error);
    resultDiv.style.display = 'block';
    resultDiv.className = 'mt-3 alert alert-danger';
    resultDiv.innerHTML = `Error saving attendance: ${error.message}`;
  }
}

// ============ PROJECT RECOMMENDER ============

async function getProjectRecommendations() {
  const skillsInput = document.getElementById('skills').value;
  const recommendationsList = document.getElementById('recommendations');
  
  if (!skillsInput.trim()) {
    alert('Please enter some skills');
    return;
  }
  
  const skills = skillsInput.split(',').map(s => s.trim().toLowerCase());
  recommendationsList.innerHTML = '<li class="list-group-item">Searching projects...</li>';
  
  try {
    let projects = [];
    
    if (db) {
      const snapshot = await db.collection('projects').get();
      projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Demo projects
      projects = [
        { title: 'AI Chatbot', tags: ['nlp', 'python', 'chatbot'], summary: 'Chatbot for student queries using NLP' },
        { title: 'ML Recommender', tags: ['ml', 'recommendation', 'python'], summary: 'Recommendation system for projects' },
        { title: 'Attendance AI', tags: ['computer-vision', 'face-recognition', 'opencv'], summary: 'Automated attendance using face recognition' },
        { title: 'Data Visualization Dashboard', tags: ['javascript', 'd3js', 'dashboard'], summary: 'Interactive data visualization dashboard' },
        { title: 'Sentiment Analysis', tags: ['nlp', 'machine-learning', 'twitter'], summary: 'Social media sentiment analysis tool' }
      ];
    }
    
    // Score projects based on skill match
    const scored = projects.map(p => {
      const projectTags = (p.tags || []).map(t => t.toLowerCase());
      const matches = skills.filter(s => projectTags.some(t => t.includes(s) || s.includes(t)));
      return { ...p, score: matches.length, matchedSkills: matches };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    // Filter to only show matches
    const matches = scored.filter(p => p.score > 0);
    
    if (matches.length === 0) {
      recommendationsList.innerHTML = '<li class="list-group-item text-muted">No matching projects found. Try different skills.</li>';
      return;
    }
    
    recommendationsList.innerHTML = matches.slice(0, 5).map(p => `
      <li class="list-group-item">
        <h6>${p.title}</h6>
        <small class="text-muted">${p.summary}</small>
        <div class="mt-1">
          ${p.matchedSkills.map(s => `<span class="badge bg-primary me-1">${s}</span>`).join('')}
          <span class="badge bg-success">Match: ${p.score}/${skills.length}</span>
        </div>
      </li>
    `).join('');
  } catch (error) {
    console.error('Recommendation error:', error);
    recommendationsList.innerHTML = '<li class="list-group-item text-danger">Error loading recommendations</li>';
  }
}

// ============ COURSES & ASSIGNMENTS ============

async function addCourse() {
  const name = prompt('Enter course name:');
  if (!name) return;
  
  const code = prompt('Enter course code (e.g., AIML401):');
  if (!code) return;
  
  try {
    if (db) {
      await db.collection('courses').add({
        code,
        name,
        facultyId: Auth.getCurrentUser()?.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Course added!');
      loadMyCourses();
    } else {
      addToList('courseList', `${code} - ${name}`);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function addAssignment() {
  const courseId = prompt('Enter course code:');
  if (!courseId) return;
  
  const title = prompt('Assignment title:');
  if (!title) return;
  
  const dueDate = prompt('Due date (YYYY-MM-DD):');
  if (!dueDate) return;
  
  try {
    if (db) {
      await db.collection('assignments').add({
        courseId,
        title,
        dueDate,
        createdBy: Auth.getCurrentUser()?.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      alert('Assignment added!');
      loadAssignments();
    } else {
      addToList('assignmentList', `${courseId}: ${title} (Due: ${dueDate})`);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function addToList(listId, text) {
  const list = document.getElementById(listId);
  if (list) {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = text;
    list.appendChild(li);
  }
}

async function loadMyCourses() {
  const list = document.getElementById('courseList');
  if (!list) return;
  
  list.innerHTML = '<li class="list-group-item">Loading...</li>';
  
  try {
    if (db) {
      const user = Auth.getCurrentUser();
      if (user) {
        const snapshot = await db.collection('courses')
          .where('facultyId', '==', user.uid)
          .get();
        
        list.innerHTML = '';
        snapshot.forEach(doc => {
          const c = doc.data();
          addToList('courseList', `${c.code} - ${c.name}`);
        });
        if (snapshot.empty) {
          list.innerHTML = '<li class="list-group-item text-muted">No courses assigned</li>';
        }
      }
    }
  } catch (error) {
    list.innerHTML = '<li class="list-group-item text-danger">Error loading courses</li>';
  }
}

async function loadAssignments() {
  const list = document.getElementById('assignmentList');
  if (!list) return;
  
  list.innerHTML = '<li class="list-group-item">Loading...</li>';
  
  try {
    if (db) {
      const snapshot = await db.collection('assignments')
        .where('createdBy', '==', Auth.getCurrentUser()?.uid)
        .orderBy('dueDate')
        .get();
      
      list.innerHTML = '';
      snapshot.forEach(doc => {
        const a = doc.data();
        addToList('assignmentList', `${a.courseId}: ${a.title} (Due: ${a.dueDate})`);
      });
      if (snapshot.empty) {
        list.innerHTML = '<li class="list-group-item text-muted">No assignments</li>';
      }
    }
  } catch (error) {
    list.innerHTML = '<li class="list-group-item text-danger">Error loading assignments</li>';
  }
}

// Load courses/assignments when section shown
document.addEventListener('click', (e) => {
  if (e.target.matches('[onclick*="courses"]')) {
    setTimeout(() => { loadMyCourses(); loadAssignments(); }, 100);
  }
});

// ============ REPORTS ============

function generateReport(type) {
  alert(`${type.charAt(0).toUpperCase() + type.slice(1)} report generation coming soon!\nWill query Firestore and generate PDF/Excel export.`);
}

// ============ CHATBOT ============

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  const text = input.value.trim();
  
  if (!text) return;
  
  // Add user message
  messages.innerHTML += `<div class="message user-message"><strong>You:</strong> ${text}</div>`;
  input.value = '';
  messages.scrollTop = messages.scrollHeight;
  
  // Simulate bot response
  setTimeout(() => {
    let response = "I'm still learning! Connect me to Dialogflow or OpenAI for real responses.";
    
    const lower = text.toLowerCase();
    if (lower.includes('attendance')) response = 'Attendance records are in the Attendance section.';
    else if (lower.includes('project')) response = 'Check the Project Recommender for project ideas.';
    else if (lower.includes('course')) response = 'Your courses are in Courses & Assignments.';
    else if (lower.includes('assignment')) response = 'Assignments can be managed in Courses & Assignments.';
    else if (lower.includes('report')) response = 'Reports section has attendance, project, and performance reports.';
    
    messages.innerHTML += `<div class="message bot-message"><strong>Bot:</strong> ${response}</div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 500);
}

// ============ SETTINGS ============

function updateProfile() {
  const name = document.getElementById('nameInput').value;
  if (name) {
    alert('Profile updated! (Firebase user profile update would go here)');
  }
}

// ============ FACULTY NOTES ============

// Load notes when section shown
document.addEventListener('click', (e) => {
  if (e.target.matches('[onclick*="notes"]')) {
    setTimeout(() => { loadFacultyNotes(); }, 100);
  }
});

async function loadFacultyNotes() {
  const grid = document.getElementById('notesGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  try {
    if (db) {
      const user = Auth.getCurrentUser();
      if (user) {
        const snapshot = await db.collection('notes')
          .where('facultyId', '==', user.uid)
          .orderBy('createdAt', 'desc')
          .get();
        
        if (snapshot.empty) {
          grid.innerHTML = '<div class="col-12 text-center text-muted py-4">No notes yet. Click "Add Note" to create one.</div>';
          return;
        }
        
        grid.innerHTML = '';
        snapshot.forEach(doc => {
          const note = doc.data();
          grid.appendChild(createNoteCard(doc.id, note));
        });
      }
    }
  } catch (error) {
    console.error('Load notes error:', error);
    grid.innerHTML = '<div class="col-12 text-center text-danger">Error loading notes</div>';
  }
}

function createNoteCard(docId, note) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4 mb-3';
  col.innerHTML = `
    <div class="card note-card h-100">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="card-title mb-0">${note.title}</h6>
          <span class="badge bg-${note.isImportant ? 'warning' : 'secondary'}">${note.isImportant ? 'Important' : 'General'}</span>
        </div>
        <p class="card-text small text-muted">${note.course || 'General'}</p>
        <div class="note-content">${note.content}</div>
        ${note.importantPoints && note.importantPoints.length ? `
          <div class="mt-2 p-2 bg-light rounded">
            <strong class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Important Points:</strong>
            <ul class="mb-0 mt-1 small">
              ${note.importantPoints.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      <div class="card-footer bg-transparent border-0 pt-0">
        <div class="btn-group w-100">
          <button class="btn btn-sm btn-outline-primary" onclick="editNote('${docId}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteNote('${docId}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `;
  return col;
}

// Handle note form submission
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('addNoteForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const title = formData.get('title');
      const course = formData.get('courseId');
      const content = formData.get('content');
      const importantPoints = formData.get('impPoints')
        .split('\n')
        .map(p => p.trim())
        .filter(p => p);
      const type = formData.get('type');
      const isPublic = formData.get('isPublic') === 'on';
      
      try {
        if (db) {
          const user = Auth.getCurrentUser();
          await db.collection('notes').add({
            title,
            courseId: course,
            content,
            importantPoints,
            type,
            isPublic,
            facultyId: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        
        Toast.success('Note added successfully!');
        bootstrap.Modal.getInstance(document.getElementById('addNoteModal')).hide();
        form.reset();
        loadFacultyNotes();
      } catch (error) {
        Toast.error('Error adding note: ' + error.message);
      }
    });
  }
});

async function editNote(docId) {
  try {
    const doc = await db.collection('notes').doc(docId).get();
    if (!doc.exists) return;
    
    const note = doc.data();
    document.querySelector('[name="title"]').value = note.title;
    document.querySelector('[name="courseId"]').value = note.course || '';
    document.querySelector('[name="content"]').value = note.content;
    document.querySelector('[name="impPoints"]').value = (note.importantPoints || []).join('\n');
    document.querySelector('[name="isPublic"]').checked = note.isImportant || false;
    
    // Change form to edit mode
    const form = document.getElementById('addNoteForm');
    form.dataset.editId = docId;
    form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save me-1"></i>Update Note';
    
    new bootstrap.Modal(document.getElementById('addNoteModal')).show();
  } catch (error) {
    Toast.error('Error loading note: ' + error.message);
  }
}

async function deleteNote(docId) {
  if (!confirm('Delete this note?')) return;
  
  try {
    if (db) {
      await db.collection('notes').doc(docId).delete();
      Toast.success('Note deleted');
      loadFacultyNotes();
    }
  } catch (error) {
    Toast.error('Error deleting note: ' + error.message);
  }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  initFirebase();
});