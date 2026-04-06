import api from '@/lib/api';

/**
 * Module C – tickets API (paths match backend exactly).
 */
export const ticketsApi = {
  createTicket(body) {
    return api.post('/api/tickets', body);
  },

  listMyTickets(params) {
    return api.get('/api/tickets/my', { params });
  },

  listTickets(params) {
    return api.get('/api/tickets', { params });
  },

  getTicket(id) {
    return api.get(`/api/tickets/${id}`);
  },

  updateStatus(id, body) {
    return api.patch(`/api/tickets/${id}/status`, body);
  },

  assignTechnician(id, body) {
    return api.patch(`/api/tickets/${id}/assign`, body);
  },

  rejectTicket(id, body) {
    return api.patch(`/api/tickets/${id}/reject`, body);
  },

  addComment(ticketId, body) {
    return api.post(`/api/tickets/${ticketId}/comments`, body);
  },

  updateComment(ticketId, commentId, body) {
    return api.put(`/api/tickets/${ticketId}/comments/${commentId}`, body);
  },

  deleteComment(ticketId, commentId) {
    return api.delete(`/api/tickets/${ticketId}/comments/${commentId}`);
  },

  addAttachment(ticketId, file) {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/api/tickets/${ticketId}/attachments`, form);
  },

  deleteAttachment(ticketId, attachmentId) {
    return api.delete(`/api/tickets/${ticketId}/attachments/${attachmentId}`);
  },
};

export const TICKET_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
export const TICKET_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];
export const TICKET_CATEGORY = [
  'HARDWARE',
  'SOFTWARE',
  'NETWORK',
  'ELECTRICAL',
  'FACILITY',
  'OTHER',
];
