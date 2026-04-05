
let currentCompanyUser = null;
let currentCompanyProfile = null;
let companyJobsList = [];
let companyApplicationsList = [];
let allUsersList = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentCompanyUser = getCurrentUser();
  
  if (!currentCompanyUser || currentCompanyUser.type !== "company") {
    alert("غير مصرح لك بالدخول. هذه الصفحة مخصصة للشركات فقط.");
    window.location.href = "index.html";
    return;
  }
  
  await loadCompanyData();
  updateStatistics();
  setupTabs();
  setupForms();
  await renderCompanyJobs();
  await renderApplicants();
  setupLogout();
  
  const nameDisplay = document.getElementById("companyNameDisplay");
  if (nameDisplay && currentCompanyProfile) {
    nameDisplay.innerText = currentCompanyProfile.company_name || currentCompanyUser.name;
  }
});

async function loadCompanyData() {
  try {
    currentCompanyProfile = await getCompanyProfile(currentCompanyUser.code);
    companyJobsList = await getCompanyJobs(currentCompanyUser.code);
    companyApplicationsList = await getCompanyApplications(currentCompanyUser.code);
    allUsersList = await getUsers();
  } catch (error) {
    console.error("خطأ في تحميل بيانات الشركة:", error);
    alert("حدث خطأ في تحميل البيانات. يرجى تحديث الصفحة.");
  }
}

function updateStatistics() {
  const totalUsers = allUsersList.length;
  document.getElementById("totalUsersCount").innerText = totalUsers;
  
  const myJobsCount = companyJobsList.length;
  document.getElementById("myJobsCount").innerText = myJobsCount;
  
  const totalApplicants = companyApplicationsList.length;
  document.getElementById("totalApplicantsCount").innerText = totalApplicants;
  
  const pendingApplicants = companyApplicationsList.filter(app => app.status === "pending").length;
  document.getElementById("pendingApplicantsCount").innerText = pendingApplicants;
  
  const acceptedCount = companyApplicationsList.filter(app => app.status === "accepted").length;
  const rejectedCount = companyApplicationsList.filter(app => app.status === "rejected").length;
  const pendingCount = pendingApplicants;
  
  const acceptedPercent = totalApplicants > 0 ? Math.round((acceptedCount / totalApplicants) * 100) : 0;
  const rejectedPercent = totalApplicants > 0 ? Math.round((rejectedCount / totalApplicants) * 100) : 0;
  const pendingPercent = totalApplicants > 0 ? Math.round((pendingCount / totalApplicants) * 100) : 0;
  
  document.getElementById("acceptedPercent").innerText = acceptedPercent + "%";
  document.getElementById("rejectedPercent").innerText = rejectedPercent + "%";
  document.getElementById("pendingPercent").innerText = pendingPercent + "%";
  
  document.getElementById("acceptedBar").style.width = acceptedPercent + "%";
  document.getElementById("rejectedBar").style.width = rejectedPercent + "%";
  document.getElementById("pendingBar").style.width = pendingPercent + "%";
  
  document.getElementById("summaryAccepted").innerText = acceptedCount;
  document.getElementById("summaryRejected").innerText = rejectedCount;
  document.getElementById("summaryPending").innerText = pendingCount;
  document.getElementById("summaryTotal").innerText = totalApplicants;
  
  const pendingElement = document.getElementById("pendingApplicantsCount");
  if (pendingCount > 0) {
    pendingElement.classList.add("pending-count");
    document.title = `(${pendingCount}) Nexthire - لوحة تحكم الشركة`;
  } else {
    pendingElement.classList.remove("pending-count");
    document.title = "Nexthire - لوحة تحكم الشركة";
  }
}

