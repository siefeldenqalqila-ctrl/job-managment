document.addEventListener("DOMContentLoaded", () => {
  const jobs = getJobs();
  const container = document.getElementById("featuredJobsContainer");
  const featured = jobs.slice(0, 3);
  if (featured.length === 0) {
    container.innerHTML = "<p class='col-span-full text-center'>لا توجد وظائف حالياً</p>";
    return;
  }
  container.innerHTML = featured.map(job => `
    <div class="bg-white p-5 rounded-xl shadow card-hover transition-custom">
      <h3 class="text-xl font-bold text-blue-800">${job.title}</h3>
      <p class="text-gray-600 mt-2">${job.companyName} - ${job.location}</p>
      <p class="text-gray-500 mt-1 text-sm">${job.description.substring(0, 80)}...</p>
      <div class="mt-4 flex justify-between items-center">
        <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">${job.industry}</span>
        <a href="jobs.html" class="text-blue-600">تفاصيل</a>
      </div>
    </div>
  `).join("");
});