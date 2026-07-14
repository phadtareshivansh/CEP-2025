# 🚀 Deployment Guide - AIML Faculty Portal

## Prerequisites

1. **Firebase Project** - Create at [Firebase Console](https://console.firebase.google.com/)
2. **Node.js 18+** - For Firebase CLI
3. **Git** - For version control

---

## 1. Firebase Project Setup

### Create Project
```bash
# Go to https://console.firebase.google.com/
# Click "Create Project" → Enter name → Enable Google Analytics (optional)
```

### Enable Services
```
Authentication → Sign-in method → Email/Password → Enable
Firestore Database → Create Database → Start in test mode → Choose location
Storage → Get Started → Start in test mode
Hosting → Get Started
```

### Get Web App Config
```
Project Settings → General → Your apps → Web app (</>) 
→ Register app → Copy config object
```

---

## 2. Local Configuration

### Update Firebase Config
Edit `assets/js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

---

## 3. Firestore Security Rules

### Deploy Rules
```bash
# Copy firestore.rules content to Firebase Console
# Console → Firestore → Rules → Paste → Publish
```

### Production Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - own data only
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Faculty - public read, admin write
    match /faculty/{docId} {
      allow read: if true;
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Students - faculty/admin access
    match /students/{docId} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'];
      allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Courses - faculty can manage own
    match /courses/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.data.facultyId == request.auth.uid;
      allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'];
    }
    
    // Attendance - faculty marks, students read own
    match /attendance/{docId} {
      allow read: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'] ||
         resource.data.records.studentId == request.auth.uid);
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'];
    }
    
    // Projects - students create, faculty/admin read all
    match /projects/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
      allow update, delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'] ||
         resource.data.studentId == request.auth.uid);
    }
    
    // Notices - admin/faculty create, targeted audience reads
    match /notices/{docId} {
      allow read: if request.auth != null && 
        (resource.data.targetAudience.hasAny(get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role));
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'faculty'];
    }
    
    // Admin only collections
    match /{doc=**}/{docId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 4. Create Demo Users

### Option A: Via Firebase Console
```
Authentication → Users → Add user
1. admin@college.edu / admin123 → Copy UID
2. faculty@college.edu / faculty123 → Copy UID  
3. student@college.edu / student123 → Copy UID
```

### Option B: Via Admin Panel (after deploy)
```
1. Login as admin (create first user manually in Auth)
2. Go to /admin.html
3. Use "Add User" modal to create faculty/student
```

### Create User Documents in Firestore
```javascript
// In Firestore Console → users collection → Add document (UID from Auth)
{
  "email": "admin@college.edu",
  "name": "Admin User",
  "role": "admin",
  "createdAt": Timestamp.now(),
  "active": true
}
```

---

## 5. Firestore Indexes

### Auto-create (on first query failure)
```bash
# When query fails, Firebase gives a link to create index
# Click link in browser console error
```

### Manual via Console
```
Firestore → Indexes → Composite → Add Index
Collection: attendance
Fields: courseId (Asc), timestamp (Desc)
```

---

## 5. Local Development

### Start Local Server
```bash
# Python
python -m http.server 8000

# Node (if installed)
npx serve .

# VS Code
# Right-click index.html → "Open with Live Server"
```

### Test Checklist
- [ ] Open http://localhost:8000
- [ ] Homepage loads with carousel
- [ ] Faculty login → dashfaculty.html
- [ ] Student login → dashstudent.html
- [ ] Admin login → admin.html
- [ ] Attendance save works
- [ ] Project submit works
- [ ] Notices appear
- [ ] Charts render

---

## 6. Production Deployment

### Deploy All
```bash
firebase deploy
```

### Deploy Specific Services
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

### Preview Channel (for PRs)
```bash
firebase hosting:channel:deploy preview-channel-name
```

---

## 7. CI/CD Setup (GitHub Actions)

### Add Repository Secrets
```
GitHub Repo → Settings → Secrets → Actions → New Repository Secret
FIREBASE_SERVICE_ACCOUNT = <full service account JSON>
FIREBASE_PROJECT_ID = your-project-id
```

### Get Service Account
```
Firebase Console → Project Settings → Service Accounts → Generate New Private Key
Copy entire JSON content
```

### Workflow Already Included
```
.github/workflows/firebase-hosting.yml
- Deploys preview on PR
- Deploys production on main push
```

---

## 8. Custom Domain (Optional)

```bash
# In Firebase Console → Hosting → Add custom domain
# Follow DNS verification steps
# firebase deploy --only hosting
```

---

## 9. Monitoring & Analytics

### Enable Analytics
```
Firebase Console → Analytics → Enable
```

### Performance Monitoring
```javascript
// Add to firebase-config.js
import { getPerformance } from "firebase/performance";
const perf = getPerformance(app);
```

### Error Tracking (Sentry)
```html
<!-- Add to all HTML files before </head> -->
<script src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js" 
        integrity="sha384-..." crossorigin="anonymous"></script>
<script>
  Sentry.init({ dsn: "YOUR_SENTRY_DSN" });
</script>
```

---

## 10. Backup Strategy

### Automated Backup (Cloud Functions)
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.backupFirestore = functions.pubsub
  .schedule('0 2 * * *') // Daily 2 AM
  .onRun(async () => {
    const projectId = process.env.GCLOUD_PROJECT;
    const bucket = `gs://${projectId}-backups`;
    await admin.firestore().exportDocuments(bucket);
    console.log('Backup completed');
  });
```

### Manual Backup
```bash
# Export
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)

# Import
gcloud firestore import gs://your-bucket/backup-20241215
```

---

## 11. Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase not configured" | Update `firebase-config.js` with real values |
| Auth redirect loop | Ensure `users` doc exists with `role` field |
| "Missing index" error | Click link in console or create manually |
| Charts not showing | Check Chart.js loads before dashboard scripts |
| CORS errors | Deploy to Firebase Hosting (not file://) |
| CSS not loading | Check case-sensitive paths on Linux |
| 404 on refresh | Add rewrite rule in `firebase.json` |

---

## 12. Performance Optimization

### Enable Compression
```json
// firebase.json
"headers": [
  {
    "source": "**/*.@(js|css|html|svg)",
    "headers": [{"key": "Content-Encoding", "value": "gzip"}]
  }
]
```

### Code Splitting (Future)
```javascript
// Lazy load heavy modules
const loadChart = () => import('./charts.js');
const loadAdmin = () => import('./admin.js');
```

---

## 📞 Support

- **Firebase Docs**: https://firebase.google.com/docs
- **Firestore Rules**: https://firebase.google.com/docs/firestore/security/get-started
- **Hosting**: https://firebase.google.com/docs/hosting

---

**Last Updated**: $(date)
**Version**: 1.0.0