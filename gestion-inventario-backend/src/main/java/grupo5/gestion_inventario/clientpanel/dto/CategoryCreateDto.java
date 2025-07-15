package grupo5.gestion_inventario.clientpanel.dto;

/** Alta de categoría de gasto. */
public record CategoryCreateDto(
        String  name,
        boolean defaultCategory
) {}
