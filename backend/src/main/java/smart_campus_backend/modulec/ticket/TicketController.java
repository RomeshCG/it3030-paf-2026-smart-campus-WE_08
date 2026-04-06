package smart_campus_backend.modulec.ticket;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_backend.modulec.ticket.dto.*;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private static final int MAX_PAGE_SIZE = 100;

    private final TicketService ticketService;

    private static PageRequest toPageRequest(int page, int size) {
        int p = Math.max(0, page);
        int s = Math.min(Math.max(1, size), MAX_PAGE_SIZE);
        return PageRequest.of(p, s);
    }

    @PostMapping
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.createTicket(request, authentication));
    }

    @GetMapping("/my")
    public ResponseEntity<Page<TicketResponse>> listMyTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.listMyTickets(toPageRequest(page, size), authentication)
        );
    }

    @GetMapping
    public ResponseEntity<Page<TicketResponse>> listTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.listTickets(toPageRequest(page, size), authentication)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketResponse> getTicket(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.getTicket(id, authentication));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketStatusRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request, authentication));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<TicketResponse> assignTechnician(
            @PathVariable Long id,
            @Valid @RequestBody AssignTechnicianRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.assignTechnician(id, request, authentication));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<TicketResponse> rejectTicket(
            @PathVariable Long id,
            @Valid @RequestBody RejectTicketRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.rejectTicket(id, request, authentication));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.addComment(id, request, authentication));
    }

    @PutMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                ticketService.updateComment(ticketId, commentId, request, authentication)
        );
    }

    @DeleteMapping("/{ticketId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long ticketId,
            @PathVariable Long commentId,
            Authentication authentication
    ) {
        ticketService.deleteComment(ticketId, commentId, authentication);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(path = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> addAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        return ResponseEntity.ok(ticketService.addAttachment(id, file, authentication));
    }

    @DeleteMapping("/{ticketId}/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long ticketId,
            @PathVariable Long attachmentId,
            Authentication authentication
    ) {
        ticketService.deleteAttachment(ticketId, attachmentId, authentication);
        return ResponseEntity.noContent().build();
    }
}
