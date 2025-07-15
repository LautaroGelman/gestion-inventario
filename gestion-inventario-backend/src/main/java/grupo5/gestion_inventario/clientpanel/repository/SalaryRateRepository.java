package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.SalaryRate;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SalaryRateRepository
        extends JpaRepository<SalaryRate, Long> {

    /** Última tarifa vigente antes (o en) la fecha dada. */
    @Query("""
        SELECT sr FROM SalaryRate sr
         WHERE sr.employee.id = :employeeId
           AND sr.effectiveFrom <= :cutOff
         ORDER BY sr.effectiveFrom DESC
    """)
    Optional<SalaryRate> findTopByEmployeeIdAndDate(
            @Param("employeeId") Long employeeId,
            @Param("cutOff") LocalDate cutOff);
}
