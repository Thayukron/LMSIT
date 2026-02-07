const multer = require('multer');
const storage = multer.memoryStorage(); // เก็บไฟล์ใน Memory ชั่วคราวเพื่อส่งไป Parse ต่อ
const upload = multer({ storage: storage });

module.exports = upload;