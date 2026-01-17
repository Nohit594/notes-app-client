import { useNavigate } from 'react-router-dom';
import { Code, Type, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

const AddNoteType = () => {
    const navigate = useNavigate();

    const options = [
        {
            title: 'Text Note',
            description: 'Capture ideas with rich text formatting',
            icon: <Type size={32} />,
            color: 'bg-purple-100 text-purple-600',
            hover: 'hover:bg-purple-50 hover:border-purple-200',
            path: '/notes/text/new'
        },
        {
            title: 'Code Note',
            description: 'Write and execute code in 50+ languages',
            icon: <Code size={32} />,
            color: 'bg-blue-100 text-blue-600',
            hover: 'hover:bg-blue-50 hover:border-blue-200',
            path: '/notes/code/new'
        },
        {
            title: 'Drawing Note',
            description: 'Sketch diagrams and visualize ideas',
            icon: <PenTool size={32} />,
            color: 'bg-orange-100 text-orange-600',
            hover: 'hover:bg-orange-50 hover:border-orange-200',
            path: '/notes/drawing/new'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create a New Note 📝</h1>
                <p className="text-center text-gray-500 mb-12">Choose the type of note you want to create</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map((option, index) => (
                        <motion.div
                            key={option.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => navigate(option.path)}
                            className={`bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent cursor-pointer transition-all ${option.hover}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${option.color} flex items-center justify-center mb-6`}>
                                {option.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{option.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{option.description}</p>
                        </motion.div>
                    ))}
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="mt-12 mx-auto block text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Cancel and go back
                </button>
            </div>
        </div>
    );
};

export default AddNoteType;
