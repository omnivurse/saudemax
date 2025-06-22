import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  User,
  Headphones,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  member_profile_id: string;
}

interface SupportMessage {
  id: string;
  support_ticket_id: string;
  sender_role: 'member' | 'staff';
  message: string;
  created_at: string;
}

export const SupportMessagesModule: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMemberProfile = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Get the member profile ID - use limit(1) instead of single()
        const { data: profileData, error: profileError } = await supabase
          .from('member_profiles')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (profileError) {
          throw profileError;
        }

        if (!profileData || profileData.length === 0) {
          console.warn("No member profile found for user", user.id);
          throw new Error('Member profile not found');
        }

        setMemberProfileId(profileData[0].id);
        return profileData[0].id;
      } catch (err: any) {
        console.error('Error fetching member profile:', err);
        setError(err.message || 'Failed to load member profile');
        return null;
      }
    };

    const fetchTickets = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileId = await fetchMemberProfile();
        if (!profileId) return;

        // Fetch support tickets
        const { data: ticketsData, error: ticketsError } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('member_profile_id', profileId)
          .order('created_at', { ascending: false });

        if (ticketsError) {
          throw ticketsError;
        }

        setTickets(ticketsData || []);

        // Set active ticket to the most recent one if available
        if (ticketsData && ticketsData.length > 0) {
          setActiveTicket(ticketsData[0]);
          await fetchMessages(ticketsData[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching support tickets:', err);
        setError(err.message || 'Failed to load support tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const fetchMessages = async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: messagesData, error: messagesError } = await supabase
        .from('support_messages')
        .select('*')
        .eq('support_ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw messagesError;
      }

      setMessages(messagesData || []);
    } catch (err: any) {
      console.error('Error fetching support messages:', err);
      setError(err.message || 'Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeTicket || !memberProfileId) return;

    try {
      setSendingMessage(true);
      setError(null);

      // Insert new message
      const { data: messageData, error: messageError } = await supabase
        .from('support_messages')
        .insert({
          support_ticket_id: activeTicket.id,
          sender_role: 'member',
          message: newMessage.trim()
        })
        .select()
        .single();

      if (messageError) {
        throw messageError;
      }

      // Update messages list
      setMessages(prev => [...prev, messageData]);
      setNewMessage('');

      // Scroll to bottom
      scrollToBottom();
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !memberProfileId) return;

    try {
      setCreatingTicket(true);
      setError(null);

      // Generate a ticket number
      const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

      // Insert new ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          member_profile_id: memberProfileId,
          subject: newTicketSubject.trim(),
          status: 'open',
          ticket_number: ticketNumber
        })
        .select()
        .single();

      if (ticketError) {
        throw ticketError;
      }

      // Insert initial message
      const { error: messageError } = await supabase
        .from('support_messages')
        .insert({
          support_ticket_id: ticketData.id,
          sender_role: 'member',
          message: newTicketMessage.trim()
        });

      if (messageError) {
        throw messageError;
      }

      // Update tickets list and set active ticket
      setTickets(prev => [ticketData, ...prev]);
      setActiveTicket(ticketData);
      await fetchMessages(ticketData.id);

      // Reset form and close modal
      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicketModal(false);
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      setError(err.message || 'Failed to create support ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    await fetchMessages(ticket.id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <MessageCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">New Support Ticket</h3>
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={newTicketMessage}
                    onChange={(e) => setNewTicketMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Please describe your issue in detail"
                    rows={5}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewTicketModal(false)}
                    disabled={creatingTicket}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCreateTicket}
                    loading={creatingTicket}
                    disabled={creatingTicket || !newTicketSubject.trim() || !newTicketMessage.trim()}
                  >
                    Create Ticket
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Support Interface */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tickets List (Left Column) */}
        <div className="lg:col-span-1">
          <Card className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Tickets</h3>
              <Button size="sm" onClick={() => setShowNewTicketModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </div>

            {loading && tickets.length === 0 ? (
              <div className="flex justify-center items-center flex-grow">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
                <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Tickets Yet</h4>
                <p className="text-gray-600 mb-4">Create your first support ticket to get help from our team.</p>
                <Button onClick={() => setShowNewTicketModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-grow">
                {tickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  const isActive = activeTicket?.id === ticket.id;
                  
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(ticket.status)}`}>
                          <StatusIcon />
                          <span>{ticket.status.replace('_', ' ').charAt(0).toUpperCase() + ticket.status.replace('_', ' ').slice(1)}</span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Created: {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Message Thread (Right Panel) */}
        <div className="lg:col-span-2">
          <Card className="p-0 h-full flex flex-col">
            {!activeTicket ? (
              <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
                <MessageCircle className="w-16 h-16 text-gray-400 mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No Ticket Selected</h4>
                <p className="text-gray-600 mb-4">Select a ticket from the list or create a new one to start a conversation.</p>
                <Button onClick={() => setShowNewTicketModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </div>
            ) : (
              <>
                {/* Ticket Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{activeTicket.subject}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(activeTicket.status)}`}>
                          {getStatusIcon(activeTicket.status)}
                          <span className="ml-1">{activeTicket.status.replace('_', ' ').charAt(0).toUpperCase() + activeTicket.status.replace('_', ' ').slice(1)}</span>
                        </span>
                        <span className="text-xs text-gray-500 ml-3">
                          Created: {format(new Date(activeTicket.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h4>
                      <p className="text-gray-600">Start the conversation by sending a message.</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMember = message.sender_role === 'member';
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMember ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex max-w-xs lg:max-w-md ${isMember ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isMember ? 'ml-2 bg-blue-100' : 'mr-2 bg-gray-100'
                            }`}>
                              {isMember ? (
                                <User className="w-4 h-4 text-blue-700" />
                              ) : (
                                <Headphones className="w-4 h-4 text-gray-700" />
                              )}
                            </div>
                            <div>
                              <div className={`rounded-lg px-4 py-2 ${
                                isMember 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(message.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      loading={sendingMessage}
                      className="self-end"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Help Section */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Support Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Response Times</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• General inquiries: 24-48 hours</li>
              <li>• Billing questions: 24 hours</li>
              <li>• Share request issues: 48-72 hours</li>
              <li>• Technical support: 24 hours</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Other Ways to Reach Us</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Phone: (555) 123-4567</li>
              <li>• Email: support@saudemax.com</li>
              <li>• Hours: Monday-Friday, 9am-5pm ET</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};