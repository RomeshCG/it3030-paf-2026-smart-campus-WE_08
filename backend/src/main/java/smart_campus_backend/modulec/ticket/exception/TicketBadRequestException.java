package smart_campus_backend.modulec.ticket.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class TicketBadRequestException extends RuntimeException {

    public TicketBadRequestException(String message) {
        super(message);
    }
}
