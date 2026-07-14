# AIML Faculty Portal

A comprehensive web portal for the Department of Computer Science & Engineering (AI & ML) at PCU, featuring role-based dashboards for Faculty, Students, and Administrators with Firebase backend integration.

## 🚀 Features

### 🏠 Public Pages
- **Home** - Hero carousel, dynamic project showcase, live notices ticker
- **About** - Vision/Mission, HOD message, programs, infrastructure, achievements
- **Contact** - Contact info cards, working form with Firestore storage, Google Maps
- **Faculty Directory** - 9 faculty profiles with modal details (photo, bio, social links)

### 🔐 Authentication System
- **Firebase Auth** (Email/Password)
- **Role-based access**: Admin, Faculty, Student
- **Protected routes** with automatic redirects
- **Password reset** via email
- **Session persistence** with `onAuthStateChanged`

### 👨‍🏫 Faculty Dashboard (`dashfaculty.html`)
| Section | Features |
|---------|----------|
| **Dashboard** | Stats cards (students, projects, notifications), inline Project Recommender |
| **Project Recommender** | Skill-based filtering from Firestore `projects` collection |
| **Attendance** | Course-wise student roster, radio-button marking, Firestore persistence |
| **Courses & Assignments** | CRUD modals for courses/assignments linked to faculty |
| **Reports** | Attendance, Projects, Performance report generators |
| **Chatbot** | Rule-based AI assistant for common queries |
| **Settings** | Profile edit (name, email, role display) |

### 🎓 FY Faculty Dashboard (`fy.html`)
- Attendance submission with real-time Firestore sync
- Academic analysis with Chart.js bar chart
- Average attendance/marks auto-calculation
- Placeholder actions: Upload Notes, Announcements, Assignments

### 👨‍🎓 Student Dashboard (`dashstudent.html`)
| Feature | Implementation |
|---------|----------------|
| **Chatbot** | Context-aware responses (attendance, exams, projects, etc.) |
| **Notices** | Real-time listener with category/priority badges |
| **Notes** | Grid layout with file-type icons, download buttons |
| **Submit Projects** | Modal form → Firestore `projects` collection |
| **Examinations** | Schedule & Results tabs with badge grades |
| **Attendance** | Course-wise % with color-coded badges, summary cards |
| **Recommendations** | AI-style project/course/certification/internship cards |
| **Events** | Date-cards with register buttons |
| **Placements** | Company cards with CTC, deadline, eligibility |
| **Library** | Filterable resources (books/papers/videos) with search |

### 🛡 Admin Panel (`admin.html`)
| Module | Capabilities |
|--------|--------------|
| **Dashboard** | Stats cards, recent activity feed, system alerts |
| **User Management** | List all users, edit roles, toggle status, delete |
| **Faculty Profiles** | Grid cards with social links, add/edit/delete modals |
| **Students** | Table with CSV import/export, year/division filters |
| **Courses** | Assign faculty, track enrollment counts |
| **Notices** | Publish/unpublish, category/priority, audience targeting |
| **Projects** | Status filter, grading modal |
| **Attendance** | Course/date filters, percentage badges |
| **Analytics** | 4 Chart.js charts (attendance trend, project status, user growth, course enrollment) |
| **Settings** | Firebase config check, backup/restore, maintenance |

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | HTML5, CSS3, Bootstrap 5.3, Font Awesome 6 |
| **Charts** | Chart.js 4.x |
| **Backend** | Firebase Auth, Firestore, Storage |
| **Architecture** | Client-side SPA with shared utilities |
| **Deployment** | Firebase Hosting |

## 📁 Project Structure

```
aiml-faculty-portal/
├── index.html              # Homepage
├── about.html              # About department
├── contact.html            # Contact form
├── faculty.html            # Faculty directory
├── login.html              # Faculty login
├── studentlogin.html       # Student login
├── dashfaculty.html        # Faculty dashboard
├── dashstudent.html        # Student dashboard
├── fy.html                 # FY Faculty dashboard
├── admin.html              # Admin panel
├── assets/
│   ├── css/
│   │   ├── style.css       # Public pages
│   │   ├── dashfaculty.css
│   │   ├── dashstudent.css
│   │   ├── fy.css
│   │   ├── login.css
│   │   └── studentlogin.css
│   ├── js/
│   │   ├── firebase-config.js   # Shared Firebase config
│   │   ├── auth.js              # Shared auth utility
│   │   ├── utils.js             # Validators, loaders, date/string/array utils
│   │   ├── toast.js             # Toast notification system
│   │   ├── main.js              # Homepage dynamic content
│   │   ├── faculty.js           # Faculty modal data
│   │   ├── fy.js                # FY dashboard logic
│   │   ├── dashfaculty.js       # Faculty dashboard logic
│   │   ├── dashstudent.js       # Student dashboard logic
│   │   ├── admin.js             # Admin panel logic
│   │   └── notices.js           # Notices page logic
│   ├── data/
│   │   ├── projects.json
│   │   └── notices.json
│   └── img/
│       ├── Logo.png
│       ├── hero1.png
│       ├── hero2.png
│       └── project1.jpg
├── firestore.rules         # Production security rules
├── firebase.json           # Firebase hosting config
└── .firebaserc             # Firebase project alias
```

