
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            setCurrentUser(result.user);
            if (result.user.type === "company") {
                window.location.href = "company-dashboard.html";
            } else {
                window.location.href = "user-dashboard.html";
            }
            return true;
        } else {
            alert(result.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert("حدث خطأ في الاتصال بالخادم. تأكد من تشغيل الخادم على http://localhost:3000");
        return false;
    }
}

async function registerUser(fullname, email, password, type) {
    try {
        const userData = {
            name: fullname,
            email: email,
            password: password,
            type: type
        };
        
        if (type === "company") {
            userData.company_name = fullname;
            userData.contact_email = email;
        }
        
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            return true;
        } else {
            alert(result.error || "حدث خطأ في التسجيل");
            return false;
        }
    } catch (error) {
        console.error('Register error:', error);
        alert("حدث خطأ في الاتصال بالخادم. تأكد من تشغيل الخادم على http://localhost:3000");
        return false;
    }
}