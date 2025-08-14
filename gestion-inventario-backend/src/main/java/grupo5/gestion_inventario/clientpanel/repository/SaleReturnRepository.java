// backend/src/main/java/grupo5/gestion_inventario/clientpanel/repository/SaleReturnRepository.java
package grupo5.gestion_inventario.clientpanel.repository;

import grupo5.gestion_inventario.clientpanel.model.SaleReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleReturnRepository extends JpaRepository<SaleReturn, Long> {

    /* ============================================================
     *  FILTRO POR SUCURSAL  (versión multi-sucursal)
     * ============================================================ */
    @Query("""
        SELECT sr FROM SaleReturn sr
        WHERE sr.sale.sucursal.id = :sucursalId
          AND (:saleId IS NULL OR sr.sale.id = :saleId)
          AND (:from   IS NULL OR sr.returnDate >= :from)
          AND (:to     IS NULL OR sr.returnDate <= :to)
        ORDER BY sr.returnDate DESC
    """)
    List<SaleReturn> findByFiltersSucursal(@Param("sucursalId") Long sucursalId,
                                           @Param("saleId")     Long saleId,
                                           @Param("from")       LocalDateTime from,
                                           @Param("to")         LocalDateTime to);

    /* ============================================================
     *  LEGACY — FILTRO POR CLIENTE
     *  (mantenlo comentado mientras completes la migración)
     * ============================================================
     *
     * @Query("""
     *     SELECT sr FROM SaleReturn sr
     *     WHERE sr.client.id = :clientId
     *       AND (:saleId IS NULL OR sr.sale.id = :saleId)
     *       AND (:from IS NULL OR sr.returnDate >= :from)
     *       AND (:to   IS NULL OR sr.returnDate <= :to)
     *     ORDER BY sr.returnDate DESC
     * """)
     * List<SaleReturn> findByFilters(@Param("clientId") Long clientId,
     *                                @Param("saleId")   Long saleId,
     *                                @Param("from")     LocalDateTime from,
     *                                @Param("to")       LocalDateTime to);
     */
}
