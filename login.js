document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
  submitBtn.disabled = true;
  
  try {
    const success = await loginUser(email, password);
    if (success) {
      const user = getCurrentUser();
      if (user.type === "company") {
        window.location.href = "company-dashboard.html";
      } else {
        window.location.href = "user-dashboard.html";
      }
    } else {
      alert("البريد الإلكتروني أو كلمة المرور غير صحيحة");
    }
  } catch (error) {
    alert("حدث خطأ: " + error.message);
  } finally {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
});

document.getElementById("googleBtn").onclick = () => {
  alert("تسجيل Google قيد التطوير حاليًا");
};

document.getElementById("facebookBtn").onclick = () => {
  alert("تسجيل Facebook قيد التطوير حاليًا");
};

document.addEventListener("DOMContentLoaded", () => {
  const user = getCurrentUser();
  if (user) {
    if (user.type === "company") {
      window.location.href = "company-dashboard.html";
    } else if (user.type === "job_seeker") {
      window.location.href = "user-dashboard.html";
    }
  }
});