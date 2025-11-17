/* Unified script.js for login, nav, comments, feedback, dashboard */

// DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.split("/").pop();
  const current = path || "login.html";

  // If not on login and not logged in -> redirect to login
  const userName = localStorage.getItem("citizenName");
  if (!userName && current !== "login.html") {
    window.location.href = "login.html";
    return;
  }

  // Handle login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fullName = document.getElementById("fullName").value.trim();
      const nin = document.getElementById("nin").value.trim();
      const role = document.getElementById("role").value;
      if (!/^\d{11}$/.test(nin)) { alert("Please enter a valid 11-digit NIN."); return; }
      localStorage.setItem("citizenName", fullName);
      localStorage.setItem("citizenRole", role);
      const key = `feedback_${fullName.replace(/\s+/g,'_')}`;
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
      window.location.href = "index.html";
    });
  }

  // Build top nav on all pages
  buildTopNav();

  // Personalize header/sidebar/dashboard
  personalizeUI();

  // Feedback page handlers
  const feedbackForm = document.getElementById("feedbackForm");
  if (feedbackForm) {
    loadFeedbackList();
    feedbackForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitFeedback();
    });
  }

  // Dashboard load my feedback
  if (document.getElementById("myFeedbackList")) {
    loadMyFeedback();
  }
});

// Build top nav
function buildTopNav() {
  const user = localStorage.getItem("citizenName");
  const navHtml = user ? `
    <a href="index.html">Home</a>
    <a href="ministries.html">Ministries</a>
    <a href="news.html">National News</a>
    <a href="feedback.html">Feedback</a>
    <a href="dashboard.html">My Dashboard</a>
    <a href="#" id="navLogout">Logout</a>
  ` : `<a href="login.html">Login</a>`;

  document.querySelectorAll("#topnav, #topnav-ministries, #topnav-news, #topnav-feedback, #topnav-dashboard").forEach(n => {
    if (n) n.innerHTML = navHtml;
  });

  const logout = document.getElementById("navLogout");
  if (logout) logout.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });

  const sidebarLogout = document.getElementById("sidebarLogout");
  if (sidebarLogout) sidebarLogout.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });

  const dashLogout = document.getElementById("dashLogout");
  if (dashLogout) dashLogout.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
}

// Logout
function doLogout() {
  localStorage.removeItem("citizenName");
  localStorage.removeItem("citizenRole");
  window.location.href = "login.html";
}

// Personalize UI
function personalizeUI() {
  const name = localStorage.getItem("citizenName") || "Citizen";
  const role = localStorage.getItem("citizenRole") || "Citizen";

  // welcome heading
  const welcomeHeading = document.getElementById("welcomeHeading");
  if (welcomeHeading) welcomeHeading.textContent = `Welcome, ${name} — ${role === "executive" ? "Executive" : "Citizen"} 🇳🇬`;

  // sidebar
  const sidebarName = document.getElementById("sidebarName");
  if (sidebarName) sidebarName.textContent = name;
  const sidebarRole = document.getElementById("sidebarRole");
  if (sidebarRole) sidebarRole.textContent = role;

  // dashboard specifics
  const dashName = document.getElementById("dashName");
  if (dashName) dashName.textContent = name;
  const userFullName = document.getElementById("userFullName");
  if (userFullName) userFullName.textContent = name;

  // index sidebar small
  const sn = document.getElementById("sidebarName");
  if (sn) sn.textContent = name;
}

// Comments under posts
function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const list = document.getElementById(`comment-list-${postId}`);
  if (!input || !list) return;
  const txt = input.value.trim();
  if (!txt) { alert("Please enter a comment."); return; }
  const author = localStorage.getItem("citizenName") || "Anonymous";
  const li = document.createElement("li");
  li.textContent = `${author}: ${txt}`;
  list.appendChild(li);
  input.value = "";
}

/* Feedback persistence */
function submitFeedback() {
  const cat = document.getElementById("fbCategory").value;
  const msg = document.getElementById("fbMessage").value.trim();
  if (!cat || !msg) { alert("Please complete category and message."); return; }
  const fileInput = document.getElementById("fbAttach");
  let attachment = null;
  if (fileInput && fileInput.files && fileInput.files[0]) {
    // store name only for demo (not file contents)
    attachment = fileInput.files[0].name;
  }
  const user = localStorage.getItem("citizenName") || "Guest";
  const key = `feedback_${user.replace(/\s+/g,'_')}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  const item = { id: Date.now(), category:cat, message:msg, attachment: attachment, date: new Date().toISOString() };
  list.unshift(item);
  localStorage.setItem(key, JSON.stringify(list));

  // Global feed
  const global = JSON.parse(localStorage.getItem("global_feedback") || "[]");
  global.unshift({ user, ...item });
  localStorage.setItem("global_feedback", JSON.stringify(global));

  document.getElementById("fbMessage").value = "";
  document.getElementById("fbCategory").value = "";
  if (document.getElementById("feedbackConfirmation")) {
    document.getElementById("feedbackConfirmation").classList.remove("hidden");
    setTimeout(()=> { document.getElementById("feedbackConfirmation").classList.add("hidden"); loadFeedbackList(); }, 1400);
  } else {
    loadFeedbackList();
  }
}

// Load global feedback for feedback page
function loadFeedbackList() {
  const holder = document.getElementById("feedbackList");
  if (!holder) return;
  const global = JSON.parse(localStorage.getItem("global_feedback") || "[]");
  if (!global.length) { holder.innerHTML = `<div class="muted">No feedback submitted yet.</div>`; return; }
  let html = '';
  global.slice(0,20).forEach(f => {
    html += `<div class="post"><strong>${escapeHtml(f.user)}</strong> • <em>${new Date(f.date).toLocaleString()}</em><p>${escapeHtml(f.message)}</p><small class="muted">Category: ${escapeHtml(f.category)} ${f.attachment ? '• Attachment: ' + escapeHtml(f.attachment) : ''}</small></div>`;
  });
  holder.innerHTML = html;
}

// Load user feedback into dashboard
function loadMyFeedback() {
  const user = localStorage.getItem("citizenName") || "Guest";
  const key = `feedback_${user.replace(/\s+/g,'_')}`;
  const list = JSON.parse(localStorage.getItem(key) || "[]");
  const target = document.getElementById("myFeedbackList");
  if (!target) return;
  if (!list.length) { target.innerHTML = "<div class='muted'>You have not submitted any feedback.</div>"; return; }
  let html = "<ul>";
  list.forEach(i => html += `<li><strong>${new Date(i.date).toLocaleDateString()}</strong> • ${escapeHtml(i.category)} — ${escapeHtml(i.message)}</li>`);
  html += "</ul>";
  target.innerHTML = html;
}

// safe escape
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

function clearFeedback() {
  document.getElementById("fbCategory").value = "";
  document.getElementById("fbMessage").value = "";
}
