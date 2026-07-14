// Shared Authentication Utility
// Load this on all protected pages (dashfaculty.html, dashstudent.html, fy.html, admin.html)

const Auth = {
  // Initialize Firebase Auth listener
  init(onAuthChanged) {
    if (typeof firebase === 'undefined' || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
      console.warn('Firebase not configured - using demo mode');
      this.demoMode = true;
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            this.currentUser = { ...user, ...userData };
            if (onAuthChanged) onAuthChanged(this.currentUser);
          } else {
            // No user document - sign out
            await firebase.auth().signOut();
          }
        } catch (err) {
          console.error('Auth state error:', err);
        }
      } else {
        this.currentUser = null;
        if (onAuthChanged) onAuthChanged(null);
      }
    });
  },

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  },

  // Check if user has required role
  requireRole(allowedRoles) {
    const user = this.getCurrentUser();
    if (!user) {
      this.redirectToLogin();
      return false;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      this.redirectToLogin();
      return false;
    }
    return true;
  },

  // Logout
  async logout() {
    try {
      if (!this.demoMode) {
        await firebase.auth().signOut();
      }
      this.currentUser = null;
      window.location.href = 'login.html';
    } catch (err) {
      console.error('Logout error:', err);
    }
  },

  // Redirect to appropriate login
  redirectToLogin() {
    window.location.href = 'login.html';
  },

  // Demo mode login (for testing without Firebase)
  demoLogin(role, name = 'Demo User') {
    this.currentUser = {
      uid: 'demo-' + role,
      email: `${role}@demo.edu`,
      displayName: name,
      role: role
    };
    return this.currentUser;
  },

  // Show user info in UI
  updateUserUI() {
    const user = this.getCurrentUser();
    if (user) {
      const elements = document.querySelectorAll('[data-user-name], [data-user-role], [data-user-email]');
      elements.forEach(el => {
        if (el.dataset.userName) el.textContent = user.displayName || user.email;
        if (el.dataset.userRole) el.textContent = user.role;
        if (el.dataset.userEmail) el.textContent = user.email;
      });
    }
  }
};

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Auth.init(Auth.updateUserUI);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Auth;
}