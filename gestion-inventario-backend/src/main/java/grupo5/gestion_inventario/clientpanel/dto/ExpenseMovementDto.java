package grupo5.gestion_inventario.clientpanel.dto;

import grupo5.gestion_inventario.clientpanel.model.Expense;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Movimiento consolidado para reportes financieros. */
public record ExpenseMovementDto(
        LocalDate   date,
        String      category,
        BigDecimal  amount,
        Long        employeeId,
        String      description
) {
    public static ExpenseMovementDto fromEntity(Expense e) {
        return new ExpenseMovementDto(
                e.getDate(),
                e.getCategory().getName(),
                e.getAmount(),
                e.getEmployee() == null ? null : e.getEmployee().getId(),
                e.getDescription()
        );
    }
}
