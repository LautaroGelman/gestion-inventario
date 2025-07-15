package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.MonthClosure;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MonthClosureRepository
        extends JpaRepository<MonthClosure, Long> {

    boolean existsByUniqueKey(String uniqueKey);

    Optional<MonthClosure> findByClientIdAndYearAndMonth(
            Long clientId, int year, int month);
}