function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panes = document.querySelectorAll(".tab-pane");
  
  function activateTab(tabId) {
    panes.forEach(pane => pane.classList.add("hidden"));
    const activePane = document.getElementById(`${tabId}Tab`);
    if (activePane) activePane.classList.remove("hidden");
    
    tabBtns.forEach(btn => {
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("tab-active");
        btn.classList.remove("tab-inactive");
      } else {
        btn.classList.remove("tab-active");
        btn.classList.add("tab-inactive");
      }
    });
  }
  
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      activateTab(tabId);
    });
  });
  
  activateTab("info");
}

function setupForms() {
  if (currentCompanyProfile) {
    document.getElementById("companyName").value = currentCompanyProfile.company_name || "";
    document.getElementById("industry").value = currentCompanyProfile.industry || "";
    document.getElementById("location").value = currentCompanyProfile.location || "";
    document.getElementById("description").value = currentCompanyProfile.description || "";
    document.getElementById("contactEmail").value = currentCompanyProfile.contact_email || currentCompanyUser.email;
    document.getElementById("phone").value = currentCompanyProfile.phone || "";
    document.getElementById("website").value = currentCompanyProfile.website || "";
  }
  
  const companyForm = document.getElementById("companyInfoForm");
  if (companyForm) {
    companyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const saveBtn = e.target.querySelector('button[type="submit"]');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      saveBtn.disabled = true;
      
      try {
        const updatedData = {
          company_name: document.getElementById("companyName").value,
          industry: document.getElementById("industry").value,
          location: document.getElementById("location").value,
          description: document.getElementById("description").value,
          contact_email: document.getElementById("contactEmail").value,
          phone: document.getElementById("phone").value,
          website: document.getElementById("website").value,
        };
        
        await updateCompanyProfile(currentCompanyUser.code, updatedData);
        currentCompanyProfile = updatedData;
        
        const nameDisplay = document.getElementById("companyNameDisplay");
        if (nameDisplay) nameDisplay.innerText = updatedData.company_name || currentCompanyUser.name;
        
        alert("✓ تم حفظ بيانات الشركة بنجاح");
      } catch (error) {
        alert("خطأ في حفظ البيانات: " + error.message);
      } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }
    });
  }
  
  const postForm = document.getElementById("postJobForm");
  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const submitBtn = e.target.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري النشر...';
      submitBtn.disabled = true;
      
      try {
        const newJob = {
          company_code: currentCompanyUser.code,
          title: document.getElementById("jobTitle").value,
          description: document.getElementById("jobDesc").value,
          industry: document.getElementById("jobIndustry").value,
          location: document.getElementById("jobLocation").value,
        };
        
        await createJob(newJob);
        alert("✓ تم نشر الوظيفة بنجاح");
        postForm.reset();
        
        companyJobsList = await getCompanyJobs(currentCompanyUser.code);
        await renderCompanyJobs();
        await renderApplicants();
        updateStatistics();
        
      } catch (error) {
        alert("خطأ في نشر الوظيفة: " + error.message);
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
}

async function renderCompanyJobs() {
  const container = document.getElementById("companyJobsList");
  if (!container) return;
  
  if (companyJobsList.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-briefcase fa-3x mb-2 opacity-30"></i><p>لا توجد وظائف منشورة حالياً</p><p class="text-sm mt-1">انقر على تبويب "نشر وظيفة" لإضافة وظيفة جديدة</p></div>';
    return;
  }
  
  container.innerHTML = companyJobsList.map(job => `
    <div class="border border-gray-200 p-5 mb-4 rounded-xl shadow-sm hover:shadow-md transition-all">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h4 class="font-bold text-lg text-gray-800">${escapeHtml(job.title)}</h4>
          <p class="text-sm text-gray-600 mt-1">
            <i class="fas fa-map-marker-alt ml-1"></i> ${escapeHtml(job.location || 'غير محدد')}
            <span class="mx-2">|</span>
            <i class="fas fa-tag ml-1"></i> ${escapeHtml(job.industry || 'عام')}
          </p>
          <p class="text-gray-500 text-sm mt-2">${escapeHtml(job.description.substring(0, 100))}${job.description.length > 100 ? '...' : ''}</p>
          <p class="text-xs text-gray-400 mt-2">
            <i class="fas fa-calendar-alt ml-1"></i> نشرت في ${new Date(job.created_at).toLocaleDateString('ar-EG')}
          </p>
        </div>
        <button onclick="deleteJobHandler('${job.code}')" class="text-red-500 hover:text-red-700 transition p-2">
          <i class="fas fa-trash-alt text-xl"></i>
        </button>
      </div>
    </div>
  `).join("");
}

