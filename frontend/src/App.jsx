import { Navigate, Route, Routes } from 'react-router-dom';
import LegacyFrame from './components/LegacyFrame';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LegacyFrame title="Home" src="/legacy/index.html" />} />
      <Route path="/about-library" element={<LegacyFrame title="About Library" src="/legacy/about-library.html" />} />
      <Route path="/digital-library" element={<LegacyFrame title="Digital Library" src="/legacy/digital-library.html" />} />
      <Route path="/login" element={<LegacyFrame title="Login" src="/legacy/login.html" />} />

      <Route path="/student/dashboard" element={<LegacyFrame title="Student Dashboard" src="/legacy/student/student-dashboard.html" />} />
      <Route path="/student/suggestions" element={<LegacyFrame title="Student Suggestions" src="/legacy/student/book-suggestions.html" />} />

      <Route path="/faculty/dashboard" element={<LegacyFrame title="Faculty Dashboard" src="/legacy/faculty/faculty-dashboard.html" />} />
      <Route path="/faculty/history" element={<LegacyFrame title="Faculty History" src="/legacy/faculty/borrowing-history.html" />} />
      <Route path="/faculty/resources" element={<LegacyFrame title="Faculty Resource Hub" src="/legacy/faculty/resource-hub.html" />} />
      <Route path="/faculty/suggestions" element={<LegacyFrame title="Faculty Suggestions" src="/legacy/faculty/book-suggestions.html" />} />

      <Route path="/librarian/dashboard" element={<LegacyFrame title="Librarian Dashboard" src="/legacy/librarian/librarian-dashboard.html" />} />
      <Route path="/librarian/add-books" element={<LegacyFrame title="Add Books" src="/legacy/librarian/add-books.html" />} />
      <Route path="/librarian/manage-books" element={<LegacyFrame title="Manage Books" src="/legacy/librarian/manage-books.html" />} />
      <Route path="/librarian/manage-users" element={<LegacyFrame title="Manage Users" src="/legacy/librarian/manage-users.html" />} />
      <Route path="/librarian/issue-book" element={<LegacyFrame title="Issue Book" src="/legacy/librarian/issue-book.html" />} />
      <Route path="/librarian/renewal-requests" element={<LegacyFrame title="Renewal Requests" src="/legacy/librarian/renewal-requests.html" />} />
      <Route path="/librarian/receipts-history" element={<LegacyFrame title="Receipts History" src="/legacy/librarian/receipts-history.html" />} />
      <Route path="/librarian/suggestions" element={<LegacyFrame title="Suggestions" src="/legacy/librarian/suggestions.html" />} />

      <Route path="/admin/dashboard" element={<LegacyFrame title="Admin Dashboard" src="/legacy/admin/admin-dashboard.html" />} />
      <Route path="/admin/add-books" element={<LegacyFrame title="Add Books" src="/legacy/admin/add-books.html" />} />
      <Route path="/admin/manage-books" element={<LegacyFrame title="Manage Books" src="/legacy/admin/manage-books.html" />} />
      <Route path="/admin/manage-users" element={<LegacyFrame title="Manage Users" src="/legacy/admin/manage-users.html" />} />
      <Route path="/admin/issue-book" element={<LegacyFrame title="Issue Book" src="/legacy/admin/issue-book.html" />} />
      <Route path="/admin/reports" element={<LegacyFrame title="Reports" src="/legacy/admin/reports.html" />} />
      <Route path="/admin/renewal-requests" element={<LegacyFrame title="Renewal Requests" src="/legacy/admin/renewal-requests.html" />} />
      <Route path="/admin/receipts-history" element={<LegacyFrame title="Receipts History" src="/legacy/admin/receipts-history.html" />} />
      <Route path="/admin/suggestions" element={<LegacyFrame title="Suggestions" src="/legacy/admin/suggestions.html" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;