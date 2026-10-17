import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, 
    Plus, 
    Search, 
    MoreVertical, 
    ArrowRight, 
    Shield, 
    User,
    Loader2,
    BookOpen,
    Sparkles,
    CheckSquare
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { validateGroupForm, validateInviteCode, hasErrors } from '../utils/validation';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });
    const [submitting, setSubmitting] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);
    const navigate = useNavigate();

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/groups');
            setGroups(data.data);
        } catch (error) {
            toast.error('Failed to load groups');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        
        // Validation
        const errors = validateGroupForm({
          name: newGroup.name,
          description: newGroup.description
        });
        if (hasErrors(errors)) {
          const firstError = Object.values(errors)[0];
          toast.error(firstError);
          return;
        }
        
        try {
            setSubmitting(true);
            console.log('Creating group with:', { name: newGroup.name, description: newGroup.description });
            const { data } = await api.post('/groups', newGroup);
            console.log('Group created successfully:', data);
            toast.success('Group created successfully!');
            setGroups([data.data, ...groups]);
            setShowCreateModal(false);
            setNewGroup({ name: '', description: '' });
            navigate(`/groups/${data.data._id}`);
        } catch (error) {
            console.error('Group creation error:', error);
            console.error('Full error object:', error);
            if (error.response) {
                console.error('Error response status:', error.response.status);
                console.error('Error response data:', error.response.data);
            }
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create group (500 Server Error)';
            console.error('Final error message:', errorMessage);
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinByCode = async (e) => {
        e.preventDefault();
        
        // Validation
        const codeValidation = validateInviteCode(joinCode);
        if (!codeValidation.valid) {
          toast.error(codeValidation.error);
          return;
        }
        
        try {
            setJoining(true);
            const { data } = await api.post('/groups/join-by-code', { code: joinCode });
            toast.success('Joined group successfully!');
            setShowJoinModal(false);
            setJoinCode('');
            navigate(`/groups/${data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join group');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-transparent py-4 mb-2">
                <div>
                    <h1 className="text-[28px] font-bold text-slate-800">Study Groups</h1>
                    <p className="text-[14px] text-slate-500 mt-1">Collaborate, share resources, and track progress together</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => setShowJoinModal(true)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-[10px] px-5 py-2.5 flex items-center gap-2 font-medium shadow-sm transition-all"
                    >
                        <span>Join by Code</span>
                    </Button>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[rgb(85,74,228)] hover:bg-[rgb(75,64,218)] text-white rounded-[10px] px-5 py-2.5 flex items-center gap-2 font-medium shadow-sm transition-all"
                    >
                        <Plus size={18} />
                        <span>Create Group</span>
                    </Button>
                </div>
            </div>

            {/* Groups Grid */}
            {groups.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                    <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Study Groups Found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8">
                        You haven't joined any groups yet. Start your collaborative journey by creating your first study group now!
                    </p>
                    <Button 
                        variant="outline"
                        onClick={() => setShowCreateModal(true)}
                        className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                        Create Your First Group
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => {
                        // Safer isAdmin check that handles both populated and unpopulated member user data
                        const isAdmin = group.members.some(m => {
                            const memberId = typeof m.user === 'object' ? m.user?._id : m.user;
                            return memberId === group.createdBy;
                        });
                        
                        return (
                            <div 
                                key={group._id} 
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden"
                            >
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[rgb(85,74,228)] flex items-center justify-center">
                                            <Users size={22} />
                                        </div>
                                        <Badge variant="outline" className={`px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 font-medium text-xs rounded-full`}>
                                            {isAdmin ? 'Admin' : 'Member'}
                                        </Badge>
                                    </div>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-1">
                                            {group.name}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-1 h-5">
                                            {group.description || 'No description provided.'}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mb-4 text-slate-500">
                                        <Users size={16} />
                                        <span className="text-sm">
                                            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 flex flex-col gap-2">
                                        <div className="flex justify-between items-center text-[13px] text-slate-500">
                                            <span className="flex items-center gap-1.5"><CheckSquare size={14} className="text-slate-400"/> Completion</span>
                                            <span className="text-[rgb(85,74,228)] font-medium">0%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full mb-4">
                                            <div className="h-full bg-[rgb(85,74,228)] rounded-full w-[0%]"></div>
                                        </div>
                                        <Button 
                                            variant="outline"
                                            onClick={() => navigate(`/groups/${group._id}`)}
                                            className="w-full border-slate-200 text-[rgb(85,74,228)] hover:bg-slate-50 hover:text-[rgb(85,74,228)] bg-white rounded-xl shadow-sm tracking-wide text-sm h-11"
                                        >
                                            Open Group <ArrowRight size={16} className="ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div 
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                        onKeyDown={(e) => e.key === 'Escape' && setShowCreateModal(false)}
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                                    <Users size={24} />
                                </div>
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Study Group</h2>
                            <p className="text-gray-500 mb-8">Build a space to collaborate with your fellow students.</p>

                            <form onSubmit={handleCreateGroup} className="space-y-6" noValidate>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-bold text-gray-700">Group Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        id="name"
                                        placeholder="E.g. Advanced Calculus Study Squad" 
                                        className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-6"
                                        value={newGroup.name}
                                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                                        required
                                        minLength={2}
                                        maxLength={50}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-sm font-bold text-gray-700">Short Description</Label>
                                    <textarea 
                                        id="desc"
                                        rows="3"
                                        placeholder="What is this group about?"
                                        className="w-full rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 p-4 text-sm resize-none outline-none border focus:ring-2"
                                        value={newGroup.description}
                                        onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                                        maxLength={500}
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 rounded-xl py-6 border-gray-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        disabled={submitting || !newGroup.name.trim()}
                                        className="flex-1 rounded-xl py-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                    >
                                        {submitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Create Group"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                        <div className="bg-gray-50 p-6 px-8 border-t border-gray-100 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-gray-400" />
                            <p className="text-[11px] text-gray-400 font-medium">
                                As a creator, you will be designated as the <span className="text-indigo-600">Admin</span> of this group and can manage members and tasks.
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Join Group Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Group by Code</h2>
                            <p className="text-gray-500 mb-8">Enter the 6-character invite code shared by the group admin.</p>

                            <form onSubmit={handleJoinByCode} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-sm font-bold text-gray-700">Invite Code</Label>
                                    <Input 
                                        id="code"
                                        placeholder="E.g. AX79P2" 
                                        className="rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 py-6 text-center text-xl font-bold tracking-widest uppercase"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <Button 
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowJoinModal(false)}
                                        className="flex-1 rounded-xl py-6 border-gray-200"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit"
                                        disabled={joining}
                                        className="flex-1 rounded-xl py-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                                    >
                                        {joining ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Group"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Groups;