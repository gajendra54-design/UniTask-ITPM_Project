import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const prevCountRef = useRef(0);
    const dropdownRef = useRef(null);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications/unread-count');
            const newCount = data.count;
            
            // If new notifications arrived, show a toast
            if (newCount > prevCountRef.current) {
                // Fetch latest to show in toast
                const { data: latestData } = await api.get('/notifications?limit=1');
                if (latestData.data && latestData.data.length > 0) {
                    const latest = latestData.data[0];
                    toast.success(latest.message, {
                        icon: '🔔',
                        duration: 5000,
                    });
                }
            }
            
            setUnreadCount(newCount);
            prevCountRef.current = newCount;
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.data);
            // Sync current count just in case
            if (data.data) {
                const unread = data.data.filter(n => !n.isRead).length;
                prevCountRef.current = unread;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    const markAllAsRead = async () => {
        try {
            await api.patch('/notifications/mark-read');
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success('All notifications marked as read');
        } catch  {
            toast.error('Failed to mark notifications as read');
        }
    };

    useEffect(() => {
        // This async request updates state only after the server responds.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        if (isOpen) {
            // This async request updates state only after the server responds.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                aria-label="Notifications"
            >
                {unreadCount > 0 ? (
                    <>
                        <BellRing size={20} className="text-indigo-600 animate-pulse" />
                        <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </>
                ) : (
                    <Bell size={20} />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-semibold text-gray-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <CheckCheck size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">
                                <Bell size={40} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 transition-colors ${!notification.isRead ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-bold text-slate-800 line-clamp-1">
                                                {notification.title || 'Notification'}
                                            </p>
                                            {!notification.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-2 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] text-gray-400">
                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                            </span>
                                            {notification.type && (
                                                <span className="text-[9px] font-bold text-indigo-500 uppercase bg-indigo-50 px-1 rounded">
                                                    {notification.type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 border-t border-gray-100 text-center bg-gray-50/50">
                            <span className="text-xs text-gray-500">Only showing recent alerts</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
