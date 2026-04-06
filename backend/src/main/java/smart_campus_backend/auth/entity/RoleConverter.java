package smart_campus_backend.auth.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        return role == null ? Role.USER.name() : role.name();
    }

    @Override
    public Role convertToEntityAttribute(String dbValue) {
        return Role.fromStoredValue(dbValue);
    }
}
