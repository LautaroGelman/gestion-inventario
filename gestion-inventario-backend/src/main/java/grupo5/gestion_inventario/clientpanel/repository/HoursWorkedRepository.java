package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoursWorkedRepository
        extends JpaRepository<HoursWorked, Long> {

    Optional<HoursWorked> findByEmployeeIdAndYearAndMonth(
            Long employeeId, int year, int month);
}
