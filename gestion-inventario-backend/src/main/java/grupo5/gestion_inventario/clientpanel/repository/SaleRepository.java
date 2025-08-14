// backend/src/main/java/grupo5/gestion_inventario/clientpanel/repository/SaleRepository.java
package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.dto.SalesByEmployeeDTO;
import grupo5.gestion_inventario.clientpanel.model.Sale;
import grupo5.gestion_inventario.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    /* ------------------------------------------------------------------
     *  NUEVOS MÉTODOS  —  FILTRO POR SUCURSAL
     * ------------------------------------------------------------------ */

    Optional<Sale> findByIdAndSucursalId(Long id, Long sucursalId);

    List<Sale> findBySucursalId(Long sucursalId);

    @Query("""
        SELECT COUNT(s) FROM Sale s
        WHERE s.sucursal.id = :sucursalId
          AND s.createdAt   >= :from
          AND s.createdAt   <  :to
    """)
    long countBetweenSucursal(@Param("sucursalId") Long sucursalId,
                              @Param("from")       LocalDateTime from,
                              @Param("to")         LocalDateTime to);

    @Query(value = """
        SELECT DATE(created_at)                       AS fecha,
               COUNT(*)                               AS ventas,
               COALESCE(SUM(total_amount),0)          AS importe
        FROM sale
        WHERE sucursal_id = :sucursalId
          AND created_at  >= :startDate
        GROUP BY fecha
        ORDER BY fecha
    """, nativeQuery = true)
    List<Object[]> findDailySummarySucursalNative(@Param("sucursalId") Long sucursalId,
                                                  @Param("startDate")  LocalDateTime startDate);

    @Query(value = """
        SELECT DATE(s.created_at)                       AS sale_date,
               COALESCE(SUM(s.total_amount), 0)         AS total_revenue,
               COALESCE(SUM(si.quantity * p.cost), 0)   AS total_cost_of_goods
        FROM sale s
          JOIN sale_item si ON s.id  = si.sale_id
          JOIN product    p ON si.product_id = p.id
        WHERE s.sucursal_id = :sucursalId
          AND s.created_at  >= :startDate
        GROUP BY sale_date
        ORDER BY sale_date
    """, nativeQuery = true)
    List<Object[]> findDailyProfitabilitySummarySucursalNative(@Param("sucursalId") Long sucursalId,
                                                               @Param("startDate")  LocalDateTime startDate);

    @Query("""
        SELECT new grupo5.gestion_inventario.clientpanel.dto.SalesByEmployeeDTO(
                   e.id, e.name, SUM(s.totalAmount), COUNT(s))
        FROM Sale s
          JOIN s.employee e
        WHERE s.sucursal.id = :sucursalId
          AND s.createdAt   BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name
        ORDER BY SUM(s.totalAmount) DESC
    """)
    List<SalesByEmployeeDTO> findSalesByEmployeeSucursal(@Param("sucursalId") Long sucursalId,
                                                         @Param("startDate")  LocalDateTime startDate,
                                                         @Param("endDate")    LocalDateTime endDate);

    /* ------------------------------------------------------------------
     *  OPCIONAL: SUMA DE VENTAS POR EMPLEADO (misma sucursal)
     * ------------------------------------------------------------------ */
    @Query("""
        SELECT COALESCE(SUM(s.totalAmount), 0)
        FROM Sale s
        WHERE s.employee.id  = :employeeId
          AND s.sucursal.id  = :sucursalId
          AND s.createdAt    BETWEEN :startDate AND :endDate
    """)
    BigDecimal sumTotalAmountByEmployeeAndDateBetween(@Param("employeeId") Long employeeId,
                                                      @Param("sucursalId") Long sucursalId,
                                                      @Param("startDate")  LocalDateTime startDate,
                                                      @Param("endDate")    LocalDateTime endDate);

    /* ------------------------------------------------------------------
     *  MÉTODOS LEGACY (basados en clientId) — ELIMÍNALOS CUANDO MIGRES TODO
     * ------------------------------------------------------------------ */

    @Deprecated Optional<Sale> findByIdAndClientId(Long id, Long clientId);
    @Deprecated List<Sale> findByClientId(Long clientId);
    @Deprecated List<Sale> findByClient(Client client);

    @Query("""
        SELECT COUNT(s) FROM Sale s
        WHERE s.client.id  = :clientId
          AND s.createdAt  >= :from
          AND s.createdAt  <  :to
    """)
    @Deprecated
    long countBetween(@Param("clientId") Long clientId,
                      @Param("from")     LocalDateTime from,
                      @Param("to")       LocalDateTime to);

    @Query(value = """
        SELECT DATE(created_at) AS fecha,
               COUNT(*)         AS ventas,
               COALESCE(SUM(total_amount),0) AS importe
        FROM sale
        WHERE client_id = :clientId
          AND created_at >= :startDate
        GROUP BY fecha
        ORDER BY fecha
    """, nativeQuery = true)
    @Deprecated
    List<Object[]> findDailySummaryNative(@Param("clientId") Long clientId,
                                          @Param("startDate") LocalDateTime startDate);

    @Query(value = """
        SELECT DATE(s.created_at)                     AS sale_date,
               COALESCE(SUM(s.total_amount), 0)       AS total_revenue,
               COALESCE(SUM(si.quantity * p.cost), 0) AS total_cost_of_goods
        FROM sale s
          JOIN sale_item si ON s.id = si.sale_id
          JOIN product    p ON si.product_id = p.id
        WHERE s.client_id = :clientId
          AND s.created_at >= :startDate
        GROUP BY sale_date
        ORDER BY sale_date
    """, nativeQuery = true)
    @Deprecated
    List<Object[]> findDailyProfitabilitySummaryNative(@Param("clientId") Long clientId,
                                                       @Param("startDate") LocalDateTime startDate);

    @Query("""
        SELECT new grupo5.gestion_inventario.clientpanel.dto.SalesByEmployeeDTO(
                   e.id, e.name, SUM(s.totalAmount), COUNT(s))
        FROM Sale s
          JOIN s.employee e
        WHERE s.client.id = :clientId
          AND s.createdAt BETWEEN :startDate AND :endDate
        GROUP BY e.id, e.name
        ORDER BY SUM(s.totalAmount) DESC
    """)
    @Deprecated
    List<SalesByEmployeeDTO> findSalesByEmployee(@Param("clientId")  Long clientId,
                                                 @Param("startDate") LocalDateTime startDate,
                                                 @Param("endDate")   LocalDateTime endDate);
}