window.deleteJobHandler = async (jobId) => {
  if (confirm("⚠️ هل أنت متأكد من حذف هذه الوظيفة؟\nسيتم حذف جميع طلبات المتقدمين المرتبطة بها.")) {
    try {
      await deleteJob(jobId);
      alert("✓ تم حذف الوظيفة بنجاح");
      
      companyJobsList = await getCompanyJobs(currentCompanyUser.code);
      companyApplicationsList = await getCompanyApplications(currentCompanyUser.code);
      await renderCompanyJobs();
      await renderApplicants();
      updateStatistics();
      
    } catch (error) {
      alert("خطأ في حذف الوظيفة: " + error.message);
    }
  }
};

async function renderApplicants() {
  const container = document.getElementById("applicantsList");
  if (!container) return;
  
  if (companyApplicationsList.length === 0) {
    container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-users fa-3x mb-2 opacity-30"></i><p>لا يوجد متقدمون حتى الآن</p><p class="text-sm mt-1">عندما يتقدم أشخاص لوظائفك، ستراهم هنا</p></div>';
    return;
  }
  
  container.innerHTML = companyApplicationsList.map(app => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    
    const statusTexts = {
      pending: '⏳ قيد المراجعة',
      accepted: '✓ مقبول',
      rejected: '✗ مرفوض'
    };
    
    return `
      <div class="border border-gray-200 p-5 mb-4 rounded-xl shadow-sm hover:shadow-md transition-all">
        <div class="flex flex-col md:flex-row justify-between items-start gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <i class="fas fa-user-circle text-2xl text-blue-500"></i>
              <h4 class="font-bold text-lg text-gray-800">${escapeHtml(app.user_name)}</h4>
              <span class="px-2 py-1 rounded-full text-xs ${statusColors[app.status]}">${statusTexts[app.status]}</span>
            </div>
            <p class="text-sm text-gray-600">
              <i class="fas fa-briefcase ml-1"></i> الوظيفة: ${escapeHtml(app.job_title)}
            </p>
            <p class="text-sm text-gray-600">
              <i class="fas fa-envelope ml-1"></i> البريد: ${escapeHtml(app.user_email)}
            </p>
            <p class="text-xs text-gray-400 mt-2">
              <i class="fas fa-clock ml-1"></i> تقدم في: ${new Date(app.applied_at).toLocaleString('ar-EG')}
            </p>
          </div>
          ${app.status === "pending" ? `
            <div class="flex gap-2">
              <button onclick="updateStatusHandler('${app.code}', 'accepted')" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition transform hover:scale-105">
                <i class="fas fa-check ml-1"></i> قبول
              </button>
              <button onclick="updateStatusHandler('${app.code}', 'rejected')" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition transform hover:scale-105">
                <i class="fas fa-times ml-1"></i> رفض
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");
}

window.updateStatusHandler = async (appId, status) => {
  const statusText = status === 'accepted' ? 'قبول' : 'رفض';
  if (confirm(`هل أنت متأكد من ${statusText} هذا المتقدم؟`)) {
    try {
      await updateApplicationStatus(appId, status);
      alert(`✓ تم ${statusText} المتقدم بنجاح`);
      
      companyApplicationsList = await getCompanyApplications(currentCompanyUser.code);
      await renderApplicants();
      updateStatistics();
      
    } catch (error) {
      alert("خطأ في تحديث الحالة: " + error.message);
    }
  }
};

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
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