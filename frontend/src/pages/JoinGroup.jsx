import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import { Loader2, Users, ArrowRight, LogIn } from 'lucide-react';
import { Button } from '../components/ui/Button';

const JoinGroup = () => {
    const { code } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    const attemptJoin = async () => {
        if (!user) return; // Wait for user to be available

        try {
            setJoining(true);
            const { data } = await api.post('/groups/join-by-code', { code });
            toast.success(`Successfully joined ${data.data.name}!`);
            navigate(`/groups/${data.data._id}`);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to join group';
            setError(msg);
            toast.error(msg);
        } finally {
            setJoining(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            attemptJoin();
        }
    }, [authLoading, user, code]);

    if (authLoading || (user && joining)) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-50 text-[rgb(85,74,228)] rounded-2xl flex items-center justify-center animate-pulse">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Joining Group...</h2>
                    <p className="text-slate-500 text-sm">Please wait while we add you to the group workspace.</p>
                    <Loader2 className="animate-spin text-indigo-600" size={24} />
                </div>
            </div>
        );
    }

    if (!user && !authLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-indigo-50 text-[rgb(85,74,228)] rounded-2xl flex items-center justify-center">
                        <Users size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">You're Invited!</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            A friend has invited you to join their study group. Log in or create an account to access the shared workspace and resources.
                        </p>
                    </div>
                    
                    <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg w-full flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Invite Code</span>
                        <span className="font-mono font-bold text-indigo-700 tracking-widest">{code}</span>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Button 
                            onClick={() => navigate(`/login?redirect=/join/${code}`)}
                            className="bg-[rgb(85,74,228)] hover:bg-[#483fd1] text-white rounded-xl h-11 font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            <LogIn size={18} /> Log In to Join
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => navigate(`/signup?redirect=/join/${code}`)}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 font-bold"
                        >
                            Create New Account
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center max-w-md w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                        <Users size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Oops!</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            {error === 'Invalid or expired invite code' 
                                ? 'This invite code is no longer valid or has expired. Please ask the group admin for a new link.'
                                : error}
                        </p>
                    </div>
                    
                    <Button 
                        onClick={() => navigate('/groups')}
                        variant="outline"
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-11 px-8 font-bold flex items-center gap-2"
                    >
                        Go to My Groups <ArrowRight size={18} />
                    </Button>
                </div>
            </div>
        );
    }

    return null;
};

export default JoinGroup;
