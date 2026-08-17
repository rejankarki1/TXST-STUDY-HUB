import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/layouts/AppShell'
import Landing from '@/pages/Landing'
import Signup from '@/pages/Signup'
import Login from '@/pages/Login'
import Onboarding from '@/pages/Onboarding'
import Home from '@/pages/Home'
import Discover from '@/pages/Discover'
import CoursePage from '@/pages/CoursePage'
import MyGroups from '@/pages/MyGroups'
import SessionsPage from '@/pages/SessionsPage'
import SessionDetail from '@/pages/SessionDetail'
import Profile from '@/pages/Profile'
import CreateGroup from '@/pages/CreateGroup'
import CreateSession from '@/pages/CreateSession'
import GroupLayout from '@/pages/group/GroupLayout'
import GroupOverview from '@/pages/group/GroupOverview'
import GroupChat from '@/pages/group/GroupChat'
import GroupSessions from '@/pages/group/GroupSessions'
import GroupMembers from '@/pages/group/GroupMembers'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />

      {/* Application */}
      <Route element={<AppShell />}>
        <Route path="/home" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/my-groups" element={<MyGroups />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:sessionId" element={<SessionDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/courses/:slug" element={<CoursePage />} />
        <Route path="/groups/new" element={<CreateGroup />} />
        <Route path="/groups/:groupId/sessions/new" element={<CreateSession />} />
        <Route path="/groups/:groupId" element={<GroupLayout />}>
          <Route index element={<GroupOverview />} />
          <Route path="chat" element={<GroupChat />} />
          <Route path="sessions" element={<GroupSessions />} />
          <Route path="members" element={<GroupMembers />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
