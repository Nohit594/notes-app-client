import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Code, PenTool, Trash2, Moon, Sun, Layers, FolderPlus, ChevronRight, Share2 } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [notes, setNotes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

    useEffect(() => {
        fetchNotes();
        fetchGroups();
        // Check initial mode
        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        }
    }, []);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.documentElement.classList.toggle('dark');
    };

    const fetchNotes = async () => {
        try {
            const res = await axios.get('/api/notes');
            setNotes(res.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await axios.get('/api/groups');
            setGroups(res.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const deleteNote = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await axios.delete(`/api/notes/${id}`);
                setNotes(notes.filter(note => note._id !== id));
            } catch (error) {
                console.error('Error deleting note:', error);
            }
        }
    };

    const deleteGroup = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this group? (Notes will remain)')) {
            try {
                await axios.delete(`/api/groups/${id}`);
                setGroups(groups.filter(g => g._id !== id));
            } catch (error) {
                console.error('Error deleting group:', error);
            }
        }
    };

    const toggleGroupShare = async (id, e) => {
        e.stopPropagation();
        try {
            const res = await axios.put(`/api/groups/${id}/share`);
            const { shareCode } = res.data;

            // Just update local state
            setGroups(groups.map(g => g._id === id ? { ...g, shareCode: shareCode, isPublic: true } : g));

            // Copy and Alert
            navigator.clipboard.writeText(shareCode);
            alert(`GROUP SHARE CODE: ${shareCode} 🎟️\n\nCode copied to clipboard!\nShare this code with others to let them import this group.`);
        } catch (error) {
            console.error('Error generating share code:', error);
            alert('Failed to generate share code');
        }
    };

    const importGroup = async () => {
        const code = prompt("Enter the 6-character Share Code to import a group:");
        if (!code) return;

        try {
            const res = await axios.post('/api/groups/import', { shareCode: code.toUpperCase() });
            const newGroup = res.data;
            setGroups([newGroup, ...groups]); // Prepend new group
            fetchNotes(); // Refresh notes as well since we duplicated them
            alert(`Successfully imported "${newGroup.title}"! 🎉`);
        } catch (error) {
            console.error('Import failed:', error);
            alert(error.response?.data?.msg || 'Failed to import group. Check the code and try again.');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'code': return <Code className="text-blue-500" />;
            case 'drawing': return <PenTool className="text-orange-500" />;
            default: return <FileText className="text-purple-500" />;
        }
    };

    const handleNoteClick = (note) => {
        navigate(`/notes/${note.type}/${note._id}`);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-red-500 dark:to-orange-500">
                        Welcome, {user?.username}! 🎓
                    </h1>
                    <div className="flex items-center gap-4">
                        {user?.isAdmin && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium border border-red-200 dark:border-red-900/50"
                            >
                                🛡️ Admin
                            </button>
                        )}
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-medium flex items-center gap-2"
                        >
                            <FolderPlus size={18} />
                            <span>New Group</span>
                        </button>
                        <button
                            onClick={importGroup}
                            className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 px-4 py-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors font-medium flex items-center gap-2"
                        >
                            <Share2 size={18} />
                            <span>Import Group</span>
                        </button>
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-foreground"
                            title="Toggle Theme"
                        >
                            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                        </button>
                        <button
                            onClick={logout}
                            className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div
                        onClick={() => navigate('/notes/code/new')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 cursor-pointer group"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <Code className="text-blue-600 dark:text-blue-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold">New Code Note</h3>
                        </div>
                    </div>
                    <div
                        onClick={() => navigate('/notes/text/new')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 cursor-pointer group"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                                <FileText className="text-purple-600 dark:text-purple-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold">New Text Note</h3>
                        </div>
                    </div>
                    <div
                        onClick={() => navigate('/notes/drawing/new')}
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 cursor-pointer group"
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
                                <PenTool className="text-orange-600 dark:text-orange-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold">New Drawing</h3>
                        </div>
                    </div>
                </div>

                {/* Groups Section */}
                {groups.length > 0 && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold mb-6 text-foreground flex items-center gap-2">
                            <Layers size={24} className="text-indigo-500" />
                            Note Groups
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groups.map(group => (
                                <div key={group._id} className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative group-card">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                                            {group.title}
                                            {group.shareCode && <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono tracking-wider">{group.shareCode}</span>}
                                        </h3>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => toggleGroupShare(group._id, e)}
                                                className={`p-1.5 rounded-lg transition-colors ${group.shareCode ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                                                title={group.shareCode ? "View Code" : "Generate Share Code"}
                                            >
                                                <Share2 size={16} />
                                            </button>
                                            <button onClick={(e) => deleteGroup(group._id, e)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        {group.notes.map(note => (
                                            <div key={note._id} onClick={() => handleNoteClick(note)} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors">
                                                {getIcon(note.type)}
                                                <span className="text-sm truncate text-foreground flex-1">{note.title}</span>
                                                <ChevronRight size={14} className="text-gray-400" />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-400 flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <span>{group.notes.length} items</span>
                                        <span>{new Date(group.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes Grid */}
                <h2 className="text-xl font-bold mb-6 text-foreground">Your Notes</h2>

                {notes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-lg">No notes yet. Create one to get started! 🚀</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map(note => (
                            <div
                                key={note._id}
                                onClick={() => handleNoteClick(note)}
                                className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 relative group cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        {getIcon(note.type)}
                                        <h3 className="font-semibold text-lg truncate max-w-[200px] text-foreground">{note.title}</h3>
                                    </div>
                                    <span className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full uppercase font-medium tracking-wider">
                                        {note.type}
                                    </span>
                                </div>

                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3 h-14">
                                    {note.type === 'image' ? 'Visual content' : (typeof note.content === 'string' ? note.content.substring(0, 100) : 'Content...')}
                                </p>

                                <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-700">
                                    <span className="text-xs text-gray-400">
                                        {new Date(note.updatedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                        onClick={(e) => deleteNote(note._id, e)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Note"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <CreateGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onGroupCreated={() => {
                    fetchGroups();
                }}
            />
        </div>
    );
};

export default Dashboard;
