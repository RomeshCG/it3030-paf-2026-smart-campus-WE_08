package smart_campus_backend.modulec.ticket;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_backend.modulec.ticket.dto.*;

import java.util.List;

public interface TicketService {

    TicketResponse createTicket(CreateTicketRequest request, Authentication authentication);

    Page<TicketResponse> listMyTickets(Pageable pageable, Authentication authentication);

    Page<TicketResponse> listTickets(Pageable pageable, Authentication authentication);

    TicketResponse getTicket(Long id, Authentication authentication);

    TicketResponse updateStatus(Long id, UpdateTicketStatusRequest request, Authentication authentication);

    TicketResponse assignTechnician(Long id, AssignTechnicianRequest request, Authentication authentication);

    List<TechnicianOptionResponse> listAssignableTechnicians(Authentication authentication);

    TicketResponse rejectTicket(Long id, RejectTicketRequest request, Authentication authentication);

    CommentResponse addComment(Long ticketId, AddCommentRequest request, Authentication authentication);

    CommentResponse updateComment(Long ticketId, Long commentId, UpdateCommentRequest request,
                                    Authentication authentication);

    void deleteComment(Long ticketId, Long commentId, Authentication authentication);

    AttachmentResponse addAttachment(Long ticketId, MultipartFile file, Authentication authentication);

    void deleteAttachment(Long ticketId, Long attachmentId, Authentication authentication);
}
