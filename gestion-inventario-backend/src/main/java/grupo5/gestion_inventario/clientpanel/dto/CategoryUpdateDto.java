package grupo5.gestion_inventario.clientpanel.dto;

/** Cambios parciales; los campos null se ignoran. */
public record CategoryUpdateDto(
        String  name,
        Boolean defaultCategory
) {}

