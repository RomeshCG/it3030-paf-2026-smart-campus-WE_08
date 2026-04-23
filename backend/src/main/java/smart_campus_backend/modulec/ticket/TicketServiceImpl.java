package smart_campus_backend.modulec.ticket;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import smart_campus_backend.auth.entity.Role;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.UserRepository;
import smart_campus_backend.mail.NotificationEmailService;
import smart_campus_backend.modulec.ticket.dto.*;
import smart_campus_backend.modulec.ticket.entity.Ticket;
import smart_campus_backend.modulec.ticket.entity.TicketAttachment;
import smart_campus_backend.modulec.ticket.entity.TicketComment;
import smart_campus_backend.modulec.ticket.exception.TicketBadRequestException;
import smart_campus_backend.modulec.ticket.exception.TicketForbiddenException;
import smart_campus_backend.modulec.ticket.exception.TicketNotFoundException;
import smart_campus_backend.modulec.ticket.repository.TicketAttachmentRepository;
import smart_campus_backend.modulec.ticket.repository.TicketCommentRepository;
import smart_campus_backend.modulec.ticket.repository.TicketRepository;
import smart_campus_backend.notification.entity.NotificationType;
import smart_campus_backend.notification.service.NotificationService;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;
    private static final Set<String> ALLOWED_IMAGE_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final TicketAttachmentRepository ticketAttachmentRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final NotificationService notificationService;
    private final NotificationEmailService notificationEmailService;

    @Override
    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, Authentication authentication) {
        User creator = currentUser(authentication);
        Ticket ticket = Ticket.builder()
                .title(request.getTitle().trim())
                .category(request.getCategory())
                .description(request.getDescription().trim())
                .priority(request.getPriority())
                .preferredContactDetails(trimToNull(request.getPreferredContactDetails()))
                .preferredContactMethod(
                        request.getPreferredContactMethod() != null
                                ? request.getPreferredContactMethod()
                                : TicketContactMethod.ANY
                )
                .locationOrResource(trimToNull(request.getLocationOrResource()))
                .status(TicketStatus.OPEN)
                .createdBy(creator)
                .build();
        ticket = ticketRepository.save(ticket);
        return mapTicketToResponse(ticket, true);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> listMyTickets(Pageable pageable, Authentication authentication) {
        User user = currentUser(authentication);
        return ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(t -> mapTicketToResponse(t, false));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TicketResponse> listTickets(Pageable pageable, Authentication authentication) {
        User user = currentUser(authentication);
        Page<Ticket> page;
        if (isAdmin(user)) {
            page = ticketRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else if (user.getRole() == Role.TECHNICIAN) {
            page = ticketRepository.findByAssignedTechnicianIdOrderByCreatedAtDesc(user.getId(), pageable);
        } else {
            page = ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId(), pageable);
        }
        return page.map(t -> mapTicketToResponse(t, false));
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicket(Long id, Authentication authentication) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        assertCanView(ticket, currentUser(authentication));
        return mapTicketToResponse(ticket, true);
    }

    @Override
    @Transactional
    public TicketResponse updateStatus(Long id, UpdateTicketStatusRequest request, Authentication authentication) {
        User actor = currentUser(authentication);
        if (!canUpdateStatus(actor)) {
            throw new TicketForbiddenException("You cannot update ticket status");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        assertCanView(ticket, actor);
        if (actor.getRole() == Role.TECHNICIAN && !isAdmin(actor)) {
            if (ticket.getAssignedTechnician() == null
                    || !ticket.getAssignedTechnician().getId().equals(actor.getId())) {
                throw new TicketForbiddenException("Only the assigned technician can update this ticket's status");
            }
        }
        if (request.getStatus() == TicketStatus.REJECTED) {
            throw new TicketBadRequestException("Use the reject endpoint to reject a ticket");
        }
        TicketStatus next = request.getStatus();
        validateStatusTransition(ticket.getStatus(), next);
        ticket.setStatus(next);
        if (StringUtils.hasText(request.getResolutionNotes())) {
            ticket.setResolutionNotes(request.getResolutionNotes().trim());
        }
        ticket = ticketRepository.save(ticket);
        notifyTicketStatusChanged(ticket);
        return mapTicketToResponse(ticket, true);
    }

    @Override
    @Transactional
    public TicketResponse assignTechnician(Long id, AssignTechnicianRequest request, Authentication authentication) {
        User actor = currentUser(authentication);
        if (!isAdmin(actor)) {
            throw new TicketForbiddenException("Only administrators can assign technicians");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        User technician = userRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new TicketBadRequestException("Technician user not found"));
        if (!technician.isEnabled()) {
            throw new TicketBadRequestException("Technician account is disabled");
        }
        if (technician.getRole() != Role.TECHNICIAN) {
            throw new TicketBadRequestException("Selected user is not a technician");
        }
        ticket.setAssignedTechnician(technician);
        ticket = ticketRepository.save(ticket);
        notifyTicketAssigned(ticket, technician);
        return mapTicketToResponse(ticket, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TechnicianOptionResponse> listAssignableTechnicians(Authentication authentication) {
        User actor = currentUser(authentication);
        if (!isAdmin(actor)) {
            throw new TicketForbiddenException("Only administrators can list technicians");
        }
        return userRepository.findByRoleAndEnabledTrueOrderByNameAsc(Role.TECHNICIAN)
                .stream()
                .map(u -> TechnicianOptionResponse.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse rejectTicket(Long id, RejectTicketRequest request, Authentication authentication) {
        User actor = currentUser(authentication);
        if (!isAdmin(actor)) {
            throw new TicketForbiddenException("Only administrators can reject tickets");
        }
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        TicketStatus current = ticket.getStatus();
        if (current != TicketStatus.OPEN && current != TicketStatus.IN_PROGRESS) {
            throw new TicketBadRequestException("Ticket can only be rejected from OPEN or IN_PROGRESS");
        }
        ticket.setStatus(TicketStatus.REJECTED);
        ticket.setRejectionReason(request.getReason().trim());
        ticket = ticketRepository.save(ticket);
        notifyTicketRejected(ticket);
        return mapTicketToResponse(ticket, true);
    }

    @Override
    @Transactional
    public CommentResponse addComment(Long ticketId, AddCommentRequest request, Authentication authentication) {
        User author = currentUser(authentication);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        assertCanView(ticket, author);
        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .message(request.getMessage().trim())
                .build();
        comment = ticketCommentRepository.save(comment);
        return mapComment(comment);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long ticketId, Long commentId, UpdateCommentRequest request,
                                         Authentication authentication) {
        User actor = currentUser(authentication);
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new TicketNotFoundException("Comment not found"));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new TicketNotFoundException("Comment not found");
        }
        assertCanView(comment.getTicket(), actor);
        if (!comment.getAuthor().getId().equals(actor.getId())) {
            throw new TicketForbiddenException("You can only edit your own comments");
        }
        comment.setMessage(request.getMessage().trim());
        comment = ticketCommentRepository.save(comment);
        return mapComment(comment);
    }

    @Override
    @Transactional
    public void deleteComment(Long ticketId, Long commentId, Authentication authentication) {
        User actor = currentUser(authentication);
        TicketComment comment = ticketCommentRepository.findById(commentId)
                .orElseThrow(() -> new TicketNotFoundException("Comment not found"));
        if (!comment.getTicket().getId().equals(ticketId)) {
            throw new TicketNotFoundException("Comment not found");
        }
        assertCanView(comment.getTicket(), actor);
        boolean isAuthor = comment.getAuthor().getId().equals(actor.getId());
        if (!isAuthor && !isAdmin(actor)) {
            throw new TicketForbiddenException("You cannot delete this comment");
        }
        ticketCommentRepository.delete(comment);
    }

    @Override
    @Transactional
    public AttachmentResponse addAttachment(Long ticketId, MultipartFile file, Authentication authentication) {
        if (file == null || file.isEmpty()) {
            throw new TicketBadRequestException("File is required");
        }
        User uploader = currentUser(authentication);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket not found"));
        assertCanView(ticket, uploader);
        if (ticketAttachmentRepository.countByTicketId(ticketId) >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new TicketBadRequestException("Maximum " + MAX_ATTACHMENTS_PER_TICKET + " attachments per ticket");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new TicketBadRequestException("Only image uploads are allowed (JPEG, PNG, GIF, WebP)");
        }
        String originalName = StringUtils.hasText(file.getOriginalFilename()) ? file.getOriginalFilename() : "image";
        String ext = extension(originalName);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new TicketBadRequestException("Invalid image file extension");
        }
        Map<?, ?> uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "smart-campus/tickets/" + ticketId,
                            "resource_type", "image",
                            "transformation", "f_auto,q_auto:good"
                    )
            );
        } catch (IOException e) {
            throw new TicketBadRequestException("Failed to upload file");
        }
        Object secureUrl = uploadResult.get("secure_url");
        Object publicId = uploadResult.get("public_id");
        if (secureUrl == null || publicId == null) {
            throw new TicketBadRequestException("Cloudinary upload did not return expected metadata");
        }
        TicketAttachment attachment = TicketAttachment.builder()
                .ticket(ticket)
                .fileName(safeFileName(originalName))
                .filePath(secureUrl.toString())
                .cloudinaryPublicId(publicId.toString())
                .uploadedBy(uploader)
                .build();
        attachment = ticketAttachmentRepository.save(attachment);
        return mapAttachment(attachment);
    }

    @Override
    @Transactional
    public void deleteAttachment(Long ticketId, Long attachmentId, Authentication authentication) {
        User actor = currentUser(authentication);
        TicketAttachment attachment = ticketAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new TicketNotFoundException("Attachment not found"));
        if (!attachment.getTicket().getId().equals(ticketId)) {
            throw new TicketNotFoundException("Attachment not found");
        }
        assertCanView(attachment.getTicket(), actor);
        boolean canDelete = isAdmin(actor) || attachment.getUploadedBy().getId().equals(actor.getId());
        if (!canDelete) {
            throw new TicketForbiddenException("You cannot delete this attachment");
        }
        if (StringUtils.hasText(attachment.getCloudinaryPublicId())) {
            try {
                cloudinary.uploader().destroy(
                        attachment.getCloudinaryPublicId(),
                        ObjectUtils.asMap("resource_type", "image", "invalidate", true)
                );
            } catch (Exception ignored) {
                // still remove DB row if remote delete fails
            }
        }
        ticketAttachmentRepository.delete(attachment);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            throw new TicketForbiddenException("Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new TicketForbiddenException("User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.SUPER_ADMIN;
    }

    private boolean canUpdateStatus(User user) {
        return user.getRole() == Role.TECHNICIAN || isAdmin(user);
    }

    private void assertCanView(Ticket ticket, User user) {
        if (isAdmin(user)) {
            return;
        }
        if (ticket.getCreatedBy().getId().equals(user.getId())) {
            return;
        }
        if (user.getRole() == Role.TECHNICIAN
                && ticket.getAssignedTechnician() != null
                && ticket.getAssignedTechnician().getId().equals(user.getId())) {
            return;
        }
        throw new TicketForbiddenException("You cannot access this ticket");
    }

    private void validateStatusTransition(TicketStatus current, TicketStatus next) {
        if (current == next) {
            return;
        }
        if (current == TicketStatus.CLOSED || current == TicketStatus.REJECTED) {
            throw new TicketBadRequestException("Cannot change status from " + current);
        }
        switch (current) {
            case OPEN -> {
                if (next != TicketStatus.IN_PROGRESS) {
                    throw new TicketBadRequestException("Invalid transition from OPEN to " + next);
                }
            }
            case IN_PROGRESS -> {
                // REJECTED is only applied via rejectTicket(), not PATCH /status
                if (next != TicketStatus.RESOLVED) {
                    throw new TicketBadRequestException("Invalid transition from IN_PROGRESS to " + next);
                }
            }
            case RESOLVED -> {
                if (next != TicketStatus.CLOSED) {
                    throw new TicketBadRequestException("Invalid transition from RESOLVED to " + next);
                }
            }
            default -> throw new TicketBadRequestException("Invalid status transition");
        }
    }

    private TicketResponse mapTicketToResponse(Ticket ticket, boolean includeChildren) {
        User createdBy = ticket.getCreatedBy();
        User tech = ticket.getAssignedTechnician();
        TicketResponse.TicketResponseBuilder b = TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .preferredContactDetails(ticket.getPreferredContactDetails())
                .preferredContactMethod(ticket.getPreferredContactMethod())
                .locationOrResource(ticket.getLocationOrResource())
                .status(ticket.getStatus())
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .createdById(createdBy.getId())
                .createdByName(createdBy.getName())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt());
        if (tech != null) {
            b.assignedTechnicianId(tech.getId()).assignedTechnicianName(tech.getName());
        }
        if (includeChildren) {
            List<CommentResponse> comments = ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId())
                    .stream()
                    .map(this::mapComment)
                    .collect(Collectors.toList());
            List<AttachmentResponse> attachments = ticketAttachmentRepository
                    .findByTicketIdOrderByUploadedAtAsc(ticket.getId())
                    .stream()
                    .map(this::mapAttachment)
                    .collect(Collectors.toList());
            b.comments(comments).attachments(attachments);
        } else {
            b.comments(List.of()).attachments(List.of());
        }
        return b.build();
    }

    private CommentResponse mapComment(TicketComment c) {
        return CommentResponse.builder()
                .id(c.getId())
                .authorId(c.getAuthor().getId())
                .authorName(c.getAuthor().getName())
                .message(c.getMessage())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private AttachmentResponse mapAttachment(TicketAttachment a) {
        User u = a.getUploadedBy();
        return AttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .cloudinaryPublicId(a.getCloudinaryPublicId())
                .uploadedById(u.getId())
                .uploadedByName(u.getName())
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    private String trimToNull(String s) {
        if (!StringUtils.hasText(s)) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private String extension(String filename) {
        int i = filename.lastIndexOf('.');
        if (i < 0) {
            return "";
        }
        return filename.substring(i).toLowerCase(Locale.ROOT);
    }

    private String safeFileName(String name) {
        String base = name.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (base.length() > 200) {
            base = base.substring(0, 200);
        }
        return base;
    }

    private void notifyTicketStatusChanged(Ticket ticket) {
        String message = "Your ticket #" + ticket.getId() + " (" + ticket.getTitle()
                + ") status changed to " + ticket.getStatus() + ".";
        String link = "/tickets/" + ticket.getId();
        notificationService.createNotification(ticket.getCreatedBy(), message, NotificationType.TICKET, link);
        notificationEmailService.sendNotificationEmail(
                ticket.getCreatedBy().getEmail(),
                "Ticket status updated - Smart Campus",
                message + "\n\nOpen the app to view details."
        );
    }

    private void notifyTicketAssigned(Ticket ticket, User technician) {
        String link = "/tickets/" + ticket.getId();
        String reporterMessage = "Your ticket #" + ticket.getId() + " (" + ticket.getTitle()
                + ") has been assigned to technician " + technician.getName() + ".";
        notificationService.createNotification(ticket.getCreatedBy(), reporterMessage, NotificationType.TICKET, link);
        notificationEmailService.sendNotificationEmail(
                ticket.getCreatedBy().getEmail(),
                "Ticket assigned - Smart Campus",
                reporterMessage + "\n\nOpen the app to view details."
        );

        String technicianMessage = "Ticket #" + ticket.getId() + " (" + ticket.getTitle()
                + ") has been assigned to you.";
        notificationService.createNotification(technician, technicianMessage, NotificationType.TICKET, link);
        notificationEmailService.sendNotificationEmail(
                technician.getEmail(),
                "New ticket assignment - Smart Campus",
                technicianMessage + "\n\nOpen the app to view details."
        );
    }

    private void notifyTicketRejected(Ticket ticket) {
        String message = "Your ticket #" + ticket.getId() + " (" + ticket.getTitle()
                + ") has been REJECTED. Reason: " + ticket.getRejectionReason();
        String link = "/tickets/" + ticket.getId();
        notificationService.createNotification(ticket.getCreatedBy(), message, NotificationType.TICKET, link);
        notificationEmailService.sendNotificationEmail(
                ticket.getCreatedBy().getEmail(),
                "Ticket rejected - Smart Campus",
                message + "\n\nOpen the app to view details."
        );
    }
}
