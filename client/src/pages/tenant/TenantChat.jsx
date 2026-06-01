import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Send, Sparkles, Bot, User, Loader, MessageSquare, 
    House, Home, Search, DollarSign, MapPin, Calendar, RefreshCw,
    Copy, ThumbsUp, ThumbsDown, X, ChevronDown
} from 'lucide-react';
import aiService from '../../services/aiService';
import { toast } from 'react-hot-toast';

/**
 * Quick Action Buttons
 */
const quickActions = [
    { icon: Search, label: 'Tìm phòng quận 1', prompt: 'Tìm cho tôi các phòng trọ ở quận 1, giá dưới 5 triệu' },
    { icon: DollarSign, label: 'So sánh giá', prompt: 'So sánh giá thuê phòng trọ ở quận Gò Vấp và quận Bình Thạnh' },
    { icon: MapPin, label: 'Tư vấn khu vực', prompt: 'Khu vực nào phù hợp cho sinh viên đi học ở ĐH Bách Khoa?' },
    { icon: Home, label: 'Mẹo thuê nhà', prompt: 'Cho tôi 5 mẹo quan trọng khi thuê phòng trọ' },
    { icon: Calendar, label: 'Hợp đồng thuê', prompt: 'Những điều cần lưu ý trong hợp đồng thuê nhà?' },
];

/**
 * Helper to render Markdown inline elements (Bold, Links)
 */
const parseInlineMarkdown = (text) => {
    if (!text) return '';

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;

    const tempParts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        const precedingText = text.substring(lastIndex, match.index);
        if (precedingText) {
            tempParts.push({ type: 'text', value: precedingText });
        }
        tempParts.push({ type: 'link', label: match[1], url: match[2] });
        lastIndex = linkRegex.lastIndex;
    }

    const remainingText = text.substring(lastIndex);
    if (remainingText) {
        tempParts.push({ type: 'text', value: remainingText });
    }

    if (tempParts.length === 0) {
        tempParts.push({ type: 'text', value: text });
    }

    return tempParts.map((part, idx) => {
        if (part.type === 'link') {
            const isLocal = part.url.startsWith('/') || part.url.startsWith(window.location.origin);
            const path = part.url.startsWith('/') ? part.url : part.url.replace(window.location.origin, '');
            if (isLocal) {
                return (
                    <Link
                        key={idx}
                        to={path}
                        className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold border border-indigo-100 text-xs transition-colors my-0.5"
                    >
                        {part.label}
                    </Link>
                );
            }
            return (
                <a
                    key={idx}
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold border border-indigo-100 text-xs transition-colors my-0.5"
                >
                    {part.label}
                </a>
            );
        }

        const subParts = [];
        let subLastIdx = 0;
        let subMatch;
        const subText = part.value;

        boldRegex.lastIndex = 0;
        while ((subMatch = boldRegex.exec(subText)) !== null) {
            const normal = subText.substring(subLastIdx, subMatch.index);
            if (normal) {
                subParts.push(<span key={`n-${subMatch.index}`}>{normal}</span>);
            }
            subParts.push(<strong key={`b-${subMatch.index}`} className="font-black text-gray-900">{subMatch[1]}</strong>);
            subLastIdx = boldRegex.lastIndex;
        }

        const subRemaining = subText.substring(subLastIdx);
        if (subRemaining) {
            subParts.push(<span key="end">{subRemaining}</span>);
        }

        return <span key={idx}>{subParts}</span>;
    });
};

/**
 * Custom Simple Markdown Renderer
 */
