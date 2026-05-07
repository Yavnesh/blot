import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart3, Target, ShieldCheck, MessageSquare, Lightbulb } from 'lucide-react';
import { useOrchestratorStore } from '../store/orchestratorStore';


const BionicEditor = () => {
    const { contentState, updateContent } = useOrchestratorStore();

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'The AI will begin writing here...',
            }),
        ],
        content: contentState.draft,
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] px-8 py-12',
            },
        },
        onUpdate: ({ editor }) => {
            updateContent(editor.getHTML());
        },
    });

    // Update editor content when store updates from AI
    useEffect(() => {
        if (editor && contentState.draft && contentState.draft !== editor.getHTML()) {
            editor.commands.setContent(contentState.draft);
        }
    }, [contentState.draft, editor]);

    return (
        <div className="relative w-full">
            {/* Metrics Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3"
                >
                    <BarChart3 size={14} className="text-teal-400" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">SEO Score</span>
                        <span className="text-xs font-black text-white">{contentState.seo_data.score}%</span>
                    </div>
                </motion.div>
                
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-900 border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3"
                >
                    <Target size={14} className="text-amber-500" />
                    <div className="flex flex-col">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Readability</span>
                        <span className="text-xs font-black text-white">Advanced</span>
                    </div>
                </motion.div>
            </div>

            <div className="glass-panel overflow-hidden border border-white/5 bg-slate-900/20 backdrop-blur-md">
                <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 w-full animate-shine" />
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}

export default BionicEditor;
