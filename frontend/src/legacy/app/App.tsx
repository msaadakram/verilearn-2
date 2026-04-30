import { BrowserRouter, Routes, Route } from 'react-router';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { About } from './pages/About';
import { Help } from './pages/Help';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherProfile } from './pages/TeacherProfile';
import { Messages } from './pages/Messages';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { CnicUpload } from './pages/CnicUpload';
import { AdminCnicReview } from './pages/AdminCnicReview';
import { TeacherEditProfile } from './pages/TeacherEditProfile';
import { StudentEditProfile } from './pages/StudentEditProfile';
import { StudentQuizTaker } from './pages/StudentQuizTaker';
import { BookSession } from './pages/BookSession';
import { StudentBookings } from './pages/StudentBookings';
import { CnicProvider } from './context/CnicContext';
import { QuizProvider } from './context/QuizContext';
import { MessageProvider } from './context/MessageContext';
import { CallProvider } from './context/CallContext';
import { VideoCallUI, IncomingCallModal } from './components/VideoCall';
import { GuestOnly, RequireAuth, RequireRole } from './components/RouteGuards';

export default function App() {
  return (
    <BrowserRouter>
      <CnicProvider>
        <QuizProvider>
          <MessageProvider>
            <CallProvider>
              {/* Global call overlays — always mounted, shown/hidden by call state */}
              <VideoCallUI />
              <IncomingCallModal />
              <div className="min-h-screen bg-white">
                <Header />
                <Routes>
                  <Route
                    path="/signin"
                    element={(
                      <GuestOnly>
                        <SignIn />
                      </GuestOnly>
                    )}
                  />
                  <Route
                    path="/signup"
                    element={(
                      <GuestOnly>
                        <SignUp />
                      </GuestOnly>
                    )}
                  />
                  <Route
                    path="/forgot-password"
                    element={(
                      <GuestOnly>
                        <ForgotPassword />
                      </GuestOnly>
                    )}
                  />
                  <Route
                    path="/verify-email"
                    element={(
                      <GuestOnly>
                        <VerifyEmail />
                      </GuestOnly>
                    )}
                  />
                  <Route path="/about" element={<About />} />
                  <Route path="/help" element={<Help />} />
                  <Route
                    path="/student-dashboard"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <StudentDashboard />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/student-dashboard/tutors/:teacherId"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <TeacherProfile />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/student-dashboard/book/:teacherId"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <BookSession />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/student-dashboard/bookings"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <StudentBookings />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/student-dashboard/edit-profile"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <StudentEditProfile />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/student-dashboard/quiz/:quizId"
                    element={(
                      <RequireRole allowedRoles={['student']}>
                        <StudentQuizTaker />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/teacher-dashboard"
                    element={(
                      <RequireRole allowedRoles={['teacher']}>
                        <TeacherDashboard />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/teacher-dashboard/verify-cnic"
                    element={(
                      <RequireRole allowedRoles={['teacher']}>
                        <CnicUpload />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/teacher-dashboard/edit-profile"
                    element={(
                      <RequireRole allowedRoles={['teacher']}>
                        <TeacherEditProfile />
                      </RequireRole>
                    )}
                  />
                  <Route
                    path="/admin/cnic-review"
                    element={(
                      <RequireRole allowedRoles={['teacher']}>
                        <AdminCnicReview />
                      </RequireRole>
                    )}
                  />
                  {/* Messages — unified for both teachers and students (Firebase) */}
                  <Route
                    path="/messages"
                    element={(
                      <RequireAuth>
                        <Messages />
                      </RequireAuth>
                    )}
                  />
                  <Route
                    path="/messages/:teacherId"
                    element={(
                      <RequireAuth>
                        <Messages />
                      </RequireAuth>
                    )}
                  />
                  <Route path="/" element={<Home />} />
                </Routes>
              </div>
            </CallProvider>
          </MessageProvider>
        </QuizProvider>
      </CnicProvider>
    </BrowserRouter>
  );
}