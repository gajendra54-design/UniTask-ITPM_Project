import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Users, 
    CheckCircle2, 
    Clock, 
    AlertCircle, 
    Plus, 
    Search, 
    FileText, 
    Link as LinkIcon, 
    Trash2, 
    Download, 
    ExternalLink, 
    UserPlus, 
    LogOut,
    Trophy,
    Activity,
    MoreVertical,
    Calendar,
    ArrowRight,
    Loader2,
    LayoutDashboard,
    CheckSquare,
    ListFilter,
    Sparkles,
    MessageSquare,
    Paperclip,
    Lock,
    BookOpen,
    X,
    MapPin,
    BarChart3,
    Share2,
    MessageCircle,
    XCircle,
    Settings,
    Globe,
    RefreshCw,
    Mail,
    FileSpreadsheet,
    FileArchive,
    File,
    ChevronLeft,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { 
    DndContext, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors,
    useDroppable,
    DragOverlay
} from '@dnd-kit/core';
import { 
     
    SortableContext, 
    useSortable,
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy 
    
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    formatDistanceToNow, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    format, 
    isSameDay, 
    isToday, 
    startOfWeek, 
    endOfWeek, 
    addMonths, 
    subMonths 
} from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import TaskDetailsModal from '../components/TaskDetailsModal';
import TaskBurndownChart from '../components/TaskBurndownChart';
import ResourceHub from '../components/ResourceHub';
import AIHealthReport from '../components/AIHealthReport'
import AITaskDistributor from '../components/AITaskDistributor'
import { validateTaskForm, validateEmail, validateUsageLimit, hasErrors } from '../utils/validation';


