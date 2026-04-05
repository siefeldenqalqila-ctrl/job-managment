// user-dashboard.js - معدل للعمل مع API وعرض المهارات من قاعدة البيانات

let currentJobSeeker = null;
let userSkillsList = [];
let userApplicationsList = [];
let availableJobsList = [];

document.addEventListener("DOMContentLoaded", async () => {
    currentJobSeeker = getCurrentUser();
    
    if (!currentJobSeeker || currentJobSeeker.type !== "job_seeker") {
        alert("غير مصرح لك بالدخول. هذه الصفحة مخصصة للباحثين عن عمل.");
        window.location.href = "index.html";
        return;
    }
    
    await loadUserData();
    setupPersonalForm();
    renderSkillsTags();
    await renderAvailableJobs();
    await renderApplicationStatus();
    setupLogout();
});

async function loadUserData() {
    try {
        userSkillsList = await getUserSkills(currentJobSeeker.code);
        userApplicationsList = await getUserApplications(currentJobSeeker.code);
        availableJobsList = await getJobs();
        
        console.log("مهارات المستخدم:", userSkillsList);
        console.log("عدد المهارات:", userSkillsList.length);
        
    } catch (error) {
        console.error("خطأ في تحميل بيانات المستخدم:", error);
        alert("حدث خطأ في تحميل البيانات. يرجى تحديث الصفحة.");
    }
}

function renderSkillsTags() {
    const container = document.getElementById("skillsContainer");
    const skillsCount = document.getElementById("skillsCount");
    
    if (!container) return;
    
    if (userSkillsList.length === 0) {
        container.innerHTML = `
            <div class="empty-skills w-full text-center">
                <i class="fas fa-folder-open text-4xl text-gray-300 mb-2"></i>
                <p class="text-gray-400">لا توجد مهارات مضافة بعد</p>
                <p class="text-xs text-gray-400 mt-1">أضف مهاراتك في نموذج "البيانات الشخصية" أعلاه</p>
                <p class="text-xs text-blue-500 mt-2">💡 يمكنك إضافة أكثر من مهارة (مفصولة بفاصلة)</p>
            </div>
        `;
        if (skillsCount) skillsCount.textContent = "0";
        return;
    }
    
    container.innerHTML = userSkillsList.map(skill => `
        <span class="skill-tag">
            <i class="fas fa-check-circle ml-1 text-green-500"></i>
            ${escapeHtml(skill.name)}
        </span>
    `).join("");
    
    if (skillsCount) skillsCount.textContent = userSkillsList.length;
}

function setupPersonalForm() {
    document.getElementById("fullName").value = currentJobSeeker.name || "";
    
    const skillsText = userSkillsList.map(s => s.name).join(", ");
    document.getElementById("skills").value = skillsText;
    
    const skillsTextarea = document.getElementById("skills");
    if (skillsTextarea) {
        skillsTextarea.placeholder = "أدخل مهاراتك مفصولة بفاصلة (مثال: JavaScript, React, Node.js, HTML/CSS, Python)";
    }
    
    const personalForm = document.getElementById("personalForm");
    if (personalForm) {
        personalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const saveBtn = e.target.querySelector('button[type="submit"]');
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
            saveBtn.disabled = true;
            
            try {
                const newName = document.getElementById("fullName").value;
                const skillsText = document.getElementById("skills").value;
                const skillsArray = skillsText.split(",").map(s => s.trim()).filter(s => s !== "");
                
                // تحديث اسم المستخدم في sessionStorage فقط
                currentJobSeeker.name = newName;
                setCurrentUser(currentJobSeeker);
                
                // تحديث المهارات عبر API في قاعدة البيانات
                const result = await updateUserSkills(currentJobSeeker.code, skillsArray);
                
                // إعادة تحميل المهارات من قاعدة البيانات
                userSkillsList = await getUserSkills(currentJobSeeker.code);
                
                // تحديث عرض المهارات في حقل النص
                const updatedSkillsText = userSkillsList.map(s => s.name).join(", ");
                document.getElementById("skills").value = updatedSkillsText;
                
                // تحديث عرض المهارات كـ tags
                renderSkillsTags();
                
                let message = `✓ تم حفظ البيانات الشخصية بنجاح!\n`;
                message += `✓ تم حفظ ${userSkillsList.length} مهارة في قاعدة البيانات:\n`;
                message += userSkillsList.map(s => `  - ${s.name}`).join("\n");
                alert(message);
                
            } catch (error) {
                console.error("خطأ في الحفظ:", error);
                alert("خطأ في حفظ البيانات: " + error.message);
            } finally {
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    }
}

async function renderAvailableJobs() {
    const container = document.getElementById("availableJobs");
    if (!container) return;
    
    if (availableJobsList.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-briefcase fa-3x mb-2 opacity-30"></i><p>لا توجد وظائف متاحة حالياً</p><p class="text-sm mt-1">ترقب المزيد من الوظائف قريباً</p></div>';
        return;
    }
    
    const appliedJobIds = new Set(userApplicationsList.map(app => app.job_code));
    
    container.innerHTML = availableJobsList.map(job => `
        <div class="border border-gray-200 p-5 mb-4 rounded-xl shadow-sm hover:shadow-md transition-all">
            <div class="flex flex-col md:flex-row justify-between items-start gap-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-blue-700">${escapeHtml(job.title)}</h3>
                    <p class="text-gray-600 mb-2">
                        <i class="fas fa-building ml-1"></i> ${escapeHtml(job.company_name)}
                        <span class="mx-2">|</span>
                        <i class="fas fa-map-marker-alt ml-1"></i> ${escapeHtml(job.location || 'غير محدد')}
                    </p>
                    <p class="text-gray-500 text-sm">${escapeHtml(job.description.substring(0, 120))}${job.description.length > 120 ? '...' : ''}</p>
                    <div class="flex gap-2 mt-3">
                        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">${escapeHtml(job.industry || 'عام')}</span>
                        <span class="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            <i class="fas fa-calendar-alt ml-1"></i> ${new Date(job.created_at).toLocaleDateString('ar-EG')}
                        </span>
                    </div>
                    ${userSkillsList.length > 0 ? `
                        <div class="mt-2">
                            <span class="text-xs text-gray-500">مهاراتي: </span>
                            ${userSkillsList.map(s => `<span class="text-xs bg-gray-100 px-2 py-1 rounded ml-1">${escapeHtml(s.name)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div>
                    ${appliedJobIds.has(job.code) ? 
                        `<button disabled class="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed">
                            <i class="fas fa-check ml-1"></i> تم التقديم
                        </button>` : 
                        `<button onclick="applyForJob('${job.code}')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition transform hover:scale-105">
                            <i class="fas fa-paper-plane ml-1"></i> تقديم
                        </button>`
                    }
                </div>
            </div>
        </div>
    `).join("");
}

window.applyForJob = async (jobId) => {
    const button = event.target.closest('button');
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري...';
    button.disabled = true;
    
    try {
        await applyToJob(currentJobSeeker.code, jobId);
        alert("✓ تم تقديم طلبك بنجاح!");
        
        userApplicationsList = await getUserApplications(currentJobSeeker.code);
        await renderAvailableJobs();
        await renderApplicationStatus();
    } catch (error) {
        alert("خطأ: " + error.message);
        button.innerHTML = originalText;
        button.disabled = false;
    }
};

async function renderApplicationStatus() {
    const container = document.getElementById("applicationStatus");
    if (!container) return;
    
    if (userApplicationsList.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-file-alt fa-3x mb-2 opacity-30"></i><p>لم تتقدم لأي وظيفة بعد</p><p class="text-sm mt-1">تصفح الوظائف المتاحة وابدأ رحلتك المهنية</p></div>';
        return;
    }
    
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800'
    };
    
    const statusTexts = {
        pending: '⏳ قيد المراجعة',
        accepted: '✓ تم القبول',
        rejected: '✗ مرفوض'
    };
    
    container.innerHTML = userApplicationsList.map(app => `
        <div class="border border-gray-200 p-4 mb-3 rounded-lg">
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-bold text-gray-800">${escapeHtml(app.job_title)}</h4>
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-building ml-1"></i> ${escapeHtml(app.company_name)}
                    </p>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-sm ${statusColors[app.status]}">
                        ${statusTexts[app.status]}
                    </span>
                    <p class="text-xs text-gray-400 mt-1">
                        <i class="fas fa-clock ml-1"></i> ${new Date(app.applied_at).toLocaleString('ar-EG')}
                    </p>
                </div>
            </div>
        </div>
    `).join("");
}

function setupLogout() {
    const logoutBtn = document.getElementById("logoutUserBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            if (confirm("هل تريد تسجيل الخروج؟")) {
                logout();
            }
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}