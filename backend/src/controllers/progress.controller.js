// backend/src/controllers/progress.controller.js
// ความก้าวหน้าของนักเรียน และรายงานผลการเรียนสำหรับครู
const db = require('../config/db');
const { toId, findOwnedCourse, findOwnedModule } = require('../utils/access');
const { PASS_PERCENT, percentOf } = require('../utils/quiz');

// บทเรียนในวิชา + จำนวนข้อสอบปัจจุบัน
const loadCourseModules = async (courseId) => {
    const [modules] = await db.query(
        `SELECT m.id, m.title, COUNT(q.id) AS quiz_count
         FROM modules m LEFT JOIN quizzes q ON q.module_id = m.id
         WHERE m.course_id = ? GROUP BY m.id ORDER BY m.id`,
        [courseId]
    );
    return modules;
};

// สรุปผลสอบหลายครั้งของนักเรียน 1 คนใน 1 บทเรียน (ใช้ครั้งที่คะแนนสูงสุด ถ้าเท่ากันใช้ครั้งล่าสุด)
const summarizeAttempts = (attempts) => {
    if (attempts.length === 0) {
        return { attempt_count: 0, best_percent: null, best_score: null, best_total: null, best_attempt_id: null, passed: false, last_attempt_at: null };
    }
    let best = attempts[0];
    for (const a of attempts) {
        const p = percentOf(a.score, a.total), bp = percentOf(best.score, best.total);
        if (p > bp || (p === bp && a.id > best.id)) best = a;
    }
    return {
        attempt_count: attempts.length,
        best_percent: percentOf(best.score, best.total),
        best_score: best.score,
        best_total: best.total,
        best_attempt_id: best.id,
        passed: attempts.some(a => !!a.passed),
        last_attempt_at: attempts.reduce((latest, a) => (a.created_at > latest ? a.created_at : latest), attempts[0].created_at),
    };
};

// จัดกลุ่มแถวตาม key (เช่น `${user_id}:${module_id}`)
const groupBy = (rows, keyFn) => rows.reduce((map, row) => {
    const key = keyFn(row);
    (map[key] ||= []).push(row);
    return map;
}, {});

/**
 * 1. ความก้าวหน้าของฉันในวิชานี้ (นักเรียน)
 */
exports.getMyCourseProgress = async (req, res) => {
    try {
        const courseId = toId(req.params.courseId);
        const [courses] = courseId ? await db.query("SELECT id FROM courses WHERE id = ?", [courseId]) : [[]];
        if (courses.length === 0) return res.status(404).json({ message: "ไม่พบวิชานี้" });

        const modules = await loadCourseModules(courseId);
        const moduleIds = modules.map(m => m.id);
        const [visits] = moduleIds.length
            ? await db.query("SELECT module_id, last_visited_at FROM module_visits WHERE user_id = ? AND module_id IN (?)", [req.user.id, moduleIds])
            : [[]];
        const [attempts] = moduleIds.length
            ? await db.query("SELECT id, module_id, score, total, passed, created_at FROM quiz_attempts WHERE user_id = ? AND module_id IN (?)", [req.user.id, moduleIds])
            : [[]];

        const visitByModule = Object.fromEntries(visits.map(v => [v.module_id, v.last_visited_at]));
        const attemptsByModule = groupBy(attempts, a => a.module_id);

        const items = modules.map(m => ({
            module_id: m.id,
            title: m.title,
            quiz_count: m.quiz_count,
            visited: m.id in visitByModule,
            last_visited_at: visitByModule[m.id] ?? null,
            ...summarizeAttempts(attemptsByModule[m.id] || []),
        }));

        res.json({
            course_id: courseId,
            pass_percent: PASS_PERCENT,
            total_modules: items.length,
            visited_modules: items.filter(i => i.visited).length,
            passed_modules: items.filter(i => i.passed).length,
            modules: items,
        });
    } catch (error) {
        console.error("🔥 My Progress Error:", error);
        res.status(500).json({ message: "ดึงความก้าวหน้าไม่สำเร็จ" });
    }
};

/**
 * 2. รายงานผลการเรียนทั้งวิชา (ครูเจ้าของวิชา)
 *    นักเรียนที่แสดง = คนที่เคยเข้าเรียนหรือสอบในวิชานี้อย่างน้อย 1 บท
 */
