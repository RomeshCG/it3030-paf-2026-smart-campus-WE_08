package smart_campus_backend.modulec.ticket.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class TicketForbiddenException extends RuntimeException {

    public TicketForbiddenException(String message) {
        super(message);
    }
}
