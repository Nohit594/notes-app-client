import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, ArrowLeft, Save, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const CodeEditor = () => {
    const { id } = useParams();
    const snippets = {
        javascript: '// Write your code here\nconsole.log("Hello, World!");',
        python: '# Write your code here\nprint("Hello, World!")',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}'
    };

    const navigate = useNavigate();
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(snippets['javascript']);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
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
            setCode(note.content);
            setLanguage(note.language || 'javascript');
            setLoading(false);
        } catch (error) {
            console.error('Error fetching note:', error);
            alert('Failed to load note');
            navigate('/');
        }
    };

    const languages = [
        { id: 'javascript', name: 'JavaScript (Node.js)', monaco: 'javascript' },
        { id: 'python', name: 'Python 3', monaco: 'python' },
        { id: 'java', name: 'Java', monaco: 'java' },
        { id: 'cpp', name: 'C++', monaco: 'cpp' },
    ];

    const handleRun = async () => {
        setIsRunning(true);
        setOutput('Running...');

        try {
            const res = await axios.post('/api/compiler/execute', {
                language: language,
                code: code
            });

            if (res.data.stderr) {
                setOutput(res.data.stdout + '\nError:\n' + res.data.stderr);
            } else {
                setOutput(res.data.stdout || 'No output');
            }

            if (res.data.exception) {
                setOutput((prev) => prev + '\nException:\n' + res.data.exception);
            }

        } catch (error) {
            setOutput('Error: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsRunning(false);
        }
    };

    const handleSave = async () => {
        try {
            const noteData = {
                title: title || 'Untitled Code Note',
                type: 'code',
                content: code,
                language: language
            };

            if (id) {
                await axios.put(`/api/notes/${id}`, noteData);
            } else {
                await axios.post('/api/notes', noteData);
            }

            alert('Code Note Saved Successfully!');
            navigate('/');
        } catch (error) {
            console.error('Error saving note:', error);
            alert('Failed to save note.');
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Untitled Code Note"
                        className="bg-transparent border-none focus:outline-none font-semibold text-lg placeholder-gray-500"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={language}
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setLanguage(newLang);
                            if (!id) { // Only reset code if creating new note
                                setCode(snippets[newLang] || '');
                            }
                        }}
                        className="bg-gray-700 text-white border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        {languages.map(lang => (
                            <option key={lang.id} value={lang.id}>{lang.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                            isRunning
                                ? "bg-gray-600 cursor-not-allowed opacity-50"
                                : "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/30"
                        )}
                    >
                        {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        <span>Run</span>
                    </button>

                    <button
                        onClick={handleSave}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-lg hover:shadow-blue-500/30"
                    >
                        <Save size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor */}
                <div className="flex-1 border-r border-gray-700">
                    <Editor
                        height="100%"
                        theme="vs-dark"
                        language={languages.find(l => l.id === language)?.monaco || 'javascript'}
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Output Panel */}
                <div className="w-1/3 bg-gray-900 flex flex-col">
                    <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 text-sm font-medium text-gray-400">
                        Console Output
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm overflow-auto whitespace-pre-wrap text-gray-300">
                        {output || <span className="text-gray-600 italic">Run your code to see output here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