const MiniCalendar = ({ tasks, setActiveTab, currentUserId, setHighlightedTaskId }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const popupRef = useRef(null);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Calendar calculation
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Close popup on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setSelectedDate(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const getTasksForDate = (date) => {
        return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), date));
    };

    const handleTaskClick = (taskId) => {
        setActiveTab('tasks');
        setHighlightedTaskId(taskId);
        setSelectedDate(null);
        // Scroll to Task tab is automatic by switching state, but we might want a smooth scroll.
        // For now, simple state change is enough as per requirement.
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex flex-col">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        📅 Group Task Calendar
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">Click any date to see tasks due</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
                        <ChevronLeft size={18} />
                    </button>
                    <span className="text-sm font-bold text-slate-700 min-w-[100px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-500">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="grid grid-cols-7 mb-2">
                    {days.map(day => (
                        <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider py-2">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl shadow-inner relative">
                    {calendarDays.map((date, i) => {
                        const dateTasks = getTasksForDate(date);
                        const isCurrentMonth = isSameDay(startOfMonth(date), monthStart);
                        const isTodayDate = isToday(date);
                        const hasMyTasks = dateTasks.some(t => {
                            const assignedId = (t.assignedTo?._id || t.assignedTo || '').toString();
                            return assignedId === currentUserId?.toString();
                        });

                        return (
                            <div 
                                key={i}
                                onClick={() => dateTasks.length > 0 && setSelectedDate(date)}
                                className={`
                                    relative min-h-[85px] p-2 transition-all bg-white
                                    ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-300' : 'text-slate-700'}
                                    ${hasMyTasks ? 'bg-green-50/60' : ''}
                                    ${dateTasks.length > 0 ? 'cursor-pointer hover:bg-slate-50' : ''}
                                    ${selectedDate && isSameDay(date, selectedDate) ? 'z-[110]' : 'z-auto'}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <span className={`
                                        text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                                        ${isTodayDate ? 'bg-green-600 text-white shadow-md shadow-green-200' : ''}
                                    `}>
                                        {format(date, 'd')}
                                    </span>
                                </div>

                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1 flex-wrap">
                                        {dateTasks.slice(0, 3).map((t, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`w-2 h-2 rounded-full shadow-[0_0_2px_rgba(0,0,0,0.1)] ${
                                                    t.priority === 'High' ? 'bg-red-500' : 
                                                    t.priority === 'Medium' ? 'bg-yellow-400' : 'bg-green-400'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    {dateTasks.length > 3 && (
                                        <p className="text-[9px] font-black text-slate-400">+{dateTasks.length - 3} more</p>
                                    )}
                                </div>

                                {/* Popup for tasks */}
                                {selectedDate && isSameDay(date, selectedDate) && (
                                    <div 
                                        ref={popupRef}
                                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl z-[200] animate-in slide-in-from-top-2 fade-in zoom-in-95 duration-200 overflow-hidden"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Popup Header */}
                                        <div className="p-4 border-b bg-slate-50/80 backdrop-blur-sm relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                                                        {format(date, 'EEEE, MMM d')}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                                                        {dateTasks.length} {dateTasks.length === 1 ? 'Task' : 'Tasks'} Scheduled
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedDate(null)}
                                                    className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                                                >
                                                    <X size={14} strokeWidth={3} />
                                                </button>
                                            </div>

                                            {/* Progress Bar for the day */}
                                            {(() => {
                                                const completed = dateTasks.filter(t => t.status === 'Done').length;
                                                const percent = Math.round((completed / dateTasks.length) * 100);
                                                return (
                                                    <div className="space-y-1.5 mt-3">
                                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-600">
                                                            <span>Day Progress</span>
                                                            <span>{percent}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                                            <div 
                                                                className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Task List */}
                                        <div className="max-h-[300px] overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                                            {dateTasks.map(t => (
                                                <div 
                                                    key={t._id}
                                                    onClick={() => handleTaskClick(t._id)}
                                                    className="group flex items-start gap-3 p-3 hover:bg-indigo-50/50 active:bg-indigo-100/50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100 relative overflow-hidden"
                                                >
                                                    {/* Status indicator bar */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                        t.status === 'Done' ? 'bg-green-500' :
                                                        t.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300'
                                                    }`} />

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                            <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
                                                                {t.title}
                                                            </p>
                                                            <div className={`shrink-0 w-1.5 h-1.5 rounded-full shadow-sm mt-1 animate-pulse ${
                                                                t.priority === 'High' ? 'bg-red-500' : 
                                                                t.priority === 'Medium' ? 'bg-amber-400' : 'bg-green-400'
                                                            }`} />
                                                        </div>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                                                                {t.assignedTo?.profileImage ? (
                                                                    <img src={t.assignedTo.profileImage} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-[8px] font-black text-slate-500">
                                                                        {t.assignedTo?.name?.charAt(0) || '?'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-bold truncate">
                                                                {t.assignedTo?.name || 'Unassigned'}
                                                            </span>
                                                            <span className={`ml-auto text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md border ${
                                                                t.status === 'Done' ? 'bg-green-50 text-green-700 border-green-100' :
                                                                t.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                            }`}>
                                                                {t.status}
                                                            </span>
                                                        </div>

                                                        {t.description && (
                                                            <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 italic font-medium">
                                                                {t.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="p-3 bg-slate-50 border-t border-slate-100">
                                            <button 
                                                onClick={() => setActiveTab('tasks')}
                                                className="w-full py-2 rounded-lg bg-white border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider hover:bg-slate-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                            >
                                                Manage All Tasks <ArrowRight size={10} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};



const SortableTaskCard = ({ task, onClick, onDelete, isAdmin, currentUserId, isHighlighted }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (window.confirm('Delete this task?')) {
            onDelete(task._id);
        }
    };

    const handleCardClick = (e) => {
        e.stopPropagation();
        onClick();
    };

    const getPriorityBg = (priority) => {
        if (priority === 'High') return 'bg-red-100 text-red-700';
        if (priority === 'Medium') return 'bg-yellow-100 text-yellow-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white p-4 rounded-xl shadow-sm border hover:border-gray-300 hover:shadow-md cursor-pointer transition-all group ${
                isHighlighted 
                ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] ring-2 ring-green-200' 
                : 'border-gray-100'
            }`}
            onClick={handleCardClick}
        >
            <div className="flex justify-between items-start mb-2">
                <h6 className="font-bold text-gray-800 text-sm flex-1 line-clamp-2">{task.title}</h6>
                {(isAdmin || task.createdBy === currentUserId) && (
                    <button
                        onClick={handleDeleteClick}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-2 shrink-0"
                        title="Delete Task"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            {task.description && <p className="text-xs text-gray-500 line-clamp-1 mb-2">{task.description}</p>}
            <div className="flex gap-2 items-center mb-2 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPriorityBg(task.priority)}`}>
                    {task.priority}
                </span>
                {task.status && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {task.status}
                    </span>
                )}
            </div>
            <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
                    {task.assignedTo?.name?.charAt(0) || '?'}
                </div>
                {task.dueDate && <span>{new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
        </div>
    );
};

const DroppableColumn = ({ id, title, count, styles, children }) => {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={`rounded-xl border ${styles} p-4 min-h-[500px] flex flex-col transition-colors`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm">{title}</h3>
                <span className="text-xs border bg-white/50 px-2 py-0.5 rounded-full">{count}</span>
            </div>
            <div className="flex-1 space-y-3">
                {children}
            </div>
        </div>
    );
};

const GroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [group, setGroup] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [resources, setResources] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [showAIDistributor, setShowAIDistributor] = useState(false);

    // Clear highlight after 2s
    useEffect(() => {
        if (highlightedTaskId) {
            const timer = setTimeout(() => setHighlightedTaskId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedTaskId]);

    // Modals
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [, setInviteCode] = useState(null);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [showCodeSettings, setShowCodeSettings] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const taskId = active.id;
        const overId = over.id;

        // Determine the target status
        let newStatus = overId;
        if (!['To-Do', 'In Progress', 'Done'].includes(overId)) {
            const overTask = tasks.find(t => t._id === overId);
            newStatus = overTask ? overTask.status : active.data.current?.status;
        }

        const currentTask = tasks.find(t => t._id === taskId);
        if (currentTask && currentTask.status !== newStatus) {
            updateTaskStatus(taskId, newStatus);
        }
    };
    const [expiresIn, setExpiresIn] = useState('7d');
    const [usageLimit, setUsageLimit] = useState('');

    // Form inputs and selection
    const [searchQueryUser, setSearchQueryUser] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', status: 'To-Do', priority: 'Medium', dueDate: '', isRecurring: false, emailReminder: false, subtasks: [], dependsOn: [] });
    const [tempSubtask, setTempSubtask] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [groupRes, tasksRes, resourcesRes, contributionsRes, activityRes] = await Promise.all([
                api.get(`/groups/${id}`),
                api.get(`/groups/${id}/tasks`),
                api.get(`/resources/group/${id}`),
                api.get(`/groups/${id}/contributions`),
                api.get(`/groups/${id}/activity`)
            ]);

            setGroup(groupRes.data.data);
            setTasks(tasksRes.data.data);
            setResources(resourcesRes.data.data);
            setContributions(contributionsRes.data.data);
            setActivity(activityRes.data.data);
            
            // Check if current user is admin
            const currentUserId = user?.id?.toString(); // Backend returns .id for current user
            const member = groupRes.data.data.members.find(m => {
                const mId = (m.user?._id || m.user || '').toString();
                return mId === currentUserId;
            });
            
            const isAdminByRole = member?.role === 'admin';
            const isAdminByCreator = (groupRes.data.data.createdBy?._id || groupRes.data.data.createdBy)?.toString() === currentUserId;
            setIsAdmin(isAdminByRole || isAdminByCreator);
        } catch  {
            toast.error('Failed to load group details');
            navigate('/groups');
        } finally {
            setLoading(false);
        }
    }, [id, user?.id, navigate]); // Use user?.id

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Member Management
    const handleSearchUsers = async (query) => {
        setSearchQueryUser(query);
        setSelectedUser(null);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const { data } = await api.get(`/groups/search-users?q=${query}`);
            setSearchResults(data.data);
        } catch  {
            console.error('Failed to search users');
        } finally {
            setIsSearching(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        const emailToInvite = selectedUser ? selectedUser.email : searchQueryUser.trim();
        
        // Validation
        if (!emailToInvite) return toast.error('Please select a user to invite');
        if (!validateEmail(emailToInvite)) return toast.error('Please enter a valid email address');
        
        // Check if already a member
        const isMember = group.members.some(m => 
          (m.user?.email || m.user) === emailToInvite || 
          m.user?._id === selectedUser?._id
        );
        if (isMember) return toast.error('This user is already a member of the group');
        
        try {
            const { data } = await api.post(`/groups/${id}/invite`, { email: emailToInvite });
            toast.success('Member added successfully!');
            setSearchQueryUser('');
            setSelectedUser(null);
            setSearchResults([]);
            setGroup(data.data); // Update with return data from backend
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to invite member');
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/groups/${id}/members/${userId}`);
            toast.success('Member removed');
            fetchData();
        } catch  {
            toast.error('Failed to remove member');
        }
    };

    const handleGenerateInviteCode = async () => {
        try {
            setIsGeneratingCode(true);
            
            // Validate usage limit
            if (usageLimit) {
              const limitValidation = validateUsageLimit(usageLimit);
              if (!limitValidation.valid) {
                toast.error(limitValidation.error);
                setIsGeneratingCode(false);
                return;
              }
            }
            
            const { data } = await api.post(`/groups/${id}/invite-code`, {
                expiresIn,
                limit: usageLimit ? parseInt(usageLimit) : null
            });
            setInviteCode(data.inviteCode);
            setGroup(prev => ({ 
                ...prev, 
                inviteCode: data.inviteCode,
                inviteCodeExpires: data.inviteCodeExpires,
                inviteCodeLimit: data.inviteCodeLimit,
                inviteCodeUsedCount: data.inviteCodeUsedCount
            }));
            toast.success('Invite code generated!');
            setShowCodeSettings(false);
        } catch  {
            toast.error('Failed to generate code');
        } finally {
            setIsGeneratingCode(false);
        }
    };

    const handleRevokeInviteCode = async () => {
        if (!window.confirm('Are you sure you want to deactivate this invite code?')) return;
        try {
            await api.delete(`/groups/${id}/invite-code`);
            setInviteCode(null);
            setGroup(prev => ({ 
                ...prev, 
                inviteCode: null,
                inviteCodeExpires: null,
                inviteCodeLimit: null,
                inviteCodeUsedCount: 0
            }));
            toast.success('Invite code deactivated');
        } catch  {
            toast.error('Failed to revoke code');
        }
    };

    const handleShare = useCallback((platform, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Validation
        if (!group.inviteCode) {
          toast.error('Please generate an invite code first');
          return;
        }
        
        const joinLink = `${window.location.origin}/join/${group.inviteCode}`;
        const message = `Join my study group "${group.name}" on UniTask! Shared workspace for tasks and resources.\n\nJoin here: ${joinLink}\nCode: ${group.inviteCode}`;
        
        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        } else if (platform === 'email') {
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(`Study Group Invitation: ${group.name}`)}&body=${encodeURIComponent(message)}`;
            // Use a temporary link to trigger mailto reliably without side effects
            const tempLink = document.createElement('a');
            tempLink.href = mailtoUrl;
            tempLink.click();
        }
    }, [group?.inviteCode, group?.name]);

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;
        try {
            await api.delete(`/groups/${id}/leave`);
            toast.success('You have left the group');
            navigate('/groups');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to leave group');
        }
    };

    const handleDeleteGroup = async () => {
        if (!window.confirm('Are you absolutely sure you want to DELETE this group? This action cannot be undone. All tasks, resources, and member data will be permanently deleted.')) return;
        try {
            await api.delete(`/groups/${id}`);
            toast.success('Group deleted successfully');
            navigate('/groups');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete group');
        }
    };

    // Task Management
    const handleAddTask = async (e) => {
        e.preventDefault();
        
        // Validation
        const errors = validateTaskForm(taskForm);
        if (hasErrors(errors)) {
          const firstError = Object.values(errors)[0];
          toast.error(firstError);
          return;
        }
        
        try {
            const { data } = await api.post(`/groups/${id}/tasks`, taskForm);
            setTasks(prev => [data.data, ...prev]); // optimistic local add
            toast.success('Task created!');
            setShowTaskModal(false);
            setTaskForm({ 
                title: '', 
                description: '', 
                assignedTo: '', 
                status: 'To-Do', 
                priority: 'Medium', 
                dueDate: '', 
                isRecurring: false, 
                emailReminder: false, 
                subtasks: [], 
                dependsOn: [] 
            });
        } catch  {
            toast.error('Failed to create task');
        }
    };

    const handleAddSubtaskForNewTask = () => {
        if (!tempSubtask.trim()) return;
        setTaskForm({
            ...taskForm,
            subtasks: [...taskForm.subtasks, { title: tempSubtask, completed: false }]
        });
        setTempSubtask('');
    };

    const handleRemoveSubtaskFromNewTask = (index) => {
        const newSubtasks = [...taskForm.subtasks];
        newSubtasks.splice(index, 1);
        setTaskForm({ ...taskForm, subtasks: newSubtasks });
    };

    const handleAISuggestForTask = () => {
        if (!taskForm.title) return toast.error('Enter a title first!');
        
        const suggestions = {
            "Exam": "Prepare study notes, review past papers, and conduct a group discussion session.",
            "Assignment": "Outline the structure, gather research materials, and write the first draft.",
            "Quiz": "Review key concepts from the lectures and practice sample questions.",
            "Presentation": "Research the topic, create slides, and practice the delivery."
        };

        const key = Object.keys(suggestions).find(k => taskForm.title.toLowerCase().includes(k.toLowerCase()));
        const suggestedDesc = key ? suggestions[key] : `Detailed breakdown and collaborative work for "${taskForm.title}".`;
        
        setTaskForm({ ...taskForm, description: suggestedDesc });
        toast.success('AI suggestions applied!');
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        // Optimistic update — no full re-fetch needed
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        try {
            await api.patch(`/groups/${id}/tasks/${taskId}/status`, { status: newStatus });
            toast.success(`Task moved to ${newStatus}`);
        } catch (error) {
            // Rollback on failure
            fetchData();
            toast.error(error.response?.data?.message || 'Failed to update task');
        }
    };

    


    

    const handleDownloadResource = async (url, fileName) => {
        try {
            toast.loading(`Downloading ${fileName}...`, { id: 'download' });
            const baseUrl = api.defaults.baseURL || '';
            const response = await fetch(`${baseUrl}/${url}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success(`Download complete: ${fileName}`, { id: 'download' });
        } catch  {
            toast.error('Download failed', { id: 'download' });
        }
    };

    const getFileIcon = (fileName = '') => {
        const ext = fileName.split('.').pop().toLowerCase();
        if (['docx', 'doc'].includes(ext)) return <FileText size={18} className="text-blue-500" />;
        if (['pptx', 'ppt'].includes(ext)) return <BarChart3 size={18} className="text-orange-500" />;
        if (['xlsx', 'xls', 'csv'].includes(ext)) return <FileSpreadsheet size={18} className="text-green-500" />;
        if (ext === 'pdf') return <FileText size={18} className="text-red-500" />;
        if (ext === 'zip') return <FileArchive size={18} className="text-purple-500" />;
        return <File size={18} className="text-slate-400" />;
    };

    if (loading || !group) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    // Stats calculations
    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Done').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        todo: tasks.filter(t => t.status === 'To-Do').length
    };
    const progress = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

    return (
        <div className="max-w-[70rem] mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Back Button */}
            <div>
                <button 
                    onClick={() => navigate('/groups')}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                    <ArrowRight size={16} className="rotate-180" /> Back to Groups
                </button>
            </div>

            {/* Group Header */}
            <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-indigo-50 text-[rgb(85,74,228)] rounded-xl flex items-center justify-center shrink-0">
                        <Users size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{group.name}</h1>
                            {isAdmin && <span className="bg-indigo-100 text-indigo-600 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border border-indigo-200 shadow-sm">Admin</span>}
                        </div>
                        <p className="text-sm text-slate-500">{group.description}</p>
                        <p className="text-xs text-slate-400 mt-1">{group.members.length} {group.members.length === 1 ? 'member' : 'members'}</p>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-[10px] overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
                    { id: 'resources', label: 'Resources', icon: BookOpen },
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
                    { id: 'analytics', label: 'Analytics', icon: Activity }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${activeTab === tab.id 
                                ? 'bg-white text-[rgb(85,74,228)] shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'}
                        `}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[60vh]">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm flex flex-col items-center justify-center min-h-[120px]">
                                <h4 className="text-3xl font-bold text-slate-800">{taskStats.total}</h4>
                                <span className="text-slate-500 text-sm mt-1">Total Tasks</span>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-[14px] border border-blue-100 flex flex-col items-center justify-center min-h-[120px]">
                                <h4 className="text-3xl font-bold text-slate-800">{taskStats.completed}</h4>
                                <span className="text-slate-500 text-sm mt-1">Done</span>
                            </div>
                            <div className="bg-yellow-50 p-6 rounded-[14px] border border-yellow-200 flex flex-col items-center justify-center min-h-[120px]">
                                <h4 className="text-3xl font-bold text-slate-800">{taskStats.inProgress}</h4>
                                <span className="text-slate-500 text-sm mt-1">In Progress</span>
                            </div>
                            <div className="bg-red-50 p-6 rounded-[14px] border border-red-100 flex flex-col items-center justify-center min-h-[120px]">
                                <h4 className="text-3xl font-bold text-slate-800">{taskStats.todo}</h4>
                                <span className="text-slate-500 text-sm mt-1">To-Do</span>
                            </div>
                        </div>

                        {/* Overall Completion Progress */}
                        <div className="bg-white rounded-[14px] border border-gray-200 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="font-bold text-slate-800 text-sm">Overall Completion</h5>
                                <span className="text-sm font-bold text-[rgb(85,74,228)]">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[rgb(85,74,228)] rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        {/* Member Analysis & Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 overflow-hidden">
                                <h5 className="font-bold text-slate-800 text-sm mb-4">Member Task Breakdown</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-slate-500 border-b border-gray-100">
                                                <th className="pb-3 font-medium">Member</th>
                                                <th className="pb-3 font-medium text-center">Assigned</th>
                                                <th className="pb-3 font-medium text-center">Done</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {group.members.map((m) => {
                                                const memberTasks = tasks.filter(t => {
                                                    const mId = (m.user?._id || m.user || '').toString();
                                                    const assignedId = (t.assignedTo?._id || t.assignedTo || '').toString();
                                                    return assignedId === mId;
                                                });
                                                const completed = memberTasks.filter(t => t.status === 'Done').length;
                                                return (
                                                    <tr key={m.user?._id || m.user}>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-[rgb(85,74,228)] flex items-center justify-center text-[10px] font-bold">
                                                                    {m.user?.name?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-slate-800">{m.user?.name || 'Unknown'}</p>
                                                                    <p className="text-[10px] text-slate-400">{m.user?.email || ''}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-center text-slate-600">{memberTasks.length}</td>
                                                        <td className="py-3 text-center text-slate-600">{completed}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-[14px] border border-gray-200 shadow-sm p-6 overflow-hidden">
                                <h5 className="font-bold text-slate-800 text-sm mb-4">Recent Activity</h5>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                                    {activity.length === 0 ? (
                                        <p className="text-slate-400 text-sm">No recent activity.</p>
                                    ) : (
                                        activity.map((item, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 text-[rgb(85,74,228)] flex items-center justify-center font-bold text-[10px]">
                                                    {item.userName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-700">
                                                        <span className="font-medium text-slate-900">{item.userName}</span> {item.action}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                        </span>
                                                        <span className="text-[9px] text-[rgb(85,74,228)] bg-indigo-50 px-1 rounded truncate">+{item.points}pts</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* MINI CALENDAR SECTION */}
                        <MiniCalendar 
                            tasks={tasks} 
                            setActiveTab={setActiveTab} 
                            currentUserId={user?.id}
                            setHighlightedTaskId={setHighlightedTaskId}
                        />
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {isAdmin && (
                            <div className="flex justify-end gap-3 mb-4">
                                <Button 
                                    onClick={() => setShowAIDistributor(!showAIDistributor)} 
                                    className={`rounded-[10px] px-6 py-2 shadow-sm font-medium flex items-center gap-2 transition-all ${
                                        showAIDistributor 
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                        : 'bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                >
                                    <Sparkles size={16} /> 🎯 AI Distributor
                                </Button>
                                <Button onClick={() => setShowTaskModal(true)} className="bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white rounded-[10px] px-6 py-2 shadow-sm font-medium flex items-center gap-1">
                                    <Plus size={18} /> Add Task
                                </Button>
                            </div>
                        )}

                        {showAIDistributor && isAdmin && (
                            <div className="animate-in slide-in-from-top-4 duration-300">
                                <AITaskDistributor groupId={id} onTaskCreated={fetchData} />
                            </div>
                        )}

                        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {['To-Do', 'In Progress', 'Done'].map((col) => {
                                    const colTasks = tasks.filter(t => t.status === col);
                                    let colStyles = "";
                                    if (col === 'To-Do') colStyles = "bg-red-50 border-red-100 text-red-700";
                                    if (col === 'In Progress') colStyles = "bg-yellow-50 border-yellow-200 text-yellow-700";
                                    if (col === 'Done') colStyles = "bg-blue-50 border-blue-100 text-blue-700";

                                    return (
                                        <DroppableColumn key={col} id={col} title={col} count={colTasks.length} styles={colStyles}>
                                            <SortableContext items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                                                {colTasks.length === 0 ? (
                                                    <div className={`h-24 rounded-xl border border-dashed flex items-center justify-center text-xs opacity-60 ${col === 'To-Do' ? 'border-red-200 text-red-700' : col === 'In Progress' ? 'border-yellow-300 text-yellow-800' : 'border-indigo-200 text-indigo-700'}`}>
                                                        Drop tasks here
                                                    </div>
                                                ) : (
                                                    colTasks.map((task) => (
                                                        <SortableTaskCard 
                                                            key={task._id} 
                                                            task={task} 
                                                            onClick={() => setSelectedTask(task)}
                                                            onDelete={async (taskId) => {
                                                                try {
                                                                    await api.delete(`/groups/${id}/tasks/${taskId}`);
                                                                    setTasks(prev => prev.filter(t => t._id !== taskId));
                                                                    toast.success('Task deleted');
                                                                } catch  {
                                                                    toast.error('Failed to delete task');
                                                                }
                                                            }}
                                                            groupId={id}
                                                            isAdmin={isAdmin}
                                                            currentUserId={user?.id}
                                                            isHighlighted={task._id === highlightedTaskId}
                                                        />
                                                    ))
                                                )}
                                            </SortableContext>
                                        </DroppableColumn>
                                    );
                                })}
                            </div>
                        </DndContext>
                    </div>
                )}

                {activeTab === 'resources' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <ResourceHub 
                            groupId={id}
                            isAdmin={isAdmin}
                            currentUserId={user?.id}
                            resources={resources}
                            onUpdate={fetchData}
                        />
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {isAdmin && (
                            <>
                                <div className="bg-[#EEEFFF] p-6 rounded-[20px] border border-indigo-50 shadow-sm relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                            <LinkIcon size={16} className="text-indigo-600" /> Invite with Code
                                        </h5>
                                        {!group.inviteCode && (
                                            <button 
                                                onClick={() => setShowCodeSettings(!showCodeSettings)}
                                                className={`p-2 rounded-lg transition-all ${showCodeSettings ? 'bg-indigo-100 text-indigo-700 shadow-inner' : 'hover:bg-indigo-100 text-indigo-400'}`}
                                            >
                                                <Settings size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {/* Settings Panel */}
                                        {showCodeSettings && !group.inviteCode && (
                                            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expiration</Label>
                                                        <select 
                                                            value={expiresIn}
                                                            onChange={(e) => setExpiresIn(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-lg h-9 px-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        >
                                                            <option value="1h">1 Hour</option>
                                                            <option value="1d">1 Day</option>
                                                            <option value="7d">7 Days</option>
                                                            <option value="never">No Expiration</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usage Limit</Label>
                                                        <input 
                                                            type="number"
                                                            placeholder="Unlimited"
                                                            value={usageLimit}
                                                            onChange={(e) => setUsageLimit(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-lg h-9 px-3 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {group.inviteCode ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-indigo-100 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Code</span>
                                                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-100 text-[9px] px-1.5 py-0">ACTIVE</Badge>
                                                        </div>
                                                        <span className="text-2xl font-black text-indigo-600 tracking-[0.2em]">{group.inviteCode}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            onClick={() => { navigator.clipboard.writeText(group.inviteCode); toast.success('Code copied!'); }}
                                                            variant="ghost" 
                                                            className="text-indigo-600 hover:bg-indigo-50 font-bold px-4 h-10 rounded-lg"
                                                        >
                                                            Copy
                                                        </Button>
                                                        <div className="h-6 w-px bg-slate-100" />
                                                        <button 
                                                            onClick={handleRevokeInviteCode}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                            title="Deactivate Code"
                                                        >
                                                            <XCircle size={20} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-white/40 p-3 rounded-xl border border-white/60 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <RefreshCw size={14} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Usage</span>
                                                            <span className="text-xs font-bold text-slate-700">
                                                                {group.inviteCodeLimit ? `${group.inviteCodeUsedCount} / ${group.inviteCodeLimit}` : `${group.inviteCodeUsedCount} uses`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/40 p-3 rounded-xl border border-white/60 flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                                            <Clock size={14} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Expires</span>
                                                            <span className="text-xs font-bold text-slate-700 truncate">
                                                                {group.inviteCodeExpires ? formatDistanceToNow(new Date(group.inviteCodeExpires), { addSuffix: true }) : 'Never'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pt-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Share:</span>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleShare('whatsapp', e)}
                                                            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                        >
                                                            <MessageCircle size={14} /> WhatsApp
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={(e) => handleShare('email', e)}
                                                            className="flex items-center gap-2 bg-[#EA4335] hover:bg-[#C5221F] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                        >
                                                            <Mail size={14} /> Email
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button 
                                                onClick={handleGenerateInviteCode} 
                                                disabled={isGeneratingCode}
                                                className="w-full bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white rounded-xl py-6 font-bold text-sm tracking-wide shadow-lg shadow-indigo-100 transition-all active:scale-95 h-12 flex items-center justify-center gap-2"
                                            >
                                                {isGeneratingCode ? <Loader2 size={18} className="animate-spin" /> : (
                                                    <><Plus size={18} /> Generate Invite Code</>
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-[14px] border border-gray-200 shadow-sm mt-6">
                                    <h5 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                                        <MessageSquare size={16} className="text-indigo-600" /> Invite by Email
                                    </h5>
                                    <form onSubmit={handleInvite} className="flex gap-3">
                                        <div className="relative flex-1">
                                            <Input 
                                                placeholder="student@example.com" 
                                                className="rounded-[10px] h-12 border-gray-100 bg-slate-50/50"
                                                value={searchQueryUser}
                                                onChange={(e) => handleSearchUsers(e.target.value)}
                                            />
                                            {isSearching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />}
                                            {searchResults.length > 0 && !selectedUser && (
                                                <div className="absolute top-14 left-0 right-0 bg-white rounded-[10px] shadow-lg border border-gray-200 p-2 z-50 max-h-56 overflow-y-auto">
                                                    {searchResults.map(u => (
                                                        <div key={u._id} onClick={() => { setSelectedUser(u); setSearchQueryUser(u.email); setSearchResults([]); }} className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors flex items-center justify-between">
                                                            <div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{u.name}</span><span className="text-xs text-slate-400">{u.email}</span></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Button 
                                            type="submit"
                                            disabled={!selectedUser && searchQueryUser.length < 3}
                                            className="bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white rounded-[10px] px-8 h-12 font-medium shadow-sm transition-all"
                                        >
                                            Invite
                                        </Button>
                                    </form>
                                    {selectedUser && (
                                        <div className="mt-3 bg-green-50 text-green-700 border border-green-200 rounded-lg p-2 text-xs flex items-center justify-between w-fit">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-green-500" />
                                                <span className="font-medium">Selected: {selectedUser.name}</span>
                                            </div>
                                            <X size={14} className="cursor-pointer hover:text-red-500 ml-3" onClick={() => { setSelectedUser(null); setSearchQueryUser(''); }} />
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="bg-white p-8 rounded-[14px] border border-gray-200 shadow-sm">
                            <h5 className="font-bold text-slate-800 text-sm mb-8 flex items-center gap-2">
                                <Users size={18} className="text-indigo-600" /> Members ({group.members.length})
                            </h5>
                            <div className="space-y-6">
                                {group.members.map((m) => (
                                    <div key={m.user._id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0 group hover:bg-slate-50/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-[rgb(85,74,228)] flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                                                {m.user.name?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <h6 className="font-bold text-slate-800 text-sm">
                                                    {m.user.name} {(m.user?._id === user?.id || m.user === user?.id) && <span className="text-slate-400 font-medium">(You)</span>}
                                                </h6>
                                                <p className="text-[11px] text-slate-400 font-medium">{m.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-3">
                                                {m.role === 'admin' ? (
                                                    <span className="text-[10px] font-bold text-[rgb(85,74,228)] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter shadow-sm">admin</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 uppercase tracking-tighter shadow-sm">member</span>
                                                )}
                                                <span className="text-[11px] text-slate-400 font-medium hidden sm:block">Joined {new Date(m.joinedAt || group.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            {isAdmin && m.user?._id !== user?.id && m.user !== user?.id && (
                                                <button onClick={() => handleRemoveMember(m.user?._id || m.user)} className="text-red-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Only show Leave Group if NOT admin */}
                        {!isAdmin && (
                            <div className="bg-red-50 p-6 rounded-[14px] border border-red-100 flex flex-col gap-2">
                                <h5 className="font-bold text-red-800 text-sm">Leave Group</h5>
                                <p className="text-xs text-red-600/80">You will lose access to all tasks and resources in this group.</p>
                                <Button 
                                    onClick={handleLeaveGroup}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-[10px] h-10 text-xs px-6 font-medium shadow-sm flex items-center gap-2 w-fit mt-2"
                                >
                                    <LogOut size={16} /> Leave Group
                                </Button>
                            </div>
                        )}

                        {/* Only show Delete Group if admin/creator */}
                        {isAdmin && (
                            <div className="bg-red-50 p-6 rounded-[14px] border border-red-100 flex flex-col gap-2">
                                <h5 className="font-bold text-red-800 text-sm">Delete Group</h5>
                                <p className="text-xs text-red-600/80">Permanently delete this group and all associated tasks, resources, and member data. This action cannot be undone.</p>
                                <Button 
                                    onClick={handleDeleteGroup}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-[10px] h-10 text-xs px-6 font-medium shadow-sm flex items-center gap-2 w-fit mt-2"
                                >
                                    <Trash2 size={16} /> Delete Group
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-8 rounded-[14px] border border-gray-200 shadow-sm">
                            <h5 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-500" /> Leaderboard
                            </h5>
                            
                            <div className="space-y-6">
                                {[...contributions]
                                    .sort((a, b) => b.score - a.score)
                                    .map((c, idx) => {
                                        const maxScore = Math.max(...contributions.map(cnt => cnt.score), 1);
                                        const scorePercent = (c.score / maxScore) * 100;
                                        
                                        return (
                                            <div key={c._id} className="flex items-start gap-4 group">
                                                <div className="w-8 flex justify-center pt-1 shrink-0">
                                                    {idx === 0 ? <span className="text-2xl">🥇</span> : 
                                                     idx === 1 ? <span className="text-2xl">🥈</span> : 
                                                     idx === 2 ? <span className="text-2xl">🥉</span> : 
                                                     <span className="text-sm font-bold text-slate-300">{idx + 1}</span>}
                                                </div>
                                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-[rgb(85,74,228)] flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                                    {c.user?.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <h6 className="font-bold text-slate-800 text-sm truncate">{c.user?.name}</h6>
                                                        <span className="text-sm font-bold text-[rgb(85,74,228)]">{c.score} pts</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
                                                        <div 
                                                            className="h-full bg-[rgb(85,74,228)] rounded-full transition-all duration-1000" 
                                                            style={{ width: `${scorePercent}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 font-medium">{c.activities.length} activities</p>
                                                </div>
                                            </div>
                                        );
                                })}
                                {contributions.length === 0 && (
                                    <div className="py-12 text-center">
                                        <p className="text-slate-400 text-sm italic">No data yet. Complete tasks to see progress!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <AIHealthReport groupId={id} />
                        
                        <div className="bg-white p-8 rounded-[14px] border border-gray-200 shadow-sm min-h-[500px] flex flex-col">
                            <div className="flex justify-between items-center mb-8">
                                <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <BarChart3 size={18} className="text-[rgb(85,74,228)]"/> Burndown Chart
                                </h5>
                                <span className="text-[11px] text-slate-400 font-medium">Remaining Effort (hrs) vs Time</span>
                            </div>
                            <div className="flex-1">
                                <TaskBurndownChart tasks={tasks} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals Implementation */}
            {selectedTask && (
                <TaskDetailsModal 
                    task={selectedTask}
                    groupId={id}
                    allTasks={tasks}
                    currentUser={user}
                    onClose={() => setSelectedTask(null)}
                    onDownload={handleDownloadResource}
                    getFileIcon={getFileIcon}
                    onUpdate={() => {
                        fetchData();
                        api.get(`/groups/${id}/tasks`).then(res => {
                            const updatedTask = res.data.data.find(t => t._id === selectedTask._id);
                            if (updatedTask) setSelectedTask(updatedTask);
                        });
                    }}
                />
            )}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[14px] shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Add Task</h2>
                            <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto overflow-x-hidden flex-1">
                            <form onSubmit={handleAddTask} id="add-task-form" className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></Label>
                                    <Input required placeholder="Task title..." className="rounded-lg h-10 border-gray-200" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                                    <textarea placeholder="Optional description..." className="w-full rounded-lg border border-gray-200 p-3 min-h-[80px] text-sm outline-none focus:ring-1 focus:ring-indigo-500" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Assign To</Label>
                                    <select className="w-full rounded-lg border border-gray-200 p-2 h-10 text-sm outline-none bg-white" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                                        <option value="">Unassigned</option>
                                        {group.members.map(m => (
                                            <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-5 gap-4 items-end">
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                                        <select className="w-full rounded-lg border border-gray-200 p-2 h-10 text-sm outline-none bg-white" value={taskForm.status} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                                            <option value="To-Do">To-Do</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Done">Done</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">Priority</Label>
                                        <select className="w-full rounded-lg border border-gray-200 p-2 h-10 text-sm outline-none bg-white" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 border border-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center h-10 cursor-pointer hover:bg-indigo-50 font-bold text-xs gap-1" onClick={handleAISuggestForTask}>
                                        <Sparkles size={12}/> AI Suggest
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Due Date <span className="text-red-500">*</span></Label>
                                    <Input required type="date" className="rounded-lg h-10 border-gray-200 text-sm" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} />
                                </div>
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="isRecurring" className="w-4 h-4 rounded text-indigo-600 border-gray-300" checked={taskForm.isRecurring} onChange={e => setTaskForm({...taskForm, isRecurring: e.target.checked})} />
                                        <Label htmlFor="isRecurring" className="text-sm text-gray-700 font-medium cursor-pointer">Is Recurring?</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="emailReminder" className="w-4 h-4 rounded text-indigo-600 border-gray-300" checked={taskForm.emailReminder} onChange={e => setTaskForm({...taskForm, emailReminder: e.target.checked})} />
                                        <Label htmlFor="emailReminder" className="text-sm text-gray-700 font-medium flex items-center gap-1 cursor-pointer">Enable Email Reminder <span className="text-xs text-gray-400 italic font-normal">(Sent 24hr before deadline)</span></Label>
                                    </div>
                                </div>
                                
                                <div className="border-t border-gray-100 pt-5">
                                    <Label className="text-sm font-medium text-gray-700 block mb-2">Checklist / Subtasks</Label>
                                    <div className="space-y-2 mb-3">
                                        {taskForm.subtasks.map((st, i) => (
                                            <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                <span className="text-sm text-slate-600">{st.title}</span>
                                                <button type="button" onClick={() => handleRemoveSubtaskFromNewTask(i)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Add a step..." 
                                            className="h-9 text-sm" 
                                            value={tempSubtask}
                                            onChange={e => setTempSubtask(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtaskForNewTask())}
                                        />
                                        <Button type="button" size="sm" variant="secondary" onClick={handleAddSubtaskForNewTask} className="h-9 px-3">Add</Button>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-5">
                                    <Label className="text-sm font-medium text-gray-700 block mb-1">Prerequisites (Dependencies)</Label>
                                    <p className="text-xs text-slate-400 mb-3 italic">Task will be locked until these are Done.</p>
                                    {tasks.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2">
                                            {tasks.map(t => (
                                                <label key={t._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent transition-colors">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-4 h-4 rounded text-indigo-600 border-gray-300"
                                                        checked={taskForm.dependsOn.includes(t._id)}
                                                        onChange={(e) => {
                                                            const newDeps = e.target.checked 
                                                                ? [...taskForm.dependsOn, t._id]
                                                                : taskForm.dependsOn.filter(id => id !== t._id);
                                                            setTaskForm({ ...taskForm, dependsOn: newDeps });
                                                        }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{t.title}</span>
                                                        <span className="text-[10px] text-slate-400">{t.status}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400">No other tasks available.</p>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex gap-3 bg-white pb-6">
                            <Button type="button" variant="ghost" onClick={() => setShowTaskModal(false)} className="flex-1 rounded-lg">Cancel</Button>
                            <Button type="submit" form="add-task-form" className="flex-1 rounded-lg bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white shadow-sm">Create Task</Button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default GroupDetail;
