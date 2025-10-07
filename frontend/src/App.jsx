
import React, {useState, useEffect} from 'react';
import axios from 'axios';
import QRCode from 'qrcode.react';
import classNames from 'classnames';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000' + '/api';

function Login({onLogin}){
  const [email,setEmail] = useState('student@example.com');
  const [password,setPassword] = useState('pass1234');
  async function submit(e){ e.preventDefault(); try{
    const res = await axios.post(API + '/auth/login',{email,password});
    const token = res.data.token;
    localStorage.setItem('token', token);
    onLogin();
  }catch(e){ alert('Login failed: '+ (e.response?.data?.error || e.message)) } }
  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50'>
      <div className='w-full max-w-md p-8 bg-white rounded-2xl shadow-lg'>
        <h2 className='text-2xl font-semibold mb-4 text-center'>تسجيل الدخول - Helwan Smart Campus</h2>
        <form onSubmit={submit} className='space-y-4'>
          <input dir='ltr' className='w-full p-3 border rounded' value={email} onChange={e=>setEmail(e.target.value)} placeholder='البريد الإلكتروني' />
          <input dir='ltr' type='password' className='w-full p-3 border rounded' value={password} onChange={e=>setPassword(e.target.value)} placeholder='كلمة المرور' />
          <button className='w-full py-3 rounded bg-[#0b5fff] text-white font-semibold'>دخول</button>
        </form>
      </div>
    </div>
  );
}

function Dashboard(){ 
  const [courses,setCourses] = useState([]);
  const [qr, setQr] = useState(null);
  useEffect(()=>{ async function load(){ try{
    const token = localStorage.getItem('token');
    const res = await axios.get(API + '/courses', { headers:{ Authorization: 'Bearer '+token } });
    setCourses(res.data);
  }catch(e){ console.error(e) } } load(); },[]);

  async function genQR(courseId){
    try{
      const token = localStorage.getItem('token');
      const res = await axios.post(API + '/attendance/' + courseId + '/generate', {}, { headers:{ Authorization: 'Bearer '+token }});
      setQr(res.data.qrDataUrl);
    }catch(e){ alert('Error generating QR') }
  }

  return (
    <div className='container'>
      <header className='header'>
        <div className='logo'>🎓 جامعة حلوان الأهلية — Helwan Smart Campus</div>
        <div className='flex items-center gap-3'>
          <div className='text-sm text-gray-600'>مرحبا، طالب عرضي</div>
          <button className='py-2 px-3 bg-gray-100 rounded'>تسجيل خروج</button>
        </div>
      </header>

      <main className='grid grid-cols-3 gap-6'>
        <div className='col-span-2 card'>
          <h4 className='text-lg font-semibold mb-3'>المقررات</h4>
          <ul className='space-y-2'>
            {courses.map(c=> (
              <li key={c._id} className='flex items-center justify-between border-b py-2'>
                <div><div className='font-medium'>{c.title}</div><div className='text-xs text-gray-500'>{c.code || ''} — {c.faculty || ''}</div></div>
                <div className='flex gap-2'>
                  <button className='px-3 py-1 rounded bg-[#0b5fff] text-white text-sm' onClick={()=>genQR(c._id)}>توليد QR</button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className='col-span-3'>
          <CourseUpload />
        </div>

        <aside className='card'>
          <h4 className='text-lg font-semibold mb-3'>QR</h4>
          {qr ? <img src={qr} alt='qr' className='w-full rounded' /> : <div className='text-sm text-gray-500'>اضغط "توليد QR" لعرضه هنا</div>}
        </aside>
      </main>
    </div>
  )
}



function AdminPanel(){
  const [stats, setStats] = React.useState(null);
  async function loadStats(){
    try{
      const token = localStorage.getItem('token');
      const res = await axios.get(API + '/admin/full-stats', { headers:{ Authorization: 'Bearer '+token } });
      setStats(res.data);
    }catch(e){ alert('Error loading stats'); }
  }
  return (
    <div className='card mt-4'>
      <h4 className='text-lg font-semibold mb-3'>لوحة إدارة — إحصائيات</h4>
      <div className='space-y-2'>
        <button className='px-3 py-2 bg-green-600 text-white rounded' onClick={loadStats}>تحميل الإحصائيات</button>
        {stats && (
          <div className='mt-3'>
            <div>عدد المستخدمين الكلي: {stats.totalUsers}</div>
            <div>الطلاب: {stats.students} — أعضاء هيئة التدريس: {stats.lecturers}</div>
            <div>عدد المقررات: {stats.courses}</div>
            <div>الشكاوى المفتوحة: {stats.openComplaints}</div>
            <div>عدد سجلات الحضور: {stats.totalAttendanceRecords}</div>
            <div>معدل الحضور (%): {stats.attendanceRate}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App(){
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  return authed ? <Dashboard /> : <Login onLogin={()=>setAuthed(true)} />;
}
