let allJobs = [];

async function renderJobs() {
  const search = document.getElementById("searchInput")?.value.toLowerCase() || "";
  const industry = document.getElementById("industryFilter")?.value || "";
  
  let filtered = allJobs.filter(job => 
    job.title.toLowerCase().includes(search) &&
    (industry === "" || job.industry === industry)
  );
  
  const container = document.getElementById("jobsList");
  if (!container) return;
  
  const currentUser = getCurrentUser();
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">لا توجد وظائف متطابقة مع البحث</div>';
    return;
  }
  
  container.innerHTML = filtered.map(job => `
    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-bold text-blue-700">${escapeHtml(job.title)}</h3>
        <span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">${job.industry || 'عام'}</span>
      </div>
      <p class="text-gray-600 mb-2">
        <i class="fas fa-building ml-1"></i> ${escapeHtml(job.company_name)} 
        <i class="fas fa-map-marker-alt mr-2 ml-1"></i> ${escapeHtml(job.location || 'غير محدد')}
      </p>
      <p class="text-gray-500 text-sm mb-4 line-clamp-2">${escapeHtml(job.description.substring(0, 150))}${job.description.length > 150 ? '...' : ''}</p>
      <div class="flex justify-between items-center">
        <small class="text-gray-400">
          <i class="fas fa-calendar-alt ml-1"></i> ${new Date(job.created_at).toLocaleDateString('ar-EG')}
        </small>
        ${currentUser && currentUser.type === "job_seeker" ? 
          `<button onclick="applyToJobHandler('${job.code}')" class="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg transition transform hover:scale-105">
            <i class="fas fa-paper-plane ml-1"></i> قدم الآن
          </button>` : 
          (!currentUser ? 
            `<a href="login.html" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg inline-block">
              <i class="fas fa-sign-in-alt ml-1"></i> سجل للتقديم
            </a>` : '')
        }
      </div>
    </div>
  `).join("");
}

window.applyToJobHandler = async (jobId) => {
  const user = getCurrentUser();
  if (!user) {
    alert("يجب تسجيل الدخول أولاً");
    window.location.href = "login.html";
    return;
  }
  
  const button = event.target.closest('button');
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري...';
  button.disabled = true;
  
  try {
    await applyToJob(user.code, jobId);
    alert("✓ تم تقديم طلبك بنجاح!");
    button.innerHTML = '<i class="fas fa-check ml-1"></i> تم التقديم';
    button.disabled = true;
    button.classList.remove('bg-green-600', 'hover:bg-green-700');
    button.classList.add('bg-gray-400');
  } catch (error) {
    alert("خطأ: " + error.message);
    button.innerHTML = originalText;
    button.disabled = false;
  }
};

async function loadJobs() {
  const container = document.getElementById("jobsList");
  if (container) {
    container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-blue-600 text-3xl"></i><p class="mt-2">جاري تحميل الوظائف...</p></div>';
  }
  
  try {
    allJobs = await getJobs();
    await renderJobs();
  } catch (error) {
    console.error("خطأ في تحميل الوظائف:", error);
    if (container) {
      container.innerHTML = '<div class="col-span-full text-center text-red-500 py-10">حدث خطأ في تحميل الوظائف. يرجى تحديث الصفحة.</div>';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadJobs();
  
  const searchInput = document.getElementById("searchInput");
  const industryFilter = document.getElementById("industryFilter");
  
  if (searchInput) searchInput.addEventListener("input", renderJobs);
  if (industryFilter) industryFilter.addEventListener("change", renderJobs);
  
  const user = getCurrentUser();
  const nav = document.getElementById("userNav");
  if (nav) {
    if (user) {
      nav.innerHTML = `
        <div class="flex items-center gap-3">
          <span class="text-gray-700"><i class="fas fa-user ml-1"></i> مرحباً ${escapeHtml(user.name)}</span>
          <a href="${user.type === 'company' ? 'company-dashboard.html' : 'user-dashboard.html'}" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
            <i class="fas fa-tachometer-alt ml-1"></i> لوحتي
          </a>
        </div>
      `;
    } else {
      nav.innerHTML = `<a href="login.html" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
        <i class="fas fa-sign-in-alt ml-1"></i> دخول
      </a>`;
    }
  }
});