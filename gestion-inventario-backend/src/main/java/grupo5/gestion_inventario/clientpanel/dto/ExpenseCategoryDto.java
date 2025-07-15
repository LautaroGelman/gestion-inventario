package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;

/** DTO de salida para las categorías activas. */
public record ExpenseCategoryDto(
        Long    id,
        String  name,
        boolean defaultCategory
) {
    public static ExpenseCategoryDto fromEntity(ExpenseCategory c) {
        return new ExpenseCategoryDto(c.getId(), c.getName(), c.isDefaultCategory());
    }
}
