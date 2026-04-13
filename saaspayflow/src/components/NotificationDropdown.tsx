import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, AlertCircle, DollarSign, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { clearNotifications, fetchNotifications, markNotificationRead } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuthHook';
import { Link } from 'react-router-dom';

export interface Notification {
  id: string;
  type: 'payment' | 'reminder' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

const NotificationDropdown = () => {
	const { isAuthenticated } = useAuth();
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) {
			setNotifications([]);
			return;
		}
		setLoading(true);
		fetchNotifications(20)
			.then(({ notifications: items }) => {
				setNotifications(
					items.map((n) => ({
						id: n.id,
						type: (n.type as Notification['type']) || 'alert',
						title: n.title,
						message: n.message,
						timestamp: new Date(n.created_at),
						read: n.is_read,
					}))
				);
			})
			.catch(() => setNotifications([]))
			.finally(() => setLoading(false));
	}, [isAuthenticated]);

	const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

	const hasUnread = unreadCount > 0;

	const markAsRead = (id: string) => {
		setNotifications((prev) => prev.map((n) => (n.id === id && !n.read ? { ...n, read: true } : n)));
		markNotificationRead(id).catch(() => {
			// optimistic update only
		});
	};

	const removeNotification = (id: string) => {
		setNotifications((prev) => prev.filter((n) => n.id !== id));
	};

	const clearAll = () => {
		setNotifications([]);
		clearNotifications().catch(() => {
			// optimistic update only
		});
	};

	const getIcon = (type: string) => {
		switch (type) {
			case 'payment':
				return <DollarSign className="w-4 h-4 text-emerald-500" />;
			case 'reminder':
				return <Check className="w-4 h-4 text-slate-400" />;
			case 'alert':
				return <AlertCircle className="w-4 h-4 text-amber-500" />;
			default:
				return <Bell className="w-4 h-4 text-slate-400" />;
		}
	};

	const formatTime = (date: Date) => {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button 
					variant="ghost" 
					size="icon"
					className="relative text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
					aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
				>
					<Bell className="w-5 h-5" />
					{hasUnread && (
						<span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs font-semibold rounded-full flex items-center justify-center animate-pulse">
							{unreadCount > 9 ? '9+' : unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80 max-h-96 p-0 rounded-lg border border-white/10 bg-[#111] shadow-lg shadow-black/50">
				{/* Header */}
				<div className="sticky top-0 bg-[#111] border-b border-white/8 px-4 py-3 z-10 flex items-center justify-between">
					<h3 className="font-semibold text-sm text-foreground">Notifications</h3>
					{notifications.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={clearAll}
							className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 font-medium"
						>
							Clear
						</Button>
					)}
				</div>

				{/* Notifications List */}
				{loading ? (
					<div className="p-8 text-center">
						<p className="text-xs font-medium text-muted-foreground">Loading...</p>
					</div>
				) : notifications.length > 0 ? (
					<div className="overflow-y-auto max-h-80">
						{notifications.map((notification) => (
							<button
								key={notification.id}
								onClick={() => markAsRead(notification.id)}
								className={`w-full px-4 py-3 text-left hover:bg-white/3 transition-colors border-b border-white/5 last:border-0 group cursor-pointer ${
									!notification.read ? 'bg-white/5' : ''
								}`}
							>
								<div className="flex gap-3 items-start">
									{/* Icon */}
									<div className="flex-shrink-0 mt-0.5">
										{getIcon(notification.type)}
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0 flex items-start justify-between gap-2">
										<div className="flex-1">
											<p className="text-sm font-medium text-foreground leading-snug">
												{notification.title}
											</p>
											<p className="text-xs text-muted-foreground mt-1 line-clamp-1">
												{notification.message}
											</p>
											<span className="text-xs text-muted-foreground/50 mt-1.5 inline-block">
												{formatTime(notification.timestamp)}
											</span>
										</div>

										{/* Delete button */}
										<Button
											variant="ghost"
											size="sm"
											onClick={(e) => {
												e.stopPropagation();
												removeNotification(notification.id);
											}}
											className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
										>
											<X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
										</Button>
									</div>
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="p-8 text-center">
						<Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
						<p className="text-xs font-medium text-muted-foreground">No notifications</p>
					</div>
				)}

				{/* Footer - View all button */}
				{notifications.length > 0 && (
					<div className="border-t border-white/8 p-3 text-center">
						<Link
							to="/notifications"
							className="text-xs font-medium text-slate-400 hover:text-foreground transition-colors"
						>
							View all
						</Link>
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default NotificationDropdown;
