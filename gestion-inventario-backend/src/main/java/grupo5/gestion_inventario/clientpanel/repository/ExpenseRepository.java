// src/main/java/grupo5/gestion_inventario/clientpanel/repository/ExpenseRepository.java
package grupo5.gestion_inventario.clientpanel.repository;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import grupo5.gestion_inventario.clientpanel.model.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    /**
     * Devuelve todos los gastos de un cliente.
     */
    List<Expense> findByClientId(Long clientId);

    /**
     * Recupera todos los movimientos de un cliente en un rango de fechas,
     * ordenados cronológicamente.
     *
     * @param clientId ID del cliente
     * @param from     fecha de inicio (inclusive)
     * @param to       fecha de fin   (inclusive)
     * @return lista de Expense ordenados por fecha ascendente
     */
    List<Expense> findByClientIdAndDateBetweenOrderByDateAsc(
            Long clientId,
            LocalDate from,
            LocalDate to
    );

    List<Expense> findBySucursalId(Long sucursalId);
}
