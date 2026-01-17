import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import Dashboard from './pages/Dashboard';
import AddNoteType from './pages/AddNote/AddNoteType';
import TextEditor from './pages/Notes/TextEditor';
import CodeEditor from './pages/Notes/CodeEditor';
import DrawingEditor from './pages/Notes/DrawingEditor';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/Admin/AdminDashboard';
import axios from 'axios';

// Set generic base URL for development and production
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-note" element={<AddNoteType />} />
              <Route path="/notes/text/new" element={<TextEditor />} />
              <Route path="/notes/text/:id" element={<TextEditor />} />
              <Route path="/notes/code/new" element={<CodeEditor />} />
              <Route path="/notes/code/:id" element={<CodeEditor />} />
              <Route path="/notes/drawing/new" element={<DrawingEditor />} />
              <Route path="/notes/drawing/new" element={<DrawingEditor />} />
              <Route path="/notes/drawing/:id" element={<DrawingEditor />} />

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
