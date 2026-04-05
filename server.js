const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// استخدام better-sqlite3
const dbPath = process.env.DATABASE_PATH || './database.db';
const db = new Database(dbPath);

console.log('✅ تم الاتصال بقاعدة البيانات');

// إنشاء الجداول
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        type TEXT CHECK(type IN ('company', 'job_seeker')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_profiles (
        user_code TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        industry TEXT,
        location TEXT,
        description TEXT,
        contact_email TEXT,
        phone TEXT,
        website TEXT,
        FOREIGN KEY (user_code) REFERENCES users(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
        code TEXT PRIMARY KEY,
        company_code TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        industry TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_code) REFERENCES users(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
        code TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_skills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_code TEXT NOT NULL,
        skill_code TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_code, skill_code),
        FOREIGN KEY (user_code) REFERENCES users(code) ON DELETE CASCADE,
        FOREIGN KEY (skill_code) REFERENCES skills(code) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
        code TEXT PRIMARY KEY,
        user_code TEXT NOT NULL,
        job_code TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_code, job_code),
        FOREIGN KEY (user_code) REFERENCES users(code) ON DELETE CASCADE,
        FOREIGN KEY (job_code) REFERENCES jobs(code) ON DELETE CASCADE
    );
`);

console.log('✅ تم إنشاء الجداول بنجاح');

// إضافة بيانات تجريبية
const row = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (row.count === 0) {
    console.log('📝 جاري إضافة بيانات تجريبية...');
    
    const companyCode = uuidv4();
    const hashedCompanyPassword = bcrypt.hashSync('123456', 10);
    
    db.prepare('INSERT INTO users (code, name, email, password, type) VALUES (?, ?, ?, ?, ?)')
        .run(companyCode, 'شركة تقنية', 'company@test.com', hashedCompanyPassword, 'company');
    
    db.prepare('INSERT INTO company_profiles (user_code, company_name, industry, location, description, contact_email) VALUES (?, ?, ?, ?, ?, ?)')
        .run(companyCode, 'شركة تقنية', 'تقنية المعلومات', 'القاهرة', 'شركة رائدة في مجال التكنولوجيا', 'company@test.com');
    
    const job1Code = uuidv4();
    const job2Code = uuidv4();
    
    db.prepare('INSERT INTO jobs (code, company_code, title, description, industry, location) VALUES (?, ?, ?, ?, ?, ?)')
        .run(job1Code, companyCode, 'مطور Frontend', 'مطلوب مطور Frontend بخبرة في React و Vue.js', 'تقنية', 'القاهرة');
    
    db.prepare('INSERT INTO jobs (code, company_code, title, description, industry, location) VALUES (?, ?, ?, ?, ?, ?)')
        .run(job2Code, companyCode, 'مسوق رقمي', 'مطلوب مسوق رقمي لإدارة حملات التواصل الاجتماعي', 'تسويق', 'دبي');
    
    const seekerCode = uuidv4();
    const hashedSeekerPassword = bcrypt.hashSync('123456', 10);
    
    db.prepare('INSERT INTO users (code, name, email, password, type) VALUES (?, ?, ?, ?, ?)')
        .run(seekerCode, 'أحمد محمد', 'user@test.com', hashedSeekerPassword, 'job_seeker');
    
    const skillsToAdd = ['JavaScript', 'React', 'Node.js', 'HTML/CSS'];
    for (const skillName of skillsToAdd) {
        let skill = db.prepare('SELECT code FROM skills WHERE name = ?').get(skillName);
        if (!skill) {
            const skillCode = uuidv4();
            db.prepare('INSERT INTO skills (code, name) VALUES (?, ?)').run(skillCode, skillName);
            db.prepare('INSERT INTO user_skills (user_code, skill_code) VALUES (?, ?)').run(seekerCode, skillCode);
        } else {
            db.prepare('INSERT INTO user_skills (user_code, skill_code) VALUES (?, ?)').run(seekerCode, skill.code);
        }
    }
    
    console.log('✅ تم إضافة البيانات التجريبية بنجاح!');
    console.log('📝 حسابات تجريبية:');
    console.log('   شركة: company@test.com / 123456');
    console.log('   باحث: user@test.com / 123456');
}

// ============= API ENDPOINTS =============

app.get('/api/users', (req, res) => {
    try {
        const rows = db.prepare('SELECT code, name, email, type, created_at FROM users ORDER BY created_at DESC').all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, password, type, company_name, contact_email } = req.body;
    
    if (!name || !email || !password || !type) {
        return res.status(400).json({ error: 'جميع الحقول المطلوبة غير موجودة' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userCode = uuidv4();
        
        const stmt = db.prepare('INSERT INTO users (code, name, email, password, type) VALUES (?, ?, ?, ?, ?)');
        stmt.run(userCode, name, email, hashedPassword, type);
        
        if (type === 'company') {
            db.prepare('INSERT INTO company_profiles (user_code, company_name, contact_email) VALUES (?, ?, ?)')
                .run(userCode, company_name || name, contact_email || email);
        }
        
        res.json({ success: true, message: 'تم إنشاء الحساب بنجاح' });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'البريد الإلكتروني موجود مسبقاً' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }
    
    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        
        if (!user) {
            return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/jobs', (req, res) => {
    try {
        const rows = db.prepare(`
            SELECT j.*, u.name as company_name 
            FROM jobs j 
            JOIN users u ON j.company_code = u.code 
            ORDER BY j.created_at DESC
        `).all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/jobs', (req, res) => {
    const { company_code, title, description, industry, location } = req.body;
    
    if (!company_code || !title || !description) {
        return res.status(400).json({ error: 'بيانات الوظيفة غير مكتملة' });
    }
    
    try {
        const jobCode = uuidv4();
        db.prepare(`INSERT INTO jobs (code, company_code, title, description, industry, location) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(jobCode, company_code, title, description, industry, location);
        res.json({ success: true, job_code: jobCode });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/jobs/:job_code', (req, res) => {
    const { job_code } = req.params;
    try {
        db.prepare('DELETE FROM jobs WHERE code = ?').run(job_code);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/applications', (req, res) => {
    const { user_code, job_code } = req.body;
    const appCode = uuidv4();
    
    try {
        db.prepare(`INSERT INTO applications (code, user_code, job_code) VALUES (?, ?, ?)`)
            .run(appCode, user_code, job_code);
        res.json({ success: true });
    } catch (err) {
        if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'سبق لك التقديم على هذه الوظيفة' });
        }
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/company-applications/:company_code', (req, res) => {
    const { company_code } = req.params;
    try {
        const rows = db.prepare(`
            SELECT a.*, u.name as user_name, u.email as user_email, j.title as job_title
            FROM applications a
            JOIN jobs j ON a.job_code = j.code
            JOIN users u ON a.user_code = u.code
            WHERE j.company_code = ?
            ORDER BY a.applied_at DESC
        `).all(company_code);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/applications/:app_code', (req, res) => {
    const { app_code } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'حالة غير صالحة' });
    }
    
    try {
        db.prepare('UPDATE applications SET status = ? WHERE code = ?').run(status, app_code);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/company-profile/:user_code', (req, res) => {
    const { user_code } = req.params;
    try {
        const row = db.prepare('SELECT * FROM company_profiles WHERE user_code = ?').get(user_code);
        res.json(row || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/company-profile/:user_code', (req, res) => {
    const { user_code } = req.params;
    const { company_name, industry, location, description, contact_email, phone, website } = req.body;
    
    try {
        db.prepare(`UPDATE company_profiles 
            SET company_name = ?, industry = ?, location = ?, description = ?, 
                contact_email = ?, phone = ?, website = ? 
            WHERE user_code = ?`)
            .run(company_name, industry, location, description, contact_email, phone, website, user_code);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/company-jobs/:company_code', (req, res) => {
    const { company_code } = req.params;
    try {
        const rows = db.prepare('SELECT * FROM jobs WHERE company_code = ? ORDER BY created_at DESC').all(company_code);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user-applications/:user_code', (req, res) => {
    const { user_code } = req.params;
    try {
        const rows = db.prepare(`
            SELECT a.*, j.title as job_title, u.name as company_name
            FROM applications a
            JOIN jobs j ON a.job_code = j.code
            JOIN users u ON j.company_code = u.code
            WHERE a.user_code = ?
            ORDER BY a.applied_at DESC
        `).all(user_code);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/user-skills/:user_code', (req, res) => {
    const { user_code } = req.params;
    try {
        const rows = db.prepare(`
            SELECT s.code, s.name 
            FROM user_skills us
            JOIN skills s ON us.skill_code = s.code
            WHERE us.user_code = ?
            ORDER BY s.name ASC
        `).all(user_code);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/user-skills/:user_code', (req, res) => {
    const { user_code } = req.params;
    const { skills } = req.body;
    
    if (!skills || !Array.isArray(skills)) {
        return res.status(400).json({ error: 'المهارات يجب أن تكون مصفوفة' });
    }
    
    try {
        db.prepare('DELETE FROM user_skills WHERE user_code = ?').run(user_code);
        
        for (const skillName of skills) {
            if (!skillName || !skillName.trim()) continue;
            
            let skill = db.prepare('SELECT code FROM skills WHERE name = ?').get(skillName.trim());
            
            if (skill) {
                db.prepare('INSERT INTO user_skills (user_code, skill_code) VALUES (?, ?)').run(user_code, skill.code);
            } else {
                const skillCode = uuidv4();
                db.prepare('INSERT INTO skills (code, name) VALUES (?, ?)').run(skillCode, skillName.trim());
                db.prepare('INSERT INTO user_skills (user_code, skill_code) VALUES (?, ?)').run(user_code, skillCode);
            }
        }
        
        const newSkills = db.prepare(`
            SELECT s.code, s.name 
            FROM user_skills us
            JOIN skills s ON us.skill_code = s.code
            WHERE us.user_code = ?
            ORDER BY s.name ASC
        `).all(user_code);
        
        res.json({ success: true, skills: newSkills });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// serve static files
app.use(express.static(path.join(__dirname)));

// catch-all route for SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 الخادم يعمل على http://localhost:${port}`);
    console.log(`========================================`);
    console.log(`📝 حسابات تجريبية:`);
    console.log(`   شركة: company@test.com / 123456`);
    console.log(`   باحث: user@test.com / 123456`);
    console.log(`========================================\n`);
});