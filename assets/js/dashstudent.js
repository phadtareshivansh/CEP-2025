// Student Dashboard - Complete Implementation
// Uses Firebase via auth.js and firebase-config.js

let db, auth;
let studentData = null;
let allNotices = [];

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  
  // Auth check via shared auth.js
  Auth.init((user) => {
    if (!user) {
      window.location.href = 'studentlogin.html';
      return;
    }
    if (user.role !== 'student') {
      Auth.logout();
      return;
    }
    studentData = user;
    loadStudentDashboard();
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

async function loadStudentDashboard() {
  // Update welcome message
  const nameEl = document.querySelector('[data-user-name]');
  const rollEl = document.querySelector('[data-user-roll]');
  const courseEl = document.querySelector('[data-user-course]');
  
  if (nameEl) nameEl.textContent = studentData.displayName || studentData.email?.split('@')[0] || 'Student';
  if (rollEl) rollEl.textContent = studentData.rollNo || 'AIML2023-001';
  if (courseEl) courseEl.textContent = studentData.course || 'B.Tech AIML';
  
  // Load default data
  loadNotices();
  loadAttendanceSummary();
  loadExamSchedule();
  loadProjects();
  loadNotes();
  loadEvents();
  loadPlacements();
  loadLibrary();
}

// ============ SECTION NAVIGATION ============
function showStudentSection(sectionName) {
  document.querySelectorAll('.student-section').forEach(sec => sec.style.display = 'none');
  
  const section = document.getElementById(`${sectionName}-section`);
  if (section) section.style.display = 'block';
  
  document.querySelectorAll('.menu a').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`.menu a[onclick*="${sectionName}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Load section data
  switch(sectionName) {
    case 'notices': loadNotices(); break;
    case 'attendance': loadAttendanceSummary(); break;
    case 'exams': loadExamSchedule(); break;
    case 'projects': loadProjects(); break;
    case 'notes': loadNotes(); break;
    case 'chatbot': initChatbot(); break;
    case 'recommendations': loadRecommendations(); break;
    case 'events': loadEvents(); break;
    case 'placements': loadPlacements(); break;
    case 'library': loadLibrary(); break;
  }
}

// ============ NOTICES ============
async function loadNotices() {
  const container = document.getElementById('noticesList');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><p>Loading notices...</p></div>';
  
  try {
    if (db) {
      const snapshot = await db.collection('notices')
        .where('targetAudience', 'array-contains', 'students')
        .orderBy('date', 'desc')
        .limit(20)
        .get();
      allNotices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      allNotices = getDemoNotices();
    }
    renderNotices(allNotices);
  } catch (error) {
    console.error('Load notices error:', error);
    allNotices = getDemoNotices();
    renderNotices(allNotices);
  }
}

function getDemoNotices() {
  return [
    { title: 'AI Workshop', date: '2025-09-20', content: 'Hands-on AI workshop for all years. Register by Sep 15.', category: 'event', priority: 'high', author: 'AI Club' },
    { title: 'Hackathon 2025', date: '2025-09-25', content: 'Annual coding hackathon. Prizes worth ₹50,000!', category: 'event', priority: 'urgent', author: 'Coding Club' },
    { title: 'Guest Lecture by Dr. XYZ', date: '2025-10-01', content: 'Industry expert talk on LLMs. Auditorium, 2 PM.', category: 'academic', priority: 'normal', author: 'Dept. Coordinator' },
    { title: 'Mid-term Exam Schedule', date: '2025-09-10', content: 'Exam timetable released. Check student portal for details.', category: 'exam', priority: 'urgent', author: 'Exam Cell' },
    { title: 'TCS Placement Drive', date: '2025-09-05', content: 'AI Engineer roles, 7-12 LPA. 2025 batch eligible.', category: 'placement', priority: 'high', author: 'Placement Cell' }
  ];
}

function renderNotices(notices) {
  const container = document.getElementById('noticesList');
  
  if (!notices.length) {
    container.innerHTML = '<div class="alert alert-info text-center">No notices available</div>';
    return;
  }
  
  container.innerHTML = notices.map(n => `
    <div class="card notice-card mb-3 ${n.priority === 'urgent' ? 'border-danger border-2' : n.priority === 'high' ? 'border-warning' : ''}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span class="badge bg-${getCategoryColor(n.category)} me-1">${n.category}</span>
            <span class="badge bg-${getPriorityColor(n.priority)}">${n.priority}</span>
          </div>
          <small class="text-muted">${formatDate(n.date)}</small>
        </div>
        <h5 class="card-title">${n.title}</h5>
        <p class="card-text mb-1">${n.content}</p>
        <small class="text-muted">By: ${n.author}</small>
      </div>
    </div>
  `).join('');
}

function getCategoryColor(cat) {
  const colors = { academic: 'primary', event: 'success', exam: 'danger', placement: 'info', general: 'secondary' };
  return colors[cat] || 'secondary';
}

function getPriorityColor(p) {
  const colors = { urgent: 'danger', high: 'warning', normal: 'secondary', low: 'light text-dark' };
  return colors[p] || 'secondary';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ============ ATTENDANCE ============
async function loadAttendanceSummary() {
  const summaryDiv = document.getElementById('attendanceSummary');
  const tableBody = document.querySelector('#attendanceTable tbody');
  
  summaryDiv.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div></div>';
  tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
  
  try {
    let records = [];
    
    if (db && studentData) {
      // In production: query attendance where records contain this student
      // For now, demo data
      records = getDemoAttendance();
    } else {
      records = getDemoAttendance();
    }
    
    renderAttendance(records, summaryDiv, tableBody);
  } catch (error) {
    console.error('Attendance error:', error);
    renderAttendance(getDemoAttendance(), summaryDiv, tableBody);
  }
}

function getDemoAttendance() {
  return [
    { course: 'AI Fundamentals (AIML101)', total: 30, present: 27, absent: 3 },
    { course: 'Machine Learning (AIML201)', total: 25, present: 22, absent: 3 },
    { course: 'Deep Learning (AIML301)', total: 20, present: 18, absent: 2 },
    { course: 'Data Structures', total: 35, present: 33, absent: 2 }
  ];
}

function renderAttendance(records, summaryDiv, tableBody) {
  let totalClasses = 0, totalPresent = 0;
  
  tableBody.innerHTML = records.map(r => {
    totalClasses += r.total;
    totalPresent += r.present;
    const pct = ((r.present / r.total) * 100).toFixed(1);
    const badgeClass = pct >= 75 ? 'bg-success' : (pct >= 50 ? 'bg-warning' : 'bg-danger');
    
    // Calculate classes needed to reach 75%
    let classesNeeded = 0;
    if (pct < 75) {
      // Formula: (present + x) / (total + x) >= 0.75
      // x >= (0.75 * total - present) / 0.25
      classesNeeded = Math.ceil((0.75 * r.total - r.present) / 0.25);
    }
    
    return `<tr>
      <td>${r.course}</td>
      <td>${r.total}</td>
      <td>${r.present}</td>
      <td>${r.absent}</td>
      <td><span class="badge ${badgeClass}">${pct}%</span></td>
      <td>${classesNeeded > 0 ? 
        `<span class="badge bg-warning text-dark">${classesNeeded} more classes needed</span>` : 
        `<span class="badge bg-success">✓ Safe</span>`}
      </td>
    </tr>`;
  }).join('');
  
  const overallPct = totalClasses ? ((totalPresent / totalClasses) * 100).toFixed(1) : 0;
  const overallBadge = overallPct >= 75 ? 'bg-success' : (overallPct >= 50 ? 'bg-warning' : 'bg-danger');
  
  // Overall classes needed
  let overallNeeded = 0;
  if (overallPct < 75) {
    overallNeeded = Math.ceil((0.75 * totalClasses - totalPresent) / 0.25);
  }
  
  summaryDiv.innerHTML = `
    <div class="row g-3 mb-3">
      <div class="col-md-3"><div class="card bg-primary text-white"><div class="card-body text-center"><h4>${totalClasses}</h4><small>Total Classes</small></div></div></div>
      <div class="col-md-3"><div class="card bg-success text-white"><div class="card-body text-center"><h4>${totalPresent}</h4><small>Present</small></div></div></div>
      <div class="col-md-3"><div class="card bg-danger text-white"><div class="card-body text-center"><h4>${totalClasses - totalPresent}</h4><small>Absent</small></div></div></div>
      <div class="col-md-3"><div class="card bg-info text-white"><div class="card-body text-center"><h4>${overallPct}%</h4><small>Overall Attendance</small></div></div></div>
    </div>
    ${overallNeeded > 0 ? `
    <div class="alert alert-warning d-flex align-items-center">
      <i class="fas fa-exclamation-triangle me-2"></i>
      <div>
        <strong>Overall: ${overallNeeded} more classes needed to reach 75%</strong>
        <div class="progress mt-2" style="height: 8px;">
          <div class="progress-bar bg-warning" role="progressbar" style="width: ${overallPct}%"></div>
        </div>
      </div>
    </div>` : `
    <div class="alert alert-success d-flex align-items-center">
      <i class="fas fa-check-circle me-2"></i>
      <strong>Overall attendance is above 75% - Safe for exams!</strong>
    </div>`}
  `;
}

// ============ EXAMS ============
async function loadExamSchedule() {
  const scheduleBody = document.getElementById('examScheduleBody');
  const resultsBody = document.getElementById('examResultsBody');
  
  // Demo data - in production, query Firestore 'exams' and 'results' collections
  const schedule = [
    { subject: 'AI Fundamentals', date: '2025-10-15', time: '10:00 AM', type: 'Mid-term', room: 'A-101' },
    { subject: 'Machine Learning', date: '2025-10-17', time: '10:00 AM', type: 'Mid-term', room: 'A-102' },
    { subject: 'Deep Learning', date: '2025-10-19', time: '10:00 AM', type: 'Mid-term', room: 'A-103' },
    { subject: 'Data Structures', date: '2025-10-21', time: '2:00 PM', type: 'Quiz', room: 'Lab-1' }
  ];
  
  const results = [
    { subject: 'AI Fundamentals', exam: 'Quiz 1', marks: 18, max: 20, grade: 'A' },
    { subject: 'Machine Learning', exam: 'Assignment 1', marks: 42, max: 50, grade: 'B+' },
    { subject: 'Data Structures', exam: 'Mid-term', marks: 78, max: 100, grade: 'A' }
  ];
  
  scheduleBody.innerHTML = schedule.map(s => `
    <tr>
      <td>${s.subject}</td>
      <td>${formatDate(s.date)}</td>
      <td>${s.time}</td>
      <td><span class="badge bg-primary">${s.type}</span></td>
      <td>${s.room}</td>
    </tr>
  `).join('');
  
  resultsBody.innerHTML = results.map(r => `
    <tr>
      <td>${r.subject}</td>
      <td>${r.exam}</td>
      <td>${r.marks}</td>
      <td>${r.max}</td>
      <td><span class="badge bg-success">${r.grade}</span></td>
    </tr>
  `).join('');
}

function showExamTab(tab) {
  document.getElementById('examSchedule').style.display = tab === 'schedule' ? 'block' : 'none';
  document.getElementById('examResults').style.display = tab === 'results' ? 'block' : 'none';
  document.getElementById('examPredictor').style.display = tab === 'predictor' ? 'block' : 'none';
  document.querySelectorAll('#exams-section .tab-btn').forEach(b => 
    b.classList.toggle('active', b.textContent.toLowerCase().includes(tab))
  );
}

// ============ QUESTION PAPER PREDICTOR ============

const questionBank = {
  AIML101: {
    topics: [
      { topic: 'Introduction to AI & Intelligent Agents', weight: 15, questions: ['Define AI. Differentiate between Narrow AI and General AI.', 'Explain PEAS representation with an example.', 'What are the types of environments in AI?'] },
      { topic: 'Problem Solving by Searching', weight: 25, questions: ['Compare BFS vs DFS vs A* search. When to use which?', 'Explain heuristic functions. Design a heuristic for 8-puzzle.', 'What is iterative deepening search? Advantages over BFS/DFS?'] },
      { topic: 'Knowledge Representation & Reasoning', weight: 20, questions: ['Convert to FOL: "All humans are mortal. Socrates is human."', 'Explain forward chaining vs backward chaining with example.', 'What is resolution? Prove a simple theorem using resolution.'] },
      { topic: 'Machine Learning Basics', weight: 20, questions: ['Difference between supervised, unsupervised, reinforcement learning.', 'Explain bias-variance tradeoff with diagram.', 'What is overfitting? Techniques to prevent it.'] },
      { topic: 'Neural Networks Introduction', weight: 20, questions: ['Draw and explain perceptron. What are its limitations?', 'Explain backpropagation algorithm steps.', 'What are activation functions? Compare ReLU, Sigmoid, Tanh.'] }
    ]
  },
  AIML201: {
    topics: [
      { topic: 'Supervised Learning - Regression', weight: 20, questions: ['Derive normal equation for linear regression.', 'Explain regularization: Ridge vs Lasso. When to use which?', 'How to evaluate regression models? MSE, MAE, R².'] },
      { topic: 'Classification Algorithms', weight: 25, questions: ['Derive logistic regression cost function.', 'Explain SVM with kernel trick. What is margin?', 'Decision tree splitting criteria: Gini vs Entropy vs Information Gain.'] },
      { topic: 'Ensemble Methods', weight: 20, questions: ['How does Random Forest reduce variance?', 'Explain Gradient Boosting vs AdaBoost.', 'What is stacking? When does it help?'] },
      { topic: 'Unsupervised Learning', weight: 20, questions: ['K-means clustering algorithm steps. How to choose K?', 'Explain PCA. When to use it?', 'Difference between clustering and dimensionality reduction.'] },
      { topic: 'Model Evaluation & Selection', weight: 15, questions: ['Cross-validation techniques. k-fold vs stratified k-fold.', 'ROC curve and AUC. What does AUC = 0.5 mean?', 'Hyperparameter tuning: Grid Search vs Random Search vs Bayesian.'] }
    ]
  },
  AIML301: {
    topics: [
      { topic: 'Deep Neural Networks', weight: 20, questions: ['Vanishing gradient problem. Solutions: ReLU, BatchNorm, ResNet.', 'Explain backpropagation through time (BPTT).', 'Weight initialization: Xavier vs He initialization.'] },
      { topic: 'CNNs', weight: 25, questions: ['Architecture of LeNet-5 / AlexNet / ResNet.', 'Explain pooling: Max vs Average. Stride and padding calculations.', 'Transfer learning: Fine-tuning vs Feature extraction.'] },
      { topic: 'RNNs & LSTMs', weight: 20, questions: ['Why vanilla RNN fails for long sequences?', 'LSTM cell architecture: Gates and equations.', 'Bidirectional RNNs. Attention mechanism basics.'] },
      { topic: 'Generative Models', weight: 20, questions: ['VAE vs GAN. Loss functions for both.', 'Mode collapse in GANs. Solutions.', 'Explain diffusion models (high level).'] },
      { topic: 'Advanced Topics', weight: 15, questions: ['Transformer architecture: Self-attention mechanism.', 'BERT vs GPT: Pre-training objectives.', 'Explainable AI: SHAP, LIME, Grad-CAM.'] }
    ]
  },
  DS: {
    topics: [
      { topic: 'Arrays & Linked Lists', weight: 20, questions: ['Reverse a linked list (iterative & recursive).', 'Detect cycle in linked list (Floyd\'s algorithm).', 'Merge two sorted linked lists.'] },
      { topic: 'Stacks & Queues', weight: 15, questions: ['Implement queue using two stacks.', 'Next greater element using stack.', 'Valid parentheses checking.'] },
      { topic: 'Trees & Graphs', weight: 30, questions: ['Tree traversals: Inorder, Preorder, Postorder (recursive & iterative).', 'Lowest Common Ancestor in BST.', 'Dijkstra\'s algorithm. Time complexity.'] },
      { topic: 'Dynamic Programming', weight: 20, questions: ['0/1 Knapsack problem. Memoization vs Tabulation.', 'Longest Common Subsequence.', 'Coin change problem (minimum coins).'] },
      { topic: 'Sorting & Searching', weight: 15, questions: ['Quick sort partition logic. Worst case O(n²).', 'Merge sort on linked list.', 'Binary search variations: first/last occurrence.'] }
    ]
  }
};

async function generatePredictedPaper() {
  const subject = document.getElementById('predictorSubject').value;
  const examType = document.getElementById('predictorExamType').value;
  const container = document.getElementById('predictedQuestions');
  const section = document.getElementById('predictedPaper');
  
  if (!subject) {
    Toast.error('Please select a subject');
    return;
  }
  
  container.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary"></div><p>Generating predicted paper...</p></div>';
  section.style.display = 'block';
  
  // Simulate AI processing
  await new Promise(r => setTimeout(r, 1500));
  
  const subjectData = questionBank[subject];
  if (!subjectData) {
    container.innerHTML = '<div class="alert alert-warning">No question bank for this subject yet.</div>';
    return;
  }
  
  // Generate paper based on exam type
  const totalMarks = examType === 'final' ? 100 : (examType === 'midterm' ? 50 : 20);
  const numQuestions = examType === 'final' ? 8 : (examType === 'midterm' ? 5 : 3);
  
  // Weighted selection of questions
  let selectedQuestions = [];
  const allQuestions = subjectData.topics.flatMap(t => 
    t.questions.map(q => ({ ...q, topic: t.topic, weight: t.weight }))
  );
  
  // Sort by weight and pick top questions
  allQuestions.sort((a, b) => b.weight - a.weight);
  selectedQuestions = allQuestions.slice(0, numQuestions);
  
  // Distribute marks
  const marksPerQuestion = Math.floor(totalMarks / numQuestions);
  const remainder = totalMarks % numQuestions;
  
  container.innerHTML = `
    <div class="mb-3 p-3 bg-light rounded">
      <h6 class="mb-2">Predicted Paper: ${subjectData.topics[0]?.topic || subject} (${examType.toUpperCase()})</h6>
      <small class="text-muted">Total Marks: ${totalMarks} | Time: ${examType === 'final' ? '3 hrs' : examType === 'midterm' ? '2 hrs' : '1 hr'}</small>
    </div>
    <ol class="list-group list-group-numbered">
      ${selectedQuestions.map((q, i) => {
        const marks = marksPerQuestion + (i < remainder ? 1 : 0);
        return `
          <li class="list-group-item">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <strong>Q${i + 1}.</strong> ${q.question}
                <div class="text-muted small mt-1"><i class="fas fa-tag me-1"></i>${q.topic}</div>
              </div>
              <span class="badge bg-primary rounded-pill">${marks} marks</span>
            </div>
          </li>
        `;
      }).join('')}
    </ol>
    <div class="mt-3 p-3 bg-success bg-opacity-10 rounded">
      <h6 class="text-success"><i class="fas fa-lightbulb me-1"></i>Focus Areas (Based on Weightage):</h6>
      <ul class="mb-0">
        ${subjectData.topics.slice(0, 3).map(t => `<li><strong>${t.topic}</strong> (${t.weight}% weightage)</li>`).join('')}
      </ul>
    </div>
  `;
}

function downloadPredictedPaper() {
  Toast.info('PDF download feature coming soon!');
}

// ============ PROJECTS ============
async function loadProjects() {
  const body = document.getElementById('projectsBody');
  body.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  
  try {
    let projects = [];
    
    if (db && studentData) {
      const snapshot = await db.collection('projects')
        .where('studentId', '==', studentData.uid)
        .orderBy('submittedAt', 'desc')
        .get();
      projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      projects = [
        { title: 'AI Chatbot', type: 'Course Project', status: 'Submitted', submittedAt: '2025-09-10', grade: 'A' },
        { title: 'Sentiment Analysis', type: 'Assignment', status: 'Graded', submittedAt: '2025-08-25', grade: 'B+' },
        { title: 'ML Recommender', type: 'Final Project', status: 'In Progress', submittedAt: null, grade: null }
      ];
    }
    
    body.innerHTML = projects.map(p => `
      <tr>
        <td>${p.title}</td>
        <td><span class="badge bg-secondary">${p.type || 'Project'}</span></td>
        <td><span class="badge ${getProjectStatusBadge(p.status)}">${p.status}</span></td>
        <td>${p.submittedAt ? formatDate(p.submittedAt) : '-'}</td>
        <td>${p.grade ? `<span class="badge bg-success">${p.grade}</span>` : '-'}</td>
        <td>
          ${p.status === 'In Progress' ? 
            `<button class="btn btn-sm btn-primary" onclick="continueProject('${p.id}')">Continue</button>` :
            `<button class="btn btn-sm btn-outline-secondary" onclick="viewProject('${p.id}')">View</button>`}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Load projects error:', error);
    body.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading projects</td></tr>';
  }
}

function getProjectStatusBadge(status) {
  const map = { 'Submitted': 'bg-info', 'Graded': 'bg-success', 'In Progress': 'bg-warning', 'Pending': 'bg-secondary' };
  return map[status] || 'bg-secondary';
}

function openProjectModal() {
  const modal = new bootstrap.Modal(document.getElementById('projectModal'));
  document.getElementById('projectForm').reset();
  modal.show();
}

document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const projectData = {
    title: document.getElementById('projTitle').value,
    description: document.getElementById('projDesc').value,
    category: document.getElementById('projCategory').value,
    studentId: studentData?.uid || 'demo-student',
    studentName: studentData?.displayName || 'Demo Student',
    status: 'Submitted',
    submittedAt: new Date().toISOString()
  };
  
  try {
    if (db) {
      await db.collection('projects').add(projectData);
    }
    alert('Project submitted successfully!');
    bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
    loadProjects();
  } catch (error) {
    console.error('Submit project error:', error);
    alert('Error submitting project');
  }
});

