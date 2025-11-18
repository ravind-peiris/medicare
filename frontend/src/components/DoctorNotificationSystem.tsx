import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  BellRing, 
  Calendar, 
  User, 
  FileText, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  CheckCheck
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'appointment' | 'patient_update' | 'system' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  metadata?: {
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
  };
}

const DoctorNotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time updates (WebSocket or polling)
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mock notifications for now
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'appointment',
          priority: 'high',
          title: 'New Appointment Request',
          message: 'John Doe has requested an appointment for tomorrow at 2:00 PM for a follow-up consultation.',
          timestamp: new Date().toISOString(),
          read: false,
          actionRequired: true,
          actionUrl: '/appointments',
          metadata: {
            appointmentId: 'apt-1',
            patientId: 'patient-1',
            patientName: 'John Doe'
          }
        },
        {
          id: '2',
          type: 'patient_update',
          priority: 'medium',
          title: 'Patient Information Updated',
          message: 'Jane Smith has updated her medical information including new allergies.',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          actionRequired: false,
          actionUrl: '/patients',
          metadata: {
            patientId: 'patient-2',
            patientName: 'Jane Smith'
          }
        },
        {
          id: '3',
          type: 'reminder',
          priority: 'medium',
          title: 'Upcoming Appointment',
          message: 'You have an appointment with Robert Johnson in 30 minutes.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: false,
          actionRequired: false,
          metadata: {
            patientId: 'patient-3',
            patientName: 'Robert Johnson'
          }
        },
        {
          id: '4',
          type: 'system',
          priority: 'low',
          title: 'System Maintenance',
          message: 'Scheduled system maintenance will occur tonight from 2:00 AM to 4:00 AM.',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          actionRequired: false
        },
        {
          id: '5',
          type: 'appointment',
          priority: 'urgent',
          title: 'Appointment Cancellation',
          message: 'Emergency: Patient Maria Garcia has cancelled her appointment due to a medical emergency.',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          read: false,
          actionRequired: true,
          actionUrl: '/appointments',
          metadata: {
            appointmentId: 'apt-2',
            patientId: 'patient-4',
            patientName: 'Maria Garcia'
          }
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-5 h-5" />;
      case 'patient_update':
        return <User className="w-5 h-5" />;
      case 'system':
        return <Settings className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const urgentNotifications = notifications.filter(n => n.priority === 'urgent' && !n.read);
  const appointmentNotifications = notifications.filter(n => n.type === 'appointment');
  const systemNotifications = notifications.filter(n => n.type === 'system');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BellRing className="w-6 h-6" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </h2>
          <p className="text-gray-600">Stay updated with important alerts and reminders</p>
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Urgent Alerts */}
      {urgentNotifications.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Urgent:</strong> You have {urgentNotifications.length} urgent notification(s) requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              New notifications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              High priority alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              Appointment related
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              System messages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent ({urgentNotifications.length})</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointmentNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No notifications</p>
                  <p className="text-sm text-gray-400 mt-2">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              notifications.map((notification) => (
                <Card key={notification.id} className={`transition-colors ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{notification.title}</h3>
                              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {notification.actionRequired && (
                                <Badge variant="destructive">Action Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.metadata?.patientName && (
                                <span>• Patient: {notification.metadata.patientName}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            {notification.actionUrl && (
                              <Button size="sm">
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <div className="space-y-4">
            {unreadNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No unread notifications</p>
                  <p className="text-sm text-gray-400 mt-2">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              unreadNotifications.map((notification) => (
                <Card key={notification.id} className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{notification.title}</h3>
                              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {notification.actionRequired && (
                                <Badge variant="destructive">Action Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.metadata?.patientName && (
                                <span>• Patient: {notification.metadata.patientName}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Read
                            </Button>
                            {notification.actionUrl && (
                              <Button size="sm">
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <div className="space-y-4">
            {urgentNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No urgent notifications</p>
                </CardContent>
              </Card>
            ) : (
              urgentNotifications.map((notification) => (
                <Card key={notification.id} className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-red-100 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-red-900">{notification.title}</h3>
                              <Badge variant="destructive">URGENT</Badge>
                            </div>
                            <p className="text-sm text-red-700 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-red-600">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.metadata?.patientName && (
                                <span>• Patient: {notification.metadata.patientName}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Read
                            </Button>
                            {notification.actionUrl && (
                              <Button size="sm" variant="destructive">
                                Take Action
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <div className="space-y-4">
            {appointmentNotifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointment notifications</p>
                </CardContent>
              </Card>
            ) : (
              appointmentNotifications.map((notification) => (
                <Card key={notification.id} className={!notification.read ? 'bg-blue-50 border-blue-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{notification.title}</h3>
                              <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              {notification.actionRequired && (
                                <Badge variant="destructive">Action Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatTimestamp(notification.timestamp)}</span>
                              {notification.metadata?.patientName && (
                                <span>• Patient: {notification.metadata.patientName}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            {notification.actionUrl && (
                              <Button size="sm">
                                View Appointment
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorNotificationSystem;