exports.getCourseReport = async (req, res) => {
    try {
        const course = await findOwnedCourse(req, res, req.params.courseId);
        if (!course) return;

        const modules = await loadCourseModules(course.id);
        const moduleIds = modules.map(m => m.id);
        const [visits] = moduleIds.length
            ? await db.query("SELECT user_id, module_id FROM module_visits WHERE module_id IN (?)", [moduleIds])
            : [[]];
        const [attempts] = moduleIds.length
            ? await db.query("SELECT id, user_id, module_id, score, total, passed, created_at FROM quiz_attempts WHERE module_id IN (?)", [moduleIds])
            : [[]];

        const userIds = [...new Set([...visits, ...attempts].map(r => r.user_id))];
        const [users] = userIds.length
            ? await db.query("SELECT id, name, email FROM users WHERE id IN (?) AND role = 'STUDENT' ORDER BY name", [userIds])
            : [[]];

        const visited = new Set(visits.map(v => `${v.user_id}:${v.module_id}`));
        const attemptsByCell = groupBy(attempts, a => `${a.user_id}:${a.module_id}`);

        const students = users.map(u => {
            const results = {};
            for (const m of modules) {
                const key = `${u.id}:${m.id}`;
                results[m.id] = { visited: visited.has(key), ...summarizeAttempts(attemptsByCell[key] || []) };
            }
            const cells = Object.values(results);
            return {
                id: u.id, name: u.name, email: u.email,
                visited_modules: cells.filter(c => c.visited).length,
                passed_modules: cells.filter(c => c.passed).length,
                results,
            };
        });

        // สรุปรายบทเรียน: กี่คนเข้าเรียน / สอบ / ผ่าน และคะแนนเฉลี่ย (จากคะแนนสูงสุดของแต่ละคน)
        const moduleSummaries = modules.map(m => {
            const cells = students.map(s => s.results[m.id]);
            const attempted = cells.filter(c => c.attempt_count > 0);
            return {
                id: m.id,
                title: m.title,
                quiz_count: m.quiz_count,
                visited_count: cells.filter(c => c.visited).length,
                attempted_count: attempted.length,
                passed_count: cells.filter(c => c.passed).length,
                average_best_percent: attempted.length
                    ? Math.round(attempted.reduce((sum, c) => sum + c.best_percent, 0) / attempted.length)
                    : null,
            };
        });

        res.json({
            course_id: course.id,
            course_title: course.title,
            pass_percent: PASS_PERCENT,
            modules: moduleSummaries,
            students,
        });
    } catch (error) {
        console.error("🔥 Course Report Error:", error);
        res.status(500).json({ message: "ดึงรายงานไม่สำเร็จ" });
    }
};

/**
 * 3. สถิติรายข้อของข้อสอบในบทเรียน (ครูเจ้าของวิชา)
 *    นับจากคำตอบของนักเรียนทุกครั้งที่สอบ — ใช้ดูว่าข้อไหนยาก หรือตัวเลือกไหนหลอกได้ผล
 */
exports.getQuizStats = async (req, res) => {
    try {
        const moduleRow = await findOwnedModule(req, res, req.params.moduleId);
        if (!moduleRow) return;

        const [rows] = await db.query(
            `SELECT ans.quiz_id,
                    COUNT(*) AS answered,
                    SUM(ans.is_correct) AS correct,
                    SUM(ans.selected_answer = 'a') AS a,
                    SUM(ans.selected_answer = 'b') AS b,
                    SUM(ans.selected_answer = 'c') AS c,
                    SUM(ans.selected_answer = 'd') AS d,
                    SUM(ans.selected_answer IS NULL) AS blank
             FROM quiz_attempt_answers ans
             JOIN quizzes q ON q.id = ans.quiz_id
             WHERE q.module_id = ?
             GROUP BY ans.quiz_id`,
            [moduleRow.id]
        );
        // SUM() ของ MySQL ได้ค่าเป็น string (DECIMAL) จึงแปลงเป็นตัวเลข
        const stats = {};
        for (const r of rows) {
            const answered = Number(r.answered), correct = Number(r.correct);
            stats[r.quiz_id] = {
                answered,
                correct,
                correct_percent: percentOf(correct, answered),
                choices: { a: Number(r.a), b: Number(r.b), c: Number(r.c), d: Number(r.d), blank: Number(r.blank) },
            };
        }
        res.json(stats);
    } catch (error) {
        console.error("🔥 Quiz Stats Error:", error);
        res.status(500).json({ message: "ดึงสถิติข้อสอบไม่สำเร็จ" });
    }
};