function continueProject(id) { alert(`Continue project ${id} - implement editor`); }
function viewProject(id) { alert(`View project ${id} - implement detail view`); }

// ============ NOTES ============
async function loadNotes() {
  const grid = document.getElementById('notesGrid');
  grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  try {
    let notes = [];
    
    if (db) {
      const snapshot = await db.collection('notes')
        .where('targetYears', 'array-contains', studentData?.year || 2)
        .orderBy('uploadedAt', 'desc')
        .limit(20)
        .get();
      notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      notes = [
        { title: 'AI Fundamentals - Lecture 1', subject: 'AIML101', type: 'pdf', uploadedAt: '2025-09-01' },
        { title: 'ML Algorithms Cheat Sheet', subject: 'AIML201', type: 'pdf', uploadedAt: '2025-09-05' },
        { title: 'Neural Networks Notes', subject: 'AIML301', type: 'docx', uploadedAt: '2025-09-10' },
        { title: 'Python for Data Science', subject: 'Common', type: 'video', uploadedAt: '2025-08-28' }
      ];
    }
    
    grid.innerHTML = notes.map(n => `
      <div class="col-md-4 mb-3">
        <div class="card note-card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center mb-2">
              <i class="fas ${getFileIcon(n.type)} fa-2x me-3 text-primary"></i>
              <div>
                <h6 class="mb-0">${n.title}</h6>
                <small class="text-muted">${n.subject}</small>
              </div>
            </div>
            <small class="text-muted d-block mb-2">Uploaded: ${formatDate(n.uploadedAt)}</small>
            <button class="btn btn-sm btn-primary w-100" onclick="downloadNote('${n.id}')">
              <i class="fas fa-download"></i> Download
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load notes error:', error);
    grid.innerHTML = '<div class="col-12"><div class="alert alert-danger">Error loading notes</div></div>';
  }
}

function getFileIcon(type) {
  const icons = { pdf: 'fa-file-pdf', docx: 'fa-file-word', video: 'fa-file-video', pptx: 'fa-file-powerpoint' };
  return icons[type] || 'fa-file';
}

function downloadNote(id) { alert(`Download note ${id} - implement with Firebase Storage`); }

// ============ CHATBOT ============
function initChatbot() {
  const input = document.getElementById('studentChatInput');
  if (input) input.focus();
}

async function sendStudentChat() {
  const input = document.getElementById('studentChatInput');
  const window = document.getElementById('studentChatWindow');
  const message = input.value.trim();
  
  if (!message) return;
  
  window.innerHTML += `<div class="message user-message mb-2"><strong>You:</strong> ${escapeHtml(message)}</div>`;
  input.value = '';
  window.scrollTop = window.scrollHeight;
  
  // Simulate bot response
  setTimeout(() => {
    const response = getBotResponse(message);
    window.innerHTML += `<div class="message bot-message mb-2"><strong>Bot:</strong> ${response}</div>`;
    window.scrollTop = window.scrollHeight;
  }, 500);
}

function getBotResponse(message) {
  const lower = message.toLowerCase();
  
  if (lower.includes('attendance')) return 'Your overall attendance is 87%. Check the Attendance section for course-wise details.';
  if (lower.includes('exam') || lower.includes('schedule')) return 'Your next exam is AI Fundamentals on Oct 15. Full schedule in Exams section.';
  if (lower.includes('project')) return 'You have 2 submitted projects and 1 in progress. Check Projects section.';
  if (lower.includes('note') || lower.includes('study')) return 'Latest notes: AI Fundamentals Lecture 1, ML Cheat Sheet. Check Notes section.';
  if (lower.includes('placement') || lower.includes('job')) return 'Latest: TCS hiring for AI roles, Google internship open. Check Placements.';
  if (lower.includes('hello') || lower.includes('hi')) return 'Hello! Ask me about attendance, exams, projects, notes, or placements.';
  return 'I can help with attendance, exams, projects, notes, and placements. What would you like to know?';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ RECOMMENDATIONS ============
async function loadRecommendations() {
  const container = document.getElementById('recommendationsList');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><p>Generating personalized recommendations...</p></div>';
  
  // Simulate AI recommendation
  setTimeout(() => {
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card recommendation-card h-100">
            <div class="card-body">
              <h5><i class="fas fa-code text-primary"></i> Project: Build a Resume Parser</h5>
              <p>Based on your Python & NLP coursework. Uses spaCy for entity extraction.</p>
              <div><span class="badge bg-primary">NLP</span> <span class="badge bg-secondary">Python</span> <span class="badge bg-info">spaCy</span></div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card recommendation-card h-100">
            <div class="card-body">
              <h5><i class="fas fa-book text-success"></i> Course: Advanced Deep Learning</h5>
              <p>Recommended next semester. Prerequisites: AIML201, AIML301</p>
              <div><span class="badge bg-success">Deep Learning</span> <span class="badge bg-secondary">PyTorch</span></div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card recommendation-card h-100">
            <div class="card-body">
              <h5><i class="fas fa-certificate text-warning"></i> Certification: TensorFlow Developer</h5>
              <p>Google certification. Aligns with your ML coursework.</p>
              <div><span class="badge bg-warning">TensorFlow</span> <span class="badge bg-secondary">Certification</span></div>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card recommendation-card h-100">
            <div class="card-body">
              <h5><i class="fas fa-briefcase text-danger"></i> Internship: AI Research at TechCorp</h5>
              <p>Summer internship. Requires ML project portfolio.</p>
              <div><span class="badge bg-danger">Internship</span> <span class="badge bg-secondary">Research</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }, 800);
}

// ============ EVENTS ============
async function loadEvents() {
  const container = document.getElementById('eventsList');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  setTimeout(() => {
    const events = [
      { title: 'AI Workshop: Hands-on NLP', date: '2025-09-20', time: '10:00 AM', venue: 'Lab 101', category: 'Workshop' },
      { title: 'Hackathon 2025', date: '2025-09-25', time: '9:00 AM', venue: 'Auditorium', category: 'Competition' },
      { title: 'Guest Lecture: LLMs in Production', date: '2025-10-01', time: '2:00 PM', venue: 'Main Auditorium', category: 'Lecture' },
      { title: 'Tech Fest 2025', date: '2025-10-15', time: 'All Day', venue: 'Campus Grounds', category: 'Festival' },
      { title: 'Placement Prep Session', date: '2025-10-10', time: '4:00 PM', venue: 'Seminar Hall', category: 'Career' }
    ];
    
    container.innerHTML = events.map(e => `
      <div class="card event-card mb-3">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-2 text-center">
              <div class="event-date">${new Date(e.date).getDate()}</div>
              <div class="event-month">${new Date(e.date).toLocaleString('default', { month: 'short' })}</div>
            </div>
            <div class="col-md-7">
              <h5 class="mb-1">${e.title}</h5>
              <div class="text-muted small">
                <span class="badge bg-${getEventColor(e.category)} me-2">${e.category}</span>
                <i class="fas fa-clock me-1"></i>${e.time} | 
                <i class="fas fa-map-marker-alt me-1"></i>${e.venue}
              </div>
            </div>
            <div class="col-md-3 text-end">
              <button class="btn btn-sm btn-primary">Register</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }, 300);
}

