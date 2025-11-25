import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../context/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { markAllNotificationsAsRead, clearAllNotifications } from '../../services/notificationService';
import toast from 'react-hot-toast';
import { Trash2, CheckCircle2, X } from 'lucide-react';

export const NotificationPanel = ({ isOpen, onClose }) => {
    const { notifications, unreadCount, loading, fetchNotifications, setNotifications, setUnreadCount } = useNotification();
    const [filter, setFilter] = useState('all');
    // Ensure we have a portal root in the document body so the panel isn't trapped
    // inside other stacking contexts. Create it if missing.
    let portalRoot = null;
    if (typeof document !== 'undefined') {
        portalRoot = document.getElementById('notification-portal');
        if (!portalRoot) {
            portalRoot = document.createElement('div');
            portalRoot.id = 'notification-portal';
            document.body.appendChild(portalRoot);
        }
    }

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
            const updated = notifications.map(n => ({ ...n, isRead: true }));
            setNotifications(updated);
            setUnreadCount(0);
            toast.success('Semua notifikasi ditandai sebagai dibaca');
        } catch (err) {
            toast.error('Gagal menandai notifikasi');
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) return;

        try {
            await clearAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
            toast.success('Semua notifikasi dihapus');
        } catch (err) {
            toast.error('Gagal menghapus notifikasi');
        }
    };

    const handleItemRead = (notificationId) => {
        const updated = notifications.map(n => 
            n._id === notificationId ? { ...n, isRead: true } : n
        );
        setNotifications(updated);
        setUnreadCount(Math.max(0, unreadCount - 1));
    };

    const handleItemDelete = (notificationId) => {
        const updated = notifications.filter(n => n._id !== notificationId);
        setNotifications(updated);
        
        const deletedNotif = notifications.find(n => n._id === notificationId);
        if (deletedNotif && !deletedNotif.isRead) {
            setUnreadCount(Math.max(0, unreadCount - 1));
        }
    };

    if (!isOpen) return null;

    const panelMarkup = (
        <div className="fixed inset-0 z-[100000] pointer-events-none">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md z-[100000] pointer-events-auto"
                onClick={onClose}
                style={{ WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-black border-l border-dark-800 shadow-lg flex flex-col z-[100001] pointer-events-auto">
                {/* Header */}
                <div className="p-4 border-b border-dark-800 flex items-center justify-between sticky top-0 bg-black/95 backdrop-blur-sm">
                    <div>
                        <h2 className="text-xl font-bold text-white">Notifikasi</h2>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-400 mt-1">{unreadCount} belum dibaca</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-dark-800 rounded-full transition-colors"
                        title="Tutup"
                    >
                        <X size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 p-3 border-b border-dark-800 bg-dark-900/50 sticky top-[68px]">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            filter === 'all'
                                ? 'bg-gradient-instagram text-white'
                                : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
                        }`}
                    >
                        Semua
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            filter === 'unread'
                                ? 'bg-gradient-instagram text-white'
                                : 'bg-dark-800 text-gray-400 hover:text-white hover:bg-dark-700'
                        }`}
                    >
                        Belum Dibaca
                    </button>
                </div>

                {/* Action Buttons */}
                {notifications.length > 0 && (
                    <div className="flex gap-2 p-3 border-b border-dark-800 bg-dark-900/50">
                        <button
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-medium">Tandai Dibaca</span>
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs font-medium">Hapus Semua</span>
                        </button>
                    </div>
                )}

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500 text-sm">Memuat notifikasi...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-gray-500 text-sm">Tidak ada notifikasi</p>
                                <p className="text-gray-600 text-xs mt-1">Notifikasi akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-dark-800">
                            {filteredNotifications.map(notification => (
                                <div
                                    key={notification._id}
                                    onClick={onClose}
                                >
                                    <NotificationItem
                                        notification={notification}
                                        onRead={handleItemRead}
                                        onDelete={handleItemDelete}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (portalRoot) {
        return createPortal(panelMarkup, portalRoot);
    }

    return panelMarkup;
};
