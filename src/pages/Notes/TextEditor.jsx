import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const TextEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(!!id);

    useEffect(() => {
        if (id) {
            fetchNote();
        }
    }, [id]);

    const fetchNote = async () => {
        try {
            const res = await axios.get(`/api/notes/${id}`);
            const note = res.data;
            setTitle(note.title);
            setContent(note.content);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching note:', error);
            alert('Failed to load note');
            navigate('/');
        }
    };

    const handleSave = async () => {
        try {
            const noteData = {
                title: title || 'Untitled Text Note',
                type: 'text',
                content: content
            };

            if (id) {
                await axios.put(`/api/notes/${id}`, noteData);
            } else {
                await axios.post('/api/notes', noteData);
            }

            alert('Text Note Saved Successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note.');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-background text-secondary">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
            {/* Header */}
            <div className="bg-background border-b border-secondary/20 px-6 py-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-secondary/10 rounded-lg transition-colors text-foreground"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        placeholder="Untitled Note"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-xl font-bold bg-transparent border-none focus:outline-none placeholder-secondary text-foreground w-64"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 hover:bg-secondary/10 rounded-full transition-colors text-foreground"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors shadow-md hover:shadow-lg"
                    >
                        <Save size={18} />
                        <span>Save Note</span>
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your thoughts here..."
                    className="w-full h-[calc(100vh-200px)] p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-lg text-foreground leading-relaxed font-medium placeholder-secondary transition-colors duration-300"
                />
            </div>
        </div>
    );
};

export default TextEditor;
