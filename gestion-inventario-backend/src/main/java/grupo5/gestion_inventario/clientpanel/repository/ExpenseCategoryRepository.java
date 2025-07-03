package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.ExpenseCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseCategoryRepository
        extends JpaRepository<ExpenseCategory, Long> {

    // Listado de categorías activas del cliente
    List<ExpenseCategory> findByClientId(Long clientId);

    // Recuperar una categoría específica (para validar pertenencia)
    Optional<ExpenseCategory> findByIdAndClientId(Long id, Long clientId);

    // Verificar existencia (útil antes de crear duplicados)
    boolean existsByNameAndClientId(String name, Long clientId);

    Optional<ExpenseCategory> findByNameAndClientId(String name, Long clientId);

}