function getEventColor(cat) {
  const colors = { Workshop: 'primary', Competition: 'warning', Lecture: 'info', Festival: 'danger', Career: 'success' };
  return colors[cat] || 'secondary';
}

// ============ PLACEMENTS ============
async function loadPlacements() {
  const container = document.getElementById('placementsList');
  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  setTimeout(() => {
    const placements = [
      { company: 'TCS', role: 'AI Engineer', ctc: '7-12 LPA', deadline: '2025-10-10', eligibility: '2025 batch, 7+ CGPA', type: 'Full-time' },
      { company: 'Google', role: 'ML Intern', ctc: 'Stipend: 80K/month', deadline: '2025-09-30', eligibility: '3rd/4th year, ML projects', type: 'Internship' },
      { company: 'Microsoft', role: 'Data Scientist', ctc: '15-25 LPA', deadline: '2025-10-15', eligibility: '2025 batch, 8+ CGPA', type: 'Full-time' },
      { company: 'Amazon', role: 'Applied Scientist Intern', ctc: 'Stipend: 1L/month', deadline: '2025-10-05', eligibility: 'PhD/Masters, Research exp', type: 'Internship' }
    ];
    
    container.innerHTML = placements.map(p => `
      <div class="card placement-card mb-3">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-3">
              <h5 class="mb-0">${p.company}</h5>
              <span class="badge bg-${p.type === 'Internship' ? 'info' : 'primary'}">${p.type}</span>
            </div>
            <div class="col-md-3">
              <strong>${p.role}</strong><br>
              <small class="text-muted">${p.ctc}</small>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Apply by: ${formatDate(p.deadline)}</small><br>
              <small class="text-muted">${p.eligibility}</small>
            </div>
            <div class="col-md-3 text-end">
              <button class="btn btn-primary" onclick="applyPlacement('${p.company}')">Apply Now</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }, 300);
}

function applyPlacement(company) {
  alert(`Application for ${company} - Implement with Firestore 'applications' collection`);
}

// ============ LIBRARY ============
async function loadLibrary() {
  const grid = document.getElementById('libraryGrid');
  grid.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-primary"></div></div>';
  
  setTimeout(() => {
    const resources = [
      { title: 'Deep Learning with Python', author: 'Francois Chollet', type: 'book', year: 2021, cover: '📘' },
      { title: 'Attention Is All You Need', author: 'Vaswani et al.', type: 'paper', year: 2017, cover: '📄' },
      { title: 'CS231n: CNN for Visual Recognition', author: 'Stanford', type: 'video', year: 2023, cover: '🎥' },
      { title: 'Pattern Recognition and ML', author: 'Christopher Bishop', type: 'book', year: 2006, cover: '📘' },
      { title: 'BERT: Pre-training of Deep Bidirectional Transformers', author: 'Devlin et al.', type: 'paper', year: 2018, cover: '📄' },
      { title: 'Fast.ai Practical Deep Learning', author: 'Jeremy Howard', type: 'video', year: 2022, cover: '🎥' }
    ];
    
    grid.innerHTML = resources.map(r => `
      <div class="col-md-4 mb-3">
        <div class="card library-card h-100">
          <div class="card-body text-center">
            <div class="display-1 mb-2">${r.cover}</div>
            <h6>${r.title}</h6>
            <p class="text-muted small">${r.author}</p>
            <span class="badge bg-${getResourceColor(r.type)}">${r.type}</span>
            <div class="mt-2">
              <button class="btn btn-sm btn-primary" onclick="accessResource('${r.title}')">Access</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }, 300);
}

function getResourceColor(type) {
  const colors = { book: 'primary', paper: 'success', video: 'danger' };
  return colors[type] || 'secondary';
}

function filterLibrary() {
  const search = document.getElementById('librarySearch')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('libraryFilter')?.value || '';
  // Implement filtering logic
  console.log('Filter:', search, typeFilter);
}

function accessResource(title) {
  alert(`Access: ${title} - Implement with Firebase Storage or external link`);
}

// ============ UTILITIES ============
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Expose globally
window.showStudentSection = showStudentSection;
window.openProjectModal = openProjectModal;
window.continueProject = continueProject;
window.viewProject = viewProject;
window.showExamTab = showExamTab;
window.sendStudentChat = sendStudentChat;
window.loadRecommendations = loadRecommendations;
window.applyPlacement = applyPlacement;
window.accessResource = accessResource;
window.filterLibrary = filterLibrary;
window.downloadNote = downloadNote;