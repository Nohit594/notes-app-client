import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Trash2, Shield, ShieldOff, Search, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userNotes, setUserNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/api/admin/users');
            if (Array.isArray(res.data)) {
                setUsers(res.data);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const toggleSuspension = async (userId) => {
        try {
            const res = await axios.put(`/api/admin/users/${userId}/suspend`);
            setUsers(users.map(user =>
                user._id === userId ? { ...user, isSuspended: res.data.isSuspended } : user
            ));
        } catch (error) {
            console.error('Error suspending user:', error);
            alert('Failed to update suspension status');
        }
    };

    const deleteUser = async (userId, username) => {
        if (!confirm(`Are you sure you want to PERMANENTLY delete user "${username}"?\n\nThis will remove:\n- The User Account\n- All their Notes (${userNotes.length || 'lots of'} potentially)\n\nThis action CANNOT be undone.`)) {
            return;
        }

        try {
            await axios.delete(`/api/admin/users/${userId}`);
            setUsers(users.filter(user => user._id !== userId));
            alert(`User ${username} deleted successfully.`);
        } catch (error) {
            console.error('Error deleting user:', error);
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const viewNotes = async (user) => {
        setSelectedUser(user);
        setLoadingNotes(true);
        try {
            const res = await axios.get(`/api/admin/users/${user._id}/notes`);
            setUserNotes(res.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
            alert('Failed to fetch notes');
        } finally {
            setLoadingNotes(false);
        }
    };

    const deleteNote = async (noteId) => {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;

        try {
            await axios.delete(`/api/admin/notes/${noteId}`);
            setUserNotes(userNotes.filter(note => note._id !== noteId));
            alert('Note deleted permanently');
        } catch (error) {
            console.error('Error deleting note:', error);
            alert('Failed to delete note');
        }
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8 transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                        Admin Dashboard 🛡️
                    </h1>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-semibold">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredUsers.map(user => (
                                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{user.username} {user.isAdmin && '👑'}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isSuspended
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {user.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => viewNotes(user)}
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm transition-colors whitespace-nowrap"
                                                >
                                                    View Notes
                                                </button>
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => toggleSuspension(user._id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${user.isSuspended
                                                            ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
                                                            : 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-200'
                                                            }`}
                                                    >
                                                        {user.isSuspended ? 'Activate' : 'Suspend'}
                                                    </button>
                                                )}
                                                {!user.isAdmin && (
                                                    <button
                                                        onClick={() => deleteUser(user._id, user.username)}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors flex items-center gap-1 whitespace-nowrap"
                                                        title="Permanently Delete User"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Notes Modal */}
            <AnimatePresence>
                {selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FileText size={20} className="text-blue-500" />
                                    Notes by {selectedUser.username}
                                </h3>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {loadingNotes ? (
                                    <div className="text-center py-8 text-gray-500">Loading notes...</div>
                                ) : userNotes.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">No notes found for this user.</div>
                                ) : (
                                    userNotes.map(note => (
                                        <div
                                            key={note._id}
                                            onClick={() => navigate(`/notes/${note.type}/${note._id}`)}
                                            className="group flex justify-between items-start p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex-1 pr-4">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {note.type === 'drawing' && <span title="Drawing">🎨</span>}
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{note.title}</h4>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 space-x-2">
                                                    <span className={`uppercase px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${note.type === 'drawing' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                        note.type === 'code' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                        }`}>
                                                        {note.type}
                                                    </span>
                                                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                                    {note.type === 'drawing'
                                                        ? '🎨 Drawing Content'
                                                        : (typeof note.content === 'string' ? note.content.substring(0, 100) : 'Content...')}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNote(note._id);
                                                }}
                                                className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Note"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