const renderMarkdown = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Handle Table
        if (line.startsWith('|')) {
            const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
            if (line.includes('---') || line.includes(':---')) {
                continue;
            }
            if (!currentTable) {
                currentTable = { headers: cells, rows: [] };
            } else {
                currentTable.rows.push(cells);
            }
            continue;
        } else {
            if (currentTable) {
                elements.push(
                    <div key={`table-${i}`} className="overflow-x-auto my-3 border border-gray-200 rounded-2xl shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                                <tr>
                                    {currentTable.headers.map((h, hIdx) => (
                                        <th key={hIdx} className="px-4 py-3 font-black">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                                {currentTable.rows.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                                        {row.map((cell, cIdx) => (
                                            <td key={cIdx} className="px-4 py-3 font-semibold">{parseInlineMarkdown(cell)}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
                currentTable = null;
            }
        }

        // Headings
        if (line.startsWith('#')) {
            const level = line.match(/^#+/)[0].length;
            const content = line.replace(/^#+\s*/, '');
            const HeadingTag = `h${Math.min(level + 2, 6)}`;
            elements.push(
                <HeadingTag key={i} className="font-black text-gray-900 my-2 tracking-tight">
                    {parseInlineMarkdown(content)}
                </HeadingTag>
            );
            continue;
        }

        // Lists
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const content = line.replace(/^[•\-*]\s*/, '');
            elements.push(
                <div key={i} className="flex items-start gap-2 ml-3 my-1 text-sm text-gray-700 leading-relaxed font-semibold">
                    <span className="text-indigo-500 mt-1 flex-shrink-0">•</span>
                    <span>{parseInlineMarkdown(content)}</span>
                </div>
            );
            continue;
        }

        // Numbered list
        if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+/)[0];
            const content = line.replace(/^\d+\.\s*/, '');
            elements.push(
                <div key={i} className="flex items-start gap-2 ml-3 my-1 text-sm text-gray-700 leading-relaxed font-semibold">
                    <span className="text-indigo-500 font-black">{num}.</span>
                    <span>{parseInlineMarkdown(content)}</span>
                </div>
            );
            continue;
        }

        // Empty lines
        if (line === '') {
            elements.push(<div key={i} className="h-1" />);
            continue;
        }

        // Paragraph
        elements.push(
            <p key={i} className="text-sm leading-relaxed text-gray-700 font-semibold my-1">
                {parseInlineMarkdown(line)}
            </p>
        );
    }

    if (currentTable) {
        elements.push(
            <div key="table-end" className="overflow-x-auto my-3 border border-gray-200 rounded-2xl shadow-sm bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider">
                        <tr>
                            {currentTable.headers.map((h, hIdx) => (
                                <th key={hIdx} className="px-4 py-3 font-black">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                        {currentTable.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50/50 transition-colors">
                                {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-3 font-semibold">{parseInlineMarkdown(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return <div className="space-y-0.5">{elements}</div>;
};

/**
 * Message Component
 */
const ChatMessage = ({ message, onRegenerate }) => {
    const isUser = message.role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        toast.success('Đã sao chép!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center ${
                isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            }`}>
                {isUser ? <User size={18} /> : <Bot size={18} />}
            </div>

            {/* Message Content */}
            <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`px-5 py-4 rounded-2xl ${
                    isUser 
                        ? 'bg-indigo-600 text-white rounded-tr-md' 
                        : 'bg-gray-100 text-gray-800 rounded-tl-md'
                }`}>
                    {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    ) : (
                        renderMarkdown(message.content)
                    )}
                </div>

                {/* Actions */}
                {!isUser && (
                    <div className="flex items-center gap-1 px-1">
                        <button 
                            onClick={() => onRegenerate(message)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Tạo lại"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <button 
                            onClick={handleCopy}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Sao chép"
                        >
                            {copied ? <ThumbsUp size={14} /> : <Copy size={14} />}
                        </button>
                        <button 
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Hữu ích"
                        >
                            <ThumbsUp size={14} />
                        </button>
                        <button 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Không hữu ích"
                        >
                            <ThumbsDown size={14} />
                        </button>
                    </div>
                )}

                <span className="text-[10px] text-gray-400 px-1">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
            </div>
        </div>
    );
};

/**
 * Suggested Prompts Component
 */
const SuggestedPrompts = ({ onSelect }) => (
    <div className="flex flex-col items-center gap-3 animate-fade-in-up">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            <Sparkles size={12} />
            <span>Gợi ý nhanh</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {quickActions.map((action, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(action.prompt)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <action.icon size={14} />
                    {action.label}
                </button>
            ))}
        </div>
    </div>
);

/**
 * Main Chat Component
 */
const TenantChat = () => {
    const { user } = useSelector((state) => state.auth);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                content: `Xin chào ${user?.full_name || 'bạn'}! 👋\n\nTôi là trợ lý AI của PropTech. Tôi có thể giúp bạn:\n\n• Tìm kiếm phòng trọ phù hợp\n• So sánh giá và khu vực\n• Tư vấn về hợp đồng thuê nhà\n• Giải đáp thắc mắc về quy trình thuê\n\nBạn cần tôi hỗ trợ gì hôm nay?`,
                timestamp: new Date().toISOString()
            }]);
        }
    }, []);

    const handleSend = async (text = input) => {
        if (!text.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: text.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setIsTyping(true);

        try {
            const response = await aiService.chat({
                message: text.trim(),
                userId: user?.id || user?.user_id,
                context: {
                    role: user?.role,
                    preferences: {}
                }
            });

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.message || response.response || response.text || 'Xin lỗi, tôi không thể trả lời lúc này.',
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('AI Chat error:', error);
            toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');

            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'Xin lỗi, tôi đang gặp sự cố kết nối. Bạn có thể thử lại sau hoặc liên hệ hỗ trợ qua hotline.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    const handleRegenerate = async (message) => {
        // Find the user's message before this assistant message
        const msgIndex = messages.findIndex(m => m.id === message.id);
        if (msgIndex > 0 && messages[msgIndex - 1]?.role === 'user') {
            const userMsg = messages[msgIndex - 1];
            // Remove the old assistant message
            setMessages(prev => prev.filter(m => m.id !== message.id));
            setIsLoading(true);
            setIsTyping(true);
            
            try {
                const response = await aiService.chat({
                    message: userMsg.content,
                    userId: user?.id || user?.user_id,
                    context: { role: user?.role, preferences: {} }
                });

                const newMessage = {
                    id: Date.now(),
                    role: 'assistant',
                    content: response.message || response.response || response.text || 'Xin lỗi, tôi không thể trả lời lúc này.',
                    timestamp: new Date().toISOString()
                };

                setMessages(prev => [...prev, newMessage]);
            } catch (error) {
                toast.error('Không thể tạo lại câu trả lời');
            } finally {
                setIsLoading(false);
                setIsTyping(false);
            }
        }
    };

    const handleQuickAction = (prompt) => {
        handleSend(prompt);
    };

    const clearChat = () => {
        setMessages([]);
        setTimeout(() => {
            setMessages([{
                id: Date.now(),
                role: 'assistant',
                content: `Xin chào ${user?.full_name || 'bạn'}! 👋\n\nTôi đã xóa lịch sử trò chuyện. Bạn cần tôi hỗ trợ gì hôm nay?`,
                timestamp: new Date().toISOString()
            }]);
        }, 100);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900">AI Assistant</h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PropTech</p>
                    </div>
                </div>
                <button 
                    onClick={clearChat}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Xóa cuộc trò chuyện"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.map((message) => (
                    <ChatMessage 
                        key={message.id} 
                        message={message} 
                        onRegenerate={handleRegenerate}
                    />
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-4 animate-fade-in-up">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div className="bg-gray-100 px-5 py-4 rounded-2xl rounded-tl-md">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggested Prompts (when chat is empty or after welcome) */}
                {messages.length <= 2 && !isTyping && (
                    <SuggestedPrompts onSelect={handleQuickAction} />
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Nhập tin nhắn cho AI..."
                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                            rows={1}
                            style={{ maxHeight: '120px' }}
                        />
                    </div>
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                        className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        {isLoading ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <Send size={20} />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 text-center mt-3">
                    AI có thể mắc lỗi. Hãy xác minh thông tin quan trọng.
                </p>
            </div>
        </div>
    );
};

export default TenantChat;
