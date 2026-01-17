import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check, Code, FileText, PenTool } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [notes, setNotes] = useState([]);
    const [selectedNotes, setSelectedNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
            setSelectedNotes([]);
            setTitle('');
            setError('');
        }
    }, [isOpen]);

    const fetchNotes = async () => {
        try {
            const res = await axios.get('/api/notes');
            setNotes(res.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        }
    };

    const toggleNote = (id) => {
        if (selectedNotes.includes(id)) {
            setSelectedNotes(selectedNotes.filter(noteId => noteId !== id));
        } else {
            setSelectedNotes([...selectedNotes, id]);
        }
    };

    const validateSelection = () => {
        const selected = notes.filter(n => selectedNotes.includes(n._id));
        const hasText = selected.some(n => n.type === 'text');
        const hasCode = selected.some(n => n.type === 'code');
        return hasText && hasCode;
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            setError('Please enter a group title');
            return;
        }
        if (!validateSelection()) {
            setError('Group must contain at least 1 Text Note and 1 Code Note');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/groups', {
                title,
                noteIds: selectedNotes
            });
            onGroupCreated();
            onClose();
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.msg || err.response?.data?.message || err.message;
            setError(`Failed to create group: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const isValid = validateSelection();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Create Note Group</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Group Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Project Alpha Resources"
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Notes</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Required: 1 Text, 1 Code</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {notes.map(note => (
                                <div
                                    key={note._id}
                                    onClick={() => toggleNote(note._id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${selectedNotes.includes(note._id)
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}
                                >
                                    <div className={`mt-1 p-1 rounded ${selectedNotes.includes(note._id) ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-transparent'
                                        }`}>
                                        <Check size={12} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {note.type === 'code' && <Code size={14} className="text-blue-500" />}
                                            {note.type === 'text' && <FileText size={14} className="text-purple-500" />}
                                            {note.type === 'drawing' && <PenTool size={14} className="text-orange-500" />}
                                            <span className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{note.title}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {new Date(note.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !isValid}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateGroupModal;
