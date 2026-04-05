// register.js - معدل للعمل مع API
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const userType = document.getElementById("userType").value;
    
    // التحقق من تطابق كلمة المرور
    if (password !== confirmPassword) {
        alert("كلمتا المرور غير متطابقتين");
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (password.length < 6) {
        alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        return;
    }
    
    // تعطيل الزر أثناء المعالجة
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
    submitBtn.disabled = true;
    
    try {
        const result = await registerUser(fullname, email, password, userType);
        
        if (result) {
            alert("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن.");
            window.location.href = "login.html";
        }
    } catch (error) {
        alert("حدث خطأ: " + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// إضافة التحقق من صحة البريد الإلكتروني في الوقت الفعلي
document.getElementById("email").addEventListener("blur", function() {
    const email = this.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        this.classList.add("border-red-500");
        alert("يرجى إدخال بريد إلكتروني صحيح");
    } else {
        this.classList.remove("border-red-500");
    }
});

// إظهار/إخفاء كلمة المرور (تحسين تجربة المستخدم)
const addPasswordToggle = () => {
    const passwordFields = ['password', 'confirmPassword'];
    passwordFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        const wrapper = field.parentElement;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'absolute left-3 top-10 text-gray-500';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.onclick = () => {
            const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
            field.setAttribute('type', type);
            toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        };
        wrapper.style.position = 'relative';
        wrapper.appendChild(toggleBtn);
    });
};

document.addEventListener("DOMContentLoaded", addPasswordToggle);