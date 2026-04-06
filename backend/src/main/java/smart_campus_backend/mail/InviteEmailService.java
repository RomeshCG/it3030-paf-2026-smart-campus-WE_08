package smart_campus_backend.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
@Slf4j
public class InviteEmailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;

    public InviteEmailService(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${app.mail.from-name:Smart Campus}") String configuredFromName) {
        this.mailSender = mailSender;
        this.fromAddress = mailUsername != null ? mailUsername.trim() : "";
        this.fromName = configuredFromName != null ? configuredFromName.trim() : "Smart Campus";
    }

    public void sendAdminInvite(String toEmail, String inviteUrl, String targetRoleName, long expirationHours) {
        if (mailSender == null || fromAddress.isEmpty()) {
            log.warn("Invite email skipped: configure MAIL_USERNAME and MAIL_PASSWORD for Gmail SMTP");
            return;
        }
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(toEmail);
            helper.setSubject("Smart Campus - admin invite");
            helper.setText(
                    "You have been invited to join Smart Campus as " + targetRoleName + ".\n\n"
                            + "Open this link to complete signup (expires in " + expirationHours + " hours):\n"
                            + inviteUrl + "\n\n"
                            + "If you did not expect this email, you can ignore it.",
                    false
            );
            mailSender.send(message);
        } catch (MailException | UnsupportedEncodingException | jakarta.mail.MessagingException ex) {
            log.error("Failed to send invite email to {}: {}", toEmail, ex.getMessage());
        }
    }
}
