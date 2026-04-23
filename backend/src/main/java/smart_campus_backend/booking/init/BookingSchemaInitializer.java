package smart_campus_backend.booking.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingSchemaInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Override
    public void run(String... args) {
        if (!isMySqlDatabase()) {
            return;
        }
        ensureStatusColumnsUseVarchar();
    }

    private boolean isMySqlDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            return productName != null && productName.toLowerCase().contains("mysql");
        } catch (Exception ex) {
            log.warn("Could not determine database type for booking schema init: {}", ex.getMessage());
            return false;
        }
    }

    private void ensureStatusColumnsUseVarchar() {
        try {
            jdbcTemplate.execute("ALTER TABLE bookings MODIFY status VARCHAR(32) NOT NULL");
            jdbcTemplate.execute("ALTER TABLE booking_audits MODIFY status VARCHAR(32) NOT NULL");
            log.info("Ensured booking status columns support WAITLISTED values.");
        } catch (Exception ex) {
            log.warn("Skipping status column migration: {}", ex.getMessage());
        }
    }
}
