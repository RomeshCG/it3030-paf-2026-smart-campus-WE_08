package smart_campus_backend.auth.entity;

public enum Role {
    USER,
    ADMIN,
    TECHNICIAN,
    SUPER_ADMIN;

    public String asAuthority() {
        return "ROLE_" + this.name();
    }

    public static Role fromStoredValue(String value) {
        if (value == null || value.isBlank()) {
            return USER;
        }
        String normalized = value.trim().toUpperCase();
        if (normalized.startsWith("ROLE_")) {
            normalized = normalized.substring(5);
        }
        return Role.valueOf(normalized);
    }
}
