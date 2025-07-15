package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExpenseTemplateRepository
        extends JpaRepository<ExpenseTemplate, Long> {

    /** Plantillas vigentes para copiar al cerrar un mes.
     *  - recurrente = true  ⇒ copiar todos los meses desde effectiveFrom
     *  - recurrente = false ⇒ copiar solo el mes en que cayó effectiveFrom
     */
    @Query("""
        SELECT t FROM ExpenseTemplate t
         WHERE t.client.id = :clientId
           AND t.effectiveFrom <= :date
           AND ( t.recurring = TRUE
              OR FUNCTION('YEAR', t.effectiveFrom) = FUNCTION('YEAR', :date)
              AND FUNCTION('MONTH', t.effectiveFrom) = FUNCTION('MONTH', :date) )
    """)
    List<ExpenseTemplate> findActiveTemplates(
            @Param("clientId") Long clientId,
            @Param("date") LocalDate date);

    /** Listar todas las plantillas del cliente (sin filtrar por fecha) */
    List<ExpenseTemplate> findByClientId(Long clientId);

}

