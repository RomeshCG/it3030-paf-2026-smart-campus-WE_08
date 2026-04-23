import React, { useState, useEffect } from 'react';
import { Bell, Check, MailOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../api/notificationApi';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export const NotificationBell = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const [notifs, count] = await Promise.all([
                getMyNotifications(),
                getUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            fetchNotifications();
        } catch (err) {
            toast.error('Failed to mark as read');
        }
    };

    const handleOpenNotification = async (notif) => {
        try {
            if (!isNotificationRead(notif)) {
                await markAsRead(notif.id);
            }
            if (notif.link) {
                navigate(notif.link);
            }
            fetchNotifications();
            setIsOpen(false);
        } catch (err) {
            toast.error('Failed to open notification');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'BOOKING':
                return '#2563eb';
            case 'TICKET':
                return '#7c3aed';
            case 'SYSTEM':
                return '#d97706';
            default:
                return 'var(--text-secondary)';
        }
    };

    const isNotificationRead = (notif) => {
        if (!notif) return false;
        if (typeof notif.isRead === 'boolean') return notif.isRead;
        if (typeof notif.read === 'boolean') return notif.read;
        return false;
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            fetchNotifications();
            toast.success('All marked as read');
        } catch (err) {
            toast.error('Failed to mark all as read');
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full p-0 sm:max-w-md">
                <SheetHeader className="border-b px-4 py-3">
                    <div className="flex items-center justify-between pr-10">
                        <SheetTitle>Notifications</SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                                <MailOpen className="mr-1 size-4" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                <div className="max-h-[calc(100vh-80px)] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((notif) => {
                            const isRead = isNotificationRead(notif);
                            return (
                            <div
                                key={notif.id}
                                className={`border-b px-4 py-3 transition-colors ${
                                    isRead
                                        ? 'bg-transparent'
                                        : 'border-l-4 border-l-primary bg-primary/10 dark:bg-primary/15'
                                }`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            <span
                                                className="rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide"
                                                style={{
                                                    color: getTypeColor(notif.type),
                                                    borderColor: getTypeColor(notif.type),
                                                }}
                                            >
                                                {notif.type || 'GENERAL'}
                                            </span>
                                            {!isRead && (
                                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                                    Unread
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenNotification(notif)}
                                            className={`mb-1 block text-left text-sm leading-5 ${notif.link ? 'cursor-pointer hover:underline' : 'cursor-default'} ${isRead ? 'text-muted-foreground' : 'text-foreground'}`}
                                        >
                                            {notif.message}
                                        </button>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(notif.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    {!isRead && (
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            title="Mark as read"
                                        >
                                            <Check className="size-4 text-emerald-600" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            );
                        })
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