## ⚡ Quick Start

### 1. Create Firebase Project
```bash
# Go to https://console.firebase.google.com/
# Create project → Enable Authentication (Email/Password)
# Create Firestore Database (start in test mode)
# Enable Storage (optional)
# Add Web App → Copy config
```

### 2. Configure Firebase
Edit `assets/js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 3. Deploy Security Rules
```bash
# In Firebase Console → Firestore → Rules
# Paste contents of firestore.rules
# Publish
```

### 4. Create Demo Users (via Admin Panel or Console)
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | admin123 |
| Faculty | faculty@college.edu | faculty123 |
| Student | student@college.edu | student123 |

> After creating in Auth, add user docs to `users` collection with `role` field.

### 5. Local Development
```bash
# Option 1: VS Code Live Server
# Option 2: Python
python -m http.server 8000

# Option 3: Node
npx serve .
```

### 6. Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting firestore
# Select existing project
# Public directory: .
# Single-page app: No (multi-page)
firebase deploy
```

## 🔐 Firestore Collections Schema

```javascript
// users/{uid}
{ email, name, role: 'admin'|'faculty'|'student', rollNo, year, division, courses[], createdAt, active }

// faculty/{id}
{ name, role, department, email, phone, linkedin, website, scholar, bio, image, createdAt }

// students/{id}
{ rollNo, name, email, year, division, course, active, createdAt }

// courses/{id}
{ code, name, facultyId, year, credits, students[], createdAt }

// attendance/{id}
{ courseId, date, timestamp, markedBy, records: [{studentId, studentName, rollNo, status}] }

// marks/{id}
{ courseId, studentId, examType, marks, maxMarks, grade, createdAt }

// projects/{id}
{ title, description, category, studentId, studentName, status, grade, submittedAt, files[] }

// notices/{id}
{ title, content, category, priority, targetAudience[], published, date, author, timestamp }

// assignments/{id}
{ courseId, title, description, dueDate, createdBy, createdAt, files[] }

// notes/{id}
{ title, subject, type, targetYears[], uploadedBy, uploadedAt, fileUrl, description }

// events/{id}
{ title, type, date, time, venue, description, published, createdAt }

// placements/{id}
{ company, role, type, ctc, deadline, eligibility[], published, createdAt }

// library/{id}
{ title, author, type, year, published, cover, accessUrl, createdAt }

// contacts/{id}
{ name, email, subject, message, timestamp }
```

## 🎨 Customization

### Colors (CSS Variables)
```css
:root {
  --primary: #0d6efd;
  --success: #198754;
  --warning: #ffc107;
  --danger: #dc3545;
  --info: #0dcaf0;
}
```

### Add New Student Section
1. Add section HTML in `dashstudent.html`
2. Add CSS in `dashstudent.css`
3. Add handler in `dashstudent.js`
4. Register in `showStudentSection()`

### Add New Admin Module
1. Add sidebar link in `admin.html`
2. Add section HTML
3. Add load/CRUD functions in `admin.js`
4. Register in `showAdminSection()`

## 📱 Responsive Breakpoints

| Device | Width | Behavior |
|--------|-------|----------|
| Mobile | < 576px | Stacked cards, hamburger menus |
| Tablet | 576-991px | 2-col grids, collapsible sidebars |
| Desktop | ≥ 992px | Full layouts, persistent sidebars |

## ♿ Accessibility

- Semantic HTML5 elements
- ARIA labels on interactive elements
- Focus indicators on all controls
- Color contrast ratios ≥ 4.5:1
- Keyboard navigable modals/forms
- Alt text on all images

## 🧪 Testing Checklist

- [ ] Faculty login → dashboard access
- [ ] Student login → dashboard access  
- [ ] Admin login → admin panel access
- [ ] Role-based redirects work
- [ ] Attendance save → Firestore
- [ ] Project submit → Firestore
- [ ] Notice publish → student view
- [ ] CSV import/export students
- [ ] Charts render in Analytics
- [ ] Toast notifications appear
- [ ] Form validation triggers
- [ ] Password reset email sent
- [ ] Mobile layout functional

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase not configured" | Check `firebase-config.js` has real values |
| Auth redirect loop | Ensure `users` doc exists with `role` field |
| Firestore permission denied | Deploy `firestore.rules`, check user role |
| Charts not rendering | Load Chart.js before dashboard scripts |
| CSS not loading | Check file paths, case-sensitivity on Linux |

## 📄 License

MIT License - Feel free to use for educational purposes.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

For issues, check Firebase Console logs or open a GitHub issue.

---

**Built with ❤️ for AIML Department, PCU**