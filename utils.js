// utils.js - دوال API و localStorage معًا للتوافق

// تحديد رابط API تلقائياً (يعمل محلياً وعلى السحابة)
const API_BASE = (() => {
    // إذا كنا في بيئة الإنتاج (Railway, Render, إلخ)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // استخدم نفس الرابط الحالي
        return '';
    }
    // محلياً
    return 'http://localhost:3000';
})();

let currentUser = null;

// ============= دوال localStorage (للتوافق مع الكود القديم) =============
const STORAGE_USERS = "jobportal_users";
const STORAGE_JOBS = "jobportal_jobs";
const STORAGE_APPLICATIONS = "jobportal_applications";
const STORAGE_COMPANIES = "jobportal_companies";

function getUsersLocal() { 
    const users = localStorage.getItem(STORAGE_USERS);
    return users ? JSON.parse(users) : []; 
}

function saveUsers(users) { 
    localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); 
}

function getJobsLocal() { 
    return JSON.parse(localStorage.getItem(STORAGE_JOBS)) || []; 
}

function saveJobs(jobs) { 
    localStorage.setItem(STORAGE_JOBS, JSON.stringify(jobs)); 
}

function getApplications() { 
    return JSON.parse(localStorage.getItem(STORAGE_APPLICATIONS)) || []; 
}

function saveApplications(apps) { 
    localStorage.setItem(STORAGE_APPLICATIONS, JSON.stringify(apps)); 
}

function getCompaniesData() { 
    return JSON.parse(localStorage.getItem(STORAGE_COMPANIES)) || {}; 
}

function saveCompaniesData(data) { 
    localStorage.setItem(STORAGE_COMPANIES, JSON.stringify(data)); 
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const stored = sessionStorage.getItem('currentUser');
    if (stored) currentUser = JSON.parse(stored);
    return currentUser;
}

function setCurrentUser(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ============= دوال API =============
async function apiCall(endpoint, options = {}) {
    try {
        const url = `${API_BASE}/api${endpoint}`;
        console.log(`🌐 Calling API: ${url}`);
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'حدث خطأ');
        }
        return response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// مستخدمين - API
async function registerUserAPI(userData) {
    return apiCall('/register', { method: 'POST', body: JSON.stringify(userData) });
}

async function loginUserAPI(email, password) {
    const data = await apiCall('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (data.success) {
        currentUser = data.user;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        return true;
    }
    return false;
}

async function getUsersAPI() {
    return apiCall('/users');
}

// دوال API للوظائف
async function getJobsAPI() {
    return apiCall('/jobs');
}

async function createJobAPI(jobData) {
    return apiCall('/jobs', { method: 'POST', body: JSON.stringify(jobData) });
}

async function deleteJobAPI(jobCode) {
    return apiCall(`/jobs/${jobCode}`, { method: 'DELETE' });
}

// دوال API للطلبات
async function applyToJobAPI(userCode, jobCode) {
    return apiCall('/applications', { method: 'POST', body: JSON.stringify({ user_code: userCode, job_code: jobCode }) });
}

async function getCompanyApplicationsAPI(companyCode) {
    return apiCall(`/company-applications/${companyCode}`);
}

async function updateApplicationStatusAPI(appCode, status) {
    return apiCall(`/applications/${appCode}`, { method: 'PUT', body: JSON.stringify({ status }) });
}

// دوال API لبيانات الشركة
async function getCompanyProfileAPI(userCode) {
    return apiCall(`/company-profile/${userCode}`);
}

async function updateCompanyProfileAPI(userCode, profileData) {
    return apiCall(`/company-profile/${userCode}`, { method: 'PUT', body: JSON.stringify(profileData) });
}

async function getCompanyJobsAPI(companyCode) {
    return apiCall(`/company-jobs/${companyCode}`);
}

// دوال API لمهارات المستخدم
async function getUserSkillsAPI(userCode) {
    return apiCall(`/user-skills/${userCode}`);
}

async function updateUserSkillsAPI(userCode, skills) {
    return apiCall(`/user-skills/${userCode}`, { method: 'PUT', body: JSON.stringify({ skills }) });
}

async function getUserApplicationsAPI(userCode) {
    return apiCall(`/user-applications/${userCode}`);
}

// ============= دوال التوافق =============
async function getJobs() {
    try {
        return await getJobsAPI();
    } catch (error) {
        console.warn('Using local jobs data');
        return getJobsLocal();
    }
}

async function getUsers() {
    try {
        return await getUsersAPI();
    } catch (error) {
        console.warn('Using local users data');
        return getUsersLocal();
    }
}

// تصدير الدوال للاستخدام
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.getJobs = getJobs;
window.saveJobs = saveJobs;
window.getApplications = getApplications;
window.saveApplications = saveApplications;
window.getCompaniesData = getCompaniesData;
window.saveCompaniesData = saveCompaniesData;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.logout = logout;
window.registerUser = registerUserAPI;
window.loginUser = loginUserAPI;
window.createJob = createJobAPI;
window.deleteJob = deleteJobAPI;
window.applyToJob = applyToJobAPI;
window.getCompanyApplications = getCompanyApplicationsAPI;
window.updateApplicationStatus = updateApplicationStatusAPI;
window.getCompanyProfile = getCompanyProfileAPI;
window.updateCompanyProfile = updateCompanyProfileAPI;
window.getCompanyJobs = getCompanyJobsAPI;
window.getUserSkills = getUserSkillsAPI;
window.updateUserSkills = updateUserSkillsAPI;
window.getUserApplications = getUserApplicationsAPI;

console.log('✅ utils.js loaded, API_BASE:', API_BASE);