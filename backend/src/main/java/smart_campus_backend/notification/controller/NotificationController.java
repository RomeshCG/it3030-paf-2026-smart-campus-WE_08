package smart_campus_backend.notification.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import smart_campus_backend.auth.entity.User;
import smart_campus_backend.auth.repository.UserRepository;
import smart_campus_backend.notification.entity.Notification;
import smart_campus_backend.notification.service.NotificationService;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        return ResponseEntity.ok(notificationService.getMyNotifications(user));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        return ResponseEntity.ok(notificationService.getUnreadCount(user));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userDetails != null ? getUserByEmail(userDetails.getUsername()) : getDefaultUser();
        notificationService.markAllAsRead(user);
        return ResponseEntity.ok().build();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseGet(this::getDefaultUser);
    }

    private User getDefaultUser() {
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new RuntimeException("No users available for demo"));
    }
}
