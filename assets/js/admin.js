// Admin Panel - Complete Implementation
// Uses Firebase via auth.js and firebase-config.js

let db, auth;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  
  Auth.init((user) => {
    if (!user || user.role !== 'admin') {
      window.location.href = 'login.html';
      return;
    }
    currentUser = user;
    loadAdminDashboard();
  });
});

function initFirebase() {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    db = firebase.firestore();
    auth = firebase.auth();
    return true;
  }
  return false;
}

// ============ SECTION NAVIGATION ============
function showAdminSection(sectionName) {
  document.querySelectorAll('.admin-section').forEach(sec => sec.style.display = 'none');
  
  const section = document.getElementById(`${sectionName}-section`);
  if (section) section.style.display = 'block';
  
  document.querySelectorAll('.admin-sidebar .nav-link').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.admin-sidebar .nav-link[onclick*="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Load section data
  switch(sectionName) {
    case 'dashboard': loadDashboardStats(); loadRecentActivity(); loadSystemAlerts(); break;
    case 'users': loadUsers(); break;
    case 'faculty': loadFaculty(); break;
    case 'students': loadStudents(); loadFacultyForDropdown(); break;
    case 'courses': loadCourses(); loadFacultyForDropdown(); break;
    case 'notices': loadNotices(); break;
    case 'projects': loadProjects(); break;
    case 'attendance': loadAttendanceStats(); loadCoursesForFilter(); break;
    case 'analytics': loadAnalytics(); break;
    case 'settings': checkFirebaseConfig(); break;
  }
}

async function loadAdminDashboard() {
  document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
  loadDashboardStats();
  loadRecentActivity();
  loadSystemAlerts();
}

async function loadDashboardStats() {
  try {
    if (!db) return;
    
    const [usersSnap, facultySnap, studentsSnap, projectsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('users').where('role', '==', 'faculty').get(),
      db.collection('users').where('role', '==', 'student').get(),
      db.collection('projects').where('status', 'in', ['Submitted', 'In Progress']).get()
    ]);
    
    document.getElementById('statUsers').textContent = usersSnap.size;
    document.getElementById('statFaculty').textContent = facultySnap.size;
    document.getElementById('statStudents').textContent = studentsSnap.size;
    document.getElementById('statProjects').textContent = projectsSnap.size;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

async function loadRecentActivity() {
  const container = document.getElementById('recentActivity');
  
  try {
    if (!db) {
      container.innerHTML = '<div class="alert alert-warning">Firebase not configured</div>';
      return;
    }
    
    // Get recent activity from multiple collections
    const [noticesSnap, projectsSnap, attendanceSnap] = await Promise.all([
      db.collection('notices').orderBy('date', 'desc').limit(5).get(),
      db.collection('projects').orderBy('submittedAt', 'desc').limit(5).get(),
      db.collection('attendance').orderBy('timestamp', 'desc').limit(5).get()
    ]);
    
    const activities = [];
    
    noticesSnap.docs.forEach(doc => {
      const d = doc.data();
      activities.push({
        time: d.date || d.timestamp?.toDate?.() || new Date(),
        type: 'notice',
        icon: 'fa-bullhorn',
        color: 'primary',
        title: d.title,
        desc: `New ${d.category || 'notice'} published`
      });
    });
    
    projectsSnap.docs.forEach(doc => {
      const d = doc.data();
      activities.push({
        time: d.submittedAt || d.timestamp?.toDate?.() || new Date(),
        type: 'project',
        icon: 'fa-project-diagram',
        color: 'success',
        title: d.title,
        desc: `Project ${d.status} by ${d.studentName}`
      });
    });
    
    attendanceSnap.docs.forEach(doc => {
      const d = doc.data();
      activities.push({
        time: d.timestamp?.toDate?.() || new Date(d.date),
        type: 'attendance',
        icon: 'fa-calendar-check',
        color: 'info',
        title: d.courseId,
        desc: `Attendance marked for ${d.records?.length || 0} students`
      });
    });
    
    // Sort by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    container.innerHTML = activities.slice(0, 10).map(a => `
      <div class="d-flex mb-3 p-2 border-start border-3 border-${a.color} bg-light">
        <div class="me-3 text-${a.color}"><i class="fas ${a.icon} fa-lg"></i></div>
        <div class="flex-grow-1">
          <div class="fw-bold">${a.title}</div>
          <small class="text-muted">${a.desc}</small>
        </div>
        <small class="text-muted">${formatRelativeTime(a.time)}</small>
      </div>
    `).join('') || '<p class="text-muted text-center">No recent activity</p>';
  } catch (error) {
    console.error('Load activity error:', error);
    container.innerHTML = '<div class="alert alert-danger">Error loading activity</div>';
  }
}

function loadSystemAlerts() {
  const container = document.getElementById('systemAlerts');
  
  // Check Firebase config
  const firebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
  
  container.innerHTML = `
    ${!firebaseConfigured ? `
      <div class="alert alert-warning d-flex justify-content-between align-items-center">
        <div><i class="fas fa-exclamation-triangle me-2"></i>Firebase not configured. Update firebase-config.js</div>
      </div>
    ` : ''}
    <div class="alert alert-info d-flex justify-content-between align-items-center">
      <div><i class="fas fa-info-circle me-2"></i>Admin panel running in ${firebaseConfigured ? 'production' : 'demo'} mode</div>
    </div>
    <div class="alert alert-secondary d-flex justify-content-between align-items-center">
      <div><i class="fas fa-clock me-2"></i>Last backup: ${localStorage.getItem('lastBackup') || 'Never'}</div>
    </div>
  `;
}

function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ============ USER MANAGEMENT ============
async function loadUsers() {
  const tbody = document.querySelector('#usersTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    
    tbody.innerHTML = snapshot.docs.map(doc => {
      const u = doc.data();
      return `<tr>
        <td>${u.name || u.displayName || '-'}</td>
        <td>${u.email}</td>
        <td><span class="badge bg-${getRoleColor(u.role)}">${u.role}</span></td>
        <td><span class="badge bg-${u.disabled ? 'danger' : 'success'}">${u.disabled ? 'Disabled' : 'Active'}</span></td>
        <td>${u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editUser('${doc.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-${u.disabled ? 'success' : 'warning'}" onclick="toggleUserStatus('${doc.id}', ${u.disabled})"><i class="fas fa-${u.disabled ? 'check' : 'ban'}"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${doc.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center">No users found</td></tr>';
  } catch (error) {
    console.error('Load users error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading users</td></tr>';
  }
}

function getRoleColor(role) {
  const colors = { admin: 'danger', faculty: 'primary', student: 'success' };
  return colors[role] || 'secondary';
}

// ============ FACULTY MANAGEMENT ============
async function loadFaculty() {
  const grid = document.getElementById('facultyGrid');
  grid.innerHTML = '<div class="col-12 text-center">Loading...</div>';
  
  try {
    if (!db) {
      grid.innerHTML = '<div class="col-12 text-center text-warning">Firebase not configured</div>';
      return;
    }
    
    const snapshot = await db.collection('faculty').orderBy('name').get();
    
    grid.innerHTML = snapshot.docs.map(doc => {
      const f = doc.data();
      return `<div class="col-md-4">
        <div class="card faculty-admin-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-start">
              <img src="${f.image || 'https://via.placeholder.com/80'}" class="rounded-circle me-3" style="width:80px;height:80px;object-fit:cover;">
              <div class="flex-grow-1">
                <h5 class="mb-1">${f.name}</h5>
                <p class="text-muted mb-1">${f.role}</p>
                <small class="text-muted">${f.department}</small>
              </div>
            </div>
            <div class="mt-3 pt-3 border-top">
              <div class="d-flex gap-1 mb-2">
                ${f.linkedin ? `<a href="${f.linkedin}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="fab fa-linkedin"></i></a>` : ''}
                ${f.website ? `<a href="${f.website}" target="_blank" class="btn btn-sm btn-outline-secondary"><i class="fas fa-globe"></i></a>` : ''}
                ${f.scholar ? `<a href="${f.scholar}" target="_blank" class="btn btn-sm btn-outline-dark"><i class="fas fa-graduation-cap"></i></a>` : ''}
              </div>
              <div class="btn-group w-100">
                <button class="btn btn-sm btn-outline-primary" onclick="editFaculty('${doc.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFaculty('${doc.id}')"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    }).join('') || '<div class="col-12 text-center text-muted">No faculty profiles</div>';
  } catch (error) {
    console.error('Load faculty error:', error);
    grid.innerHTML = '<div class="col-12 text-center text-danger">Error loading faculty</div>';
  }
}

async function loadFacultyForDropdown() {
  if (!db) return;
  
  try {
    const snapshot = await db.collection('faculty').orderBy('name').get();
    const options = snapshot.docs.map(doc => {
      const f = doc.data();
      return `<option value="${doc.id}">${f.name} (${f.role})</option>`;
    }).join('');
    
    document.querySelectorAll('[name="facultyId"]').forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '<option value="">Select Faculty</option>' + options;
      if (current) sel.value = current;
    });
  } catch (error) {
    console.error('Load faculty dropdown error:', error);
  }
}

// ============ STUDENTS MANAGEMENT ============
async function loadStudents() {
  const tbody = document.querySelector('#studentsTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    const snapshot = await db.collection('students').orderBy('rollNo').get();
    
    tbody.innerHTML = snapshot.docs.map(doc => {
      const s = doc.data();
      return `<tr>
        <td>${s.rollNo}</td>
        <td>${s.name}</td>
        <td>${s.email}</td>
        <td>${getYearLabel(s.year)}</td>
        <td>${s.division || '-'}</td>
        <td><span class="badge bg-${s.active ? 'success' : 'secondary'}">${s.active ? 'Active' : 'Inactive'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editStudent('${doc.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent('${doc.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="text-center">No students</td></tr>';
  } catch (error) {
    console.error('Load students error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading students</td></tr>';
  }
}

function getYearLabel(year) {
  const labels = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
  return labels[year] || year;
}

function downloadCSVTemplate() {
  const csv = 'rollNo,name,email,year,division,course\nAIML2023001,John Doe,john@student.edu,2,A,B.Tech AIML\nAIML2023002,Jane Smith,jane@student.edu,2,A,B.Tech AIML';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'student-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportStudents() {
  alert('Export students to CSV - implement with Firestore query + CSV generation');
}

function importStudentsCSV() {
  const file = document.getElementById('csvFile').files[0];
  if (!file) return alert('Select a CSV file');
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    const text = e.target.result;
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    try {
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const student = {};
        headers.forEach((h, idx) => student[h] = values[idx]);
        
        student.year = parseInt(student.year);
        student.active = true;
        student.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('students').add(student);
      }
      alert(`Imported ${lines.length - 1} students`);
      bootstrap.Modal.getInstance(document.getElementById('importStudentsModal')).hide();
      loadStudents();
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// ============ COURSES ============
async function loadCourses() {
  const tbody = document.querySelector('#coursesTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    const [coursesSnap, facultySnap] = await Promise.all([
      db.collection('courses').orderBy('code').get(),
      db.collection('faculty').get()
    ]);
    
    const facultyMap = {};
    facultySnap.docs.forEach(doc => facultyMap[doc.id] = doc.data().name);
    
    tbody.innerHTML = coursesSnap.docs.map(doc => {
      const c = doc.data();
      return `<tr>
        <td>${c.code}</td>
        <td>${c.name}</td>
        <td>${facultyMap[c.facultyId] || c.facultyId || 'Unassigned'}</td>
        <td>${getYearLabel(c.year)}</td>
        <td>${c.students?.length || 0}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editCourse('${doc.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteCourse('${doc.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center">No courses</td></tr>';
  } catch (error) {
    console.error('Load courses error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading courses</td></tr>';
  }
}

async function loadCoursesForFilter() {
  if (!db) return;
  
  try {
    const snapshot = await db.collection('courses').orderBy('code').get();
    const options = snapshot.docs.map(doc => `<option value="${doc.id}">${doc.data().code} - ${doc.data().name}</option>`).join('');
    const select = document.getElementById('attendanceCourseFilter');
    if (select) select.innerHTML = '<option value="">All Courses</option>' + options;
  } catch (error) {
    console.error('Load courses filter error:', error);
  }
}

// ============ NOTICES ============
async function loadNotices() {
  const tbody = document.querySelector('#noticesTable tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    const snapshot = await db.collection('notices').orderBy('date', 'desc').get();
    
tbody.innerHTML = snapshot.docs.map(doc => {
      const n = doc.data();
      return `<tr>
        <td>${n.title}</td>
        <td><span class="badge bg-${getCategoryColor(n.category)}">${n.category}</span></td>
        <td>${(n.targetAudience || ['students']).join(', ')}</td>
        <td>${formatDate(n.date)}</td>
        <td><span class="badge bg-${n.published ? 'success' : 'secondary'}">${n.published ? 'Published' : 'Draft'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editNotice('${doc.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-outline-${n.published ? 'warning' : 'success'}" onclick="toggleNoticePublish('${doc.id}', ${!n.published})"><i class="fas fa-${n.published ? 'eye-slash' : 'eye'}"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteNotice('${doc.id}')"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" class="text-center">No notices</td></tr>';
  } catch (error) {
    console.error('Load notices error:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading notices</td></tr>';
  }
}

function getCategoryColor(cat) {
  const colors = { academic: 'primary', event: 'success', exam: 'danger', placement: 'info', general: 'secondary' };
  return colors[cat] || 'secondary';
}

// ============ PROJECTS ============
async function loadProjects() {
  const tbody = document.querySelector('#projectsTable tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    const snapshot = await db.collection('projects').orderBy('submittedAt', 'desc').limit(100).get();
    
    tbody.innerHTML = snapshot.docs.map(doc => {
      const p = doc.data();
      return `<tr>
        <td>${p.title}</td>
        <td>${p.studentName} (${p.studentId})</td>
        <td>${p.category || p.type || 'Project'}</td>
        <td><span class="badge badge-status bg-${getProjectStatusColor(p.status)}">${p.status}</span></td>
        <td>${p.submittedAt ? formatDate(p.submittedAt) : '-'}</td>
        <td>${p.grade ? `<span class="badge bg-success">${p.grade}</span>` : '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="viewProjectDetail('${doc.id}')"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm btn-outline-secondary" onclick="gradeProject('${doc.id}')"><i class="fas fa-star"></i></button>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="text-center">No projects</td></tr>';
  } catch (error) {
    console.error('Load projects error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading projects</td></tr>';
  }
}

function getProjectStatusColor(status) {
  const colors = { 'Submitted': 'info', 'Graded': 'success', 'In Progress': 'warning', 'Pending': 'secondary' };
  return colors[status] || 'secondary';
}

function filterProjects(status) {
  alert(`Filter projects by: ${status} - implement client-side filter`);
}

// ============ ATTENDANCE ============
async function loadAttendanceStats() {
  const tbody = document.querySelector('#attendanceTable tbody');
  const courseFilter = document.getElementById('attendanceCourseFilter')?.value;
  const dateFilter = document.getElementById('attendanceDateFilter')?.value;
  
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading...</td></tr>';
  
  try {
    if (!db) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-warning">Firebase not configured</td></tr>';
      return;
    }
    
    let query = db.collection('attendance').orderBy('timestamp', 'desc').limit(100);
    
    if (courseFilter) query = query.where('courseId', '==', courseFilter);
    if (dateFilter) {
      const start = new Date(dateFilter);
      const end = new Date(dateFilter);
      end.setDate(end.getDate() + 1);
      query = query.where('timestamp', '>=', start).where('timestamp', '<', end);
    }
    
    const snapshot = await query.get();
    
    tbody.innerHTML = snapshot.docs.map(doc => {
      const a = doc.data();
      const total = a.records?.length || 0;
      const present = a.records?.filter(r => r.status === 'Present').length || 0;
      const pct = total ? ((present / total) * 100).toFixed(1) : 0;
      
      return `<tr>
        <td>${a.courseId}</td>
        <td>${formatDate(a.date)}</td>
        <td>${total}</td>
        <td>${present}</td>
        <td>${total - present}</td>
        <td><span class="badge bg-${pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}">${pct}%</span></td>
        <td>${a.markedBy || 'Unknown'}</td>
      </tr>`;
    }).join('') || '<tr><td colspan="7" class="text-center">No attendance records</td></tr>';
  } catch (error) {
    console.error('Load attendance error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error loading attendance</td></tr>';
  }
}

// ============ ANALYTICS ============
let charts = {};

async function loadAnalytics() {
  if (typeof Chart === 'undefined') return;
  
  // Destroy existing charts
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
  
  try {
    if (!db) return;
    
    // Get data for charts
    const [usersSnap, projectsSnap, coursesSnap, attendanceSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('projects').get(),
      db.collection('courses').get(),
      db.collection('attendance').limit(200).get()
    ]);
    
    // Attendance trend (last 30 days)
    const attendanceByDate = {};
    attendanceSnap.docs.forEach(doc => {
      const a = doc.data();
      const date = a.date || (a.timestamp?.toDate?.()?.toISOString().split('T')[0]);
      if (date) {
        if (!attendanceByDate[date]) attendanceByDate[date] = { total: 0, present: 0 };
        const records = a.records || [];
        attendanceByDate[date].total += records.length;
        attendanceByDate[date].present += records.filter(r => r.status === 'Present').length;
      }
    });
    
    const sortedDates = Object.keys(attendanceByDate).sort().slice(-14);
    const attendanceData = sortedDates.map(d => {
      const a = attendanceByDate[d];
      return a.total ? ((a.present / a.total) * 100).toFixed(1) : 0;
    });
    
    // Attendance Chart
    charts.attendance = new Chart(document.getElementById('attendanceChart'), {
      type: 'line',
      data: { labels: sortedDates.map(d => formatDate(d)), datasets: [{ label: 'Attendance %', data: attendanceData, borderColor: '#3b82f6', fill: false, tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    
    // Projects by status
    const projectStatus = {};
    projectsSnap.docs.forEach(doc => {
      const s = doc.data().status || 'Unknown';
      projectStatus[s] = (projectStatus[s] || 0) + 1;
    });
    
    charts.projects = new Chart(document.getElementById('projectsChart'), {
      type: 'doughnut',
      data: { labels: Object.keys(projectStatus), datasets: [{ data: Object.values(projectStatus), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'] }] },
      options: { responsive: true }
    });
    
    // Users by role
    const userRoles = {};
    usersSnap.docs.forEach(doc => {
      const r = doc.data().role || 'Unknown';
      userRoles[r] = (userRoles[r] || 0) + 1;
    });
    
    charts.users = new Chart(document.getElementById('usersChart'), {
      type: 'bar',
      data: { labels: Object.keys(userRoles), datasets: [{ label: 'Users', data: Object.values(userRoles), backgroundColor: ['#ef4444', '#3b82f6', '#10b981'] }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
    
    // Courses enrollment
    const courseEnrollment = {};
    coursesSnap.docs.forEach(doc => {
      const c = doc.data();
      courseEnrollment[`${c.code}`] = c.students?.length || 0;
    });
    
    charts.courses = new Chart(document.getElementById('coursesChart'), {
      type: 'bar',
      data: { labels: Object.keys(courseEnrollment), datasets: [{ label: 'Students', data: Object.values(courseEnrollment), backgroundColor: '#8b5cf6' }] },
      options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }
    });
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

// ============ SETTINGS ============
function checkFirebaseConfig() {
  const configured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
  const statusDiv = document.createElement('div');
  statusDiv.className = `alert alert-${configured ? 'success' : 'warning'} mt-3`;
  statusDiv.innerHTML = configured 
    ? '<i class="fas fa-check-circle me-2"></i>Firebase is configured and connected'
    : '<i class="fas fa-exclamation-triangle me-2"></i>Firebase not configured. Update assets/js/firebase-config.js';
  
  const existing = document.querySelector('#settings-section .alert');
  if (existing) existing.remove();
  document.querySelector('#settings-section .card:first-child .card-body').appendChild(statusDiv);
}

function exportAllData() {
  alert('Export all data - implement Firestore export to JSON/CSV');
}

function importData() {
  alert('Import data - implement with file upload and Firestore batch writes');
}

function clearOldData() {
  if (confirm('Delete records older than 1 year? This cannot be undone.')) {
    alert('Implement cleanup with Firestore queries and batch deletes');
  }
}

// ============ FORM HANDLERS ============
document.getElementById('addUserForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    role: form.role.value,
    identifier: form.identifier.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    active: true
  };
  
  try {
    // Create auth user
    const userCred = await auth.createUserWithEmailAndPassword(form.email.value, form.password.value);
    data.uid = userCred.user.uid;
    
    // Save to Firestore
    await db.collection('users').doc(userCred.user.uid).set(data);
    
    alert('User created successfully!');
    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
    form.reset();
    loadUsers();
  } catch (error) {
    console.error('Create user error:', error);
    alert('Error: ' + error.message);
  }
});

document.getElementById('addFacultyForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  try {
    if (db) await db.collection('faculty').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Faculty added!');
    bootstrap.Modal.getInstance(document.getElementById('addFacultyModal')).hide();
    form.reset();
    loadFaculty();
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('addStudentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  data.year = parseInt(data.year);
  data.active = true;
  
  try {
    if (db) await db.collection('students').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Student added!');
    bootstrap.Modal.getInstance(document.getElementById('addStudentModal')).hide();
    form.reset();
    loadStudents();
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('addCourseForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  data.year = parseInt(data.year);
  data.credits = parseInt(data.credits);
  data.students = [];
  
  try {
    if (db) await db.collection('courses').add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    alert('Course created!');
    bootstrap.Modal.getInstance(document.getElementById('addCourseModal')).hide();
    form.reset();
    loadCourses();
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

document.getElementById('addNoticeForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Handle checkboxes
  data.targetAudience = [];
  form.querySelectorAll('[name="audience"]:checked').forEach(cb => data.targetAudience.push(cb.value));
  data.published = true;
  data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
  
  try {
    if (db) await db.collection('notices').add(data);
    alert('Notice published!');
    bootstrap.Modal.getInstance(document.getElementById('addNoticeModal')).hide();
    form.reset();
    loadNotices();
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

// ============ UTILITIES ============
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Placeholder functions for edit/delete
function editUser(id) { alert(`Edit user ${id}`); }
function toggleUserStatus(id, disabled) { alert(`${disabled ? 'Enable' : 'Disable'} user ${id}`); }
function deleteUser(id) { if (confirm('Delete user?')) alert(`Delete user ${id}`); }
function editFaculty(id) { alert(`Edit faculty ${id}`); }
function deleteFaculty(id) { if (confirm('Delete faculty?')) alert(`Delete faculty ${id}`); }
function editStudent(id) { alert(`Edit student ${id}`); }
function deleteStudent(id) { if (confirm('Delete student?')) alert(`Delete student ${id}`); }
function editCourse(id) { alert(`Edit course ${id}`); }
function deleteCourse(id) { if (confirm('Delete course?')) alert(`Delete course ${id}`); }
function editNotice(id) { alert(`Edit notice ${id}`); }
function toggleNoticePublish(id, publish) { alert(`${publish ? 'Publish' : 'Unpublish'} notice ${id}`); }
function deleteNotice(id) { if (confirm('Delete notice?')) alert(`Delete notice ${id}`); }
function viewProjectDetail(id) { alert(`View project ${id}`); }
function gradeProject(id) { alert(`Grade project ${id}`); }

// Expose globally
window.showAdminSection = showAdminSection;
window.filterProjects = filterProjects;
window.loadAttendanceStats = loadAttendanceStats;
window.loadCoursesForFilter = loadCoursesForFilter;
window.downloadCSVTemplate = downloadCSVTemplate;
window.exportStudents = exportStudents;
window.importStudentsCSV = importStudentsCSV;
window.exportAllData = exportAllData;
window.importData = importData;
window.clearOldData = clearOldData;
window.checkFirebaseConfig = checkFirebaseConfig;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.editFaculty = editFaculty;
window.deleteFaculty = deleteFaculty;
window.editStudent = editStudent;
window.deleteStudent = deleteStudent;
window.editCourse = editCourse;
window.deleteCourse = deleteCourse;
window.editNotice = editNotice;
window.toggleNoticePublish = toggleNoticePublish;
window.deleteNotice = deleteNotice;
window.viewProjectDetail = viewProjectDetail;
window.gradeProject = gradeProject;