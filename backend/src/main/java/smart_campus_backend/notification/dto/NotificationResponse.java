package smart_campus_backend.notification.dto;

import lombok.Builder;
import lombok.Value;
import smart_campus_backend.notification.entity.NotificationType;

import java.time.LocalDateTime;

@Value
@Builder
public class NotificationResponse {
    Long id;
    String message;
    NotificationType type;
    String link;
    boolean isRead;
    LocalDateTime timestamp;
}
