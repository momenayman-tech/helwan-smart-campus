
/**
 * Helwan Smart Campus — Backend (Prototype)
 * Minimal Express server with auth, courses, attendance QR endpoints.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/helwan_smart_campus';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Simple file uploads
const uploadPath = process.env.FILE_STORAGE_PATH || './uploads';
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Mongo models (very small schemas for prototype)
mongoose.connect(MONGO_URI).then(()=>console.log('Mongo connected')).catch(e=>console.error(e));

const userSchema = new mongoose.Schema({
  name:String, email:String, role:{type:String, enum:['student','lecturer','admin'], default:'student'},
  faculty:String, department:String, studentId:String, passwordHash:String, profilePicUrl:String
});
const courseSchema = new mongoose.Schema({
  code:String, title:String, faculty:String, department:String, lecturerId:String,
  materials:[{fileUrl:String, title:String, uploadedAt:Date}]
});
const attendanceSchema = new mongoose.Schema({
  courseId:mongoose.Types.ObjectId, lectureId:String, date:Date,
  records:[{userId:mongoose.Types.ObjectId, status:String, timestamp:Date}]
});
const complaintSchema = new mongoose.Schema({
  userId:mongoose.Types.ObjectId, title:String, description:String, type:String, attachments:[String], status:String, createdAt:Date, updatedAt:Date
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);

// Auth helpers
function generateToken(user){
  return jwt.sign({id:user._id, role:user.role, name:user.name}, JWT_SECRET, {expiresIn:'8h'});
}
async function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if(!auth){ return res.status(401).json({error:'No token'}); }
  const token = auth.split(' ')[1];
  try{
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  }catch(e){ return res.status(401).json({error:'Invalid token'}); }
}

// Routes
app.post('/api/auth/register', async (req,res)=>{
  const {name,email,password,role,studentId,faculty,department} = req.body;
  if(!email || !password) return res.status(400).json({error:'Missing fields'});
  const hash = await bcrypt.hash(password, 10);
  const user = new User({name,email,role,studentId,faculty,department,passwordHash:hash});
  await user.save();
  res.json({ok:true, user:{id:user._id, name:user.name, role:user.role}});
});

app.post('/api/auth/login', async (req,res)=>{
  const {email,password} = req.body;
  const user = await User.findOne({email});
  if(!user) return res.status(400).json({error:'User not found'});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(400).json({error:'Bad credentials'});
  const token = generateToken(user);
  res.json({token, user:{id:user._id, name:user.name, role:user.role}});
});

// Courses
app.get('/api/courses', authMiddleware, async (req,res)=>{
  const courses = await Course.find({});
  res.json(courses);
});
app.post('/api/courses', authMiddleware, upload.single('file'), async (req,res)=>{
  // simple create course (lecturer/admin)
  const {code,title,faculty,department,lecturerId} = req.body;
  const course = new Course({code,title,faculty,department,lecturerId,materials:[]});
  if(req.file){
    course.materials.push({fileUrl:req.file.path, title:req.file.originalname, uploadedAt:new Date()});
  }
  await course.save();
  res.json(course);
});

// Attendance QR generation & scan
app.post('/api/attendance/:courseId/generate', authMiddleware, async (req,res)=>{
  // Generates a QR payload (lectureId) for a lecture — in production, make it signed/expiring
  const {courseId} = req.params;
  const lectureId = 'lec-' + Date.now();
  const payload = JSON.stringify({courseId, lectureId, ts: Date.now()});
  const qrDataUrl = await QRCode.toDataURL(payload);
  // Create empty attendance doc
  await Attendance.create({courseId, lectureId, date:new Date(), records:[]});
  res.json({lectureId, qrDataUrl, payload});
});

app.post('/api/attendance/scan', authMiddleware, async (req,res)=>{
  // Accepts scanned payload from client and registers attendance for the user
  const {payload} = req.body;
  if(!payload) return res.status(400).json({error:'Missing payload'});
  let data;
  try{ data = JSON.parse(payload); } catch(e){ return res.status(400).json({error:'Invalid payload'}); }
  const {courseId, lectureId} = data;
  const att = await Attendance.findOne({courseId, lectureId});
  if(!att) return res.status(404).json({error:'Lecture not found'});
  att.records.push({userId:req.user.id, status:'present', timestamp:new Date()});
  await att.save();
  res.json({ok:true});
});

// Complaints
app.post('/api/complaints', authMiddleware, upload.array('attachments', 5), async (req,res)=>{
  const {title,description,type} = req.body;
  const attachments = (req.files || []).map(f=>f.path);
  const c = new Complaint({userId:req.user.id, title, description, type, attachments, status:'open', createdAt:new Date(), updatedAt:new Date()});
  await c.save();
  res.json(c);
});

// Admin stats

app.get('/api/admin/stats', authMiddleware, async (req,res)=>{
  // enhanced stats
  const students = await User.countDocuments({role:'student'});
  const lecturers = await User.countDocuments({role:'lecturer'});
  const admins = await User.countDocuments({role:'admin'});
  const courses = await Course.countDocuments();
  const complaintsOpen = await Complaint.countDocuments({status:'open'});
  const complaintsTotal = await Complaint.countDocuments();
  const attendanceCount = await Attendance.countDocuments();
  // basic attendance records total
  let attendanceRecords = 0;
  const atts = await Attendance.find({});
  atts.forEach(a=> attendanceRecords += (a.records || []).length);
  res.json({
    students, lecturers, admins, courses,
    complaintsOpen, complaintsTotal, attendanceCount, attendanceRecords
  });
});




// Add materials to course (lecturer/admin)
app.post('/api/courses/:id/materials', authMiddleware, upload.array('files', 5), async (req,res)=>{
  const cid = req.params.id;
  const course = await Course.findById(cid);
  if(!course) return res.status(404).json({error:'Course not found'});
  // simple role check: only lecturer or admin can upload
  if(req.user.role !== 'lecturer' && req.user.role !== 'admin') return res.status(403).json({error:'Forbidden'});
  const files = (req.files || []).map(f=> ({ fileUrl: f.path, title: f.originalname, uploadedAt: new Date()}));
  course.materials = course.materials.concat(files);
  await course.save();
  res.json(course);
});

app.listen(PORT, ()=>console.log('Server running on',PORT));



// Enhanced admin full-stats endpoint (counts + attendance rate sample)
app.get('/api/admin/full-stats', authMiddleware, async (req,res)=>{
  try{
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({role:'student'});
    const lecturers = await User.countDocuments({role:'lecturer'});
    const courses = await Course.countDocuments();
    const openComplaints = await Complaint.countDocuments({status:'open'});
    // attendance summary (very naive: total records, present records)
    const allAtt = await Attendance.find({});
    let totalRecords = 0, presentRecords = 0;
    allAtt.forEach(a => {
      totalRecords += (a.records || []).length;
      presentRecords += (a.records || []).filter(r => r.status === 'present').length;
    });
    const attendanceRate = totalRecords ? Math.round((presentRecords/totalRecords)*100) : 0;
    res.json({ totalUsers, students, lecturers, courses, openComplaints, totalAttendanceRecords: totalRecords, attendanceRate });
  }catch(e){ console.error(e); res.status(500).json({error:'Server error'}); }
});
