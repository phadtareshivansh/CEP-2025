// Notices Page - Student Portal

let db, allNotices = [];

document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  
  Auth.init((user) => {
    if (!user || user.role !== 'student') {
      window.location.href = 'studentlogin.html';
      return;
    }
    loadNotices();
  });
});

function initFirebase() {
  if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    db = firebase.firestore();
    return true;
  }
  return false;
}

async function loadNotices() {
  const container = document.getElementById('noticesContainer');
  container.innerHTML = '<div class="loading">Loading notices...</div>';
  
  try {
    if (db) {
      const snapshot = await db.collection('notices')
        .where('targetAudience', 'array-contains', 'students')
        .orderBy('date', 'desc')
        .limit(50)
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
    { id: 1, title: 'AI Workshop on September 20', content: 'Hands-on workshop covering Neural Networks and Deep Learning basics. Open to all AIML students.', category: 'event', date: '2025-09-15', priority: 'high', author: 'Dr. Swati Deshmukh' },
    { id: 2, title: 'Hackathon 2025 Registration Open', content: '24-hour coding challenge. Teams of 3-4. Prizes worth ₹50,000. Register by Sept 22.', category: 'event', date: '2025-09-10', priority: 'high', author: 'Student Council' },
    { id: 3, title: 'Mid-term Exam Schedule Released', content: 'AIML101: Sept 25, AIML201: Sept 26, AIML301: Sept 27. Check detailed timetable on exam portal.', category: 'exam', date: '2025-09-12', priority: 'urgent', author: 'Exam Cell' },
    { id: 4, title: 'Guest Lecture: LLMs in Production', content: 'Industry expert from Google discussing Large Language Models deployment challenges.', category: 'academic', date: '2025-09-08', priority: 'normal', author: 'Prof. Rahul Sonkamble' },
    { id: 5, title: 'TCS Placement Drive - Oct 15', content: 'AI Engineer roles. CTC: 7-12 LPA. Eligible: 2025 batch AIML/CSE. Pre-placement talk on Oct 10.', category: 'placement', date: '2025-09-05', priority: 'high', author: 'Placement Cell' },
    { id: 6, title: 'Library Extended Hours', content: 'Digital library now open 24/7 for final year students. Access e-books and research papers remotely.', category: 'general', date: '2025-09-01', priority: 'normal', author: 'Library' },
    { id: 7, title: 'Assignment Deadline Extended', content: 'ML Project submission extended to Sept 30. Use extra time for model optimization.', category: 'academic', date: '2025-08-28', priority: 'normal', author: 'Prof. Yudhishthir Raut' },
    { id: 8, title: 'Cybersecurity Awareness Week', content: 'Workshops on ethical hacking, secure coding, and data protection. Sept 18-22.', category: 'event', date: '2025-08-25', priority: 'normal', author: 'Cybersecurity Club' }
  ];
}

function renderNotices(notices) {
  const container = document.getElementById('noticesContainer');
  
  if (!notices.length) {
    container.innerHTML = '<div class="alert alert-info">No notices found</div>';
    return;
  }
  
  container.innerHTML = notices.map(n => `
    <div class="card notice-card mb-3 ${n.priority === 'urgent' ? 'border-danger' : n.priority === 'high' ? 'border-warning' : ''}" data-category="${n.category}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span class="badge bg-${getCategoryColor(n.category)} me-2">${n.category}</span>
            <span class="badge bg-${getPriorityColor(n.priority)}">${n.priority}</span>
          </div>
          <small class="text-muted">${formatDate(n.date)}</small>
        </div>
        <h5 class="card-title">${n.title}</h5>
        <p class="card-text">${n.content}</p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted">By: ${n.author}</small>
          <button class="btn btn-sm btn-outline-primary" onclick="viewNoticeDetail('${n.id}')">View Details</button>
        </div>
      </div>
    </div>
  `).join('');
}

function getCategoryColor(cat) {
  const colors = { academic: 'primary', event: 'success', exam: 'danger', placement: 'info', general: 'secondary' };
  return colors[cat] || 'secondary';
}

function getPriorityColor(p) {
  const colors = { urgent: 'danger', high: 'warning', normal: 'secondary', low: 'light' };
  return colors[p] || 'secondary';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function filterNotices() {
  const category = document.getElementById('noticeFilter').value;
  const search = document.getElementById('noticeSearch').value.toLowerCase();
  
  const filtered = allNotices.filter(n => {
    const matchesCategory = !category || n.category === category;
    const matchesSearch = !search || 
      n.title.toLowerCase().includes(search) || 
      n.content.toLowerCase().includes(search) ||
      n.author.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
  
  renderNotices(filtered);
}

function viewNoticeDetail(id) {
  const notice = allNotices.find(n => n.id == id);
  if (!notice) return;
  
  alert(`${notice.title}\n\n${notice.content}\n\nCategory: ${notice.category}\nPriority: ${notice.priority}\nDate: ${formatDate(notice.date)}\nBy: ${notice.author}`);
}