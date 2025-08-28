package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /* ============================================================
     *  MULTI-SUCURSAL
     * ============================================================ */

    /** Inventario activo de una sucursal (filtrado por @Where(active = TRUE)) */
    List<Product> findBySucursalId(Long sucursalId);

    /** Buscar producto por código dentro de una sucursal */
    Optional<Product> findBySucursalIdAndCode(Long sucursalId, String code);

    /** Verificar existencia de un código dentro de una sucursal */
    boolean existsBySucursalIdAndCode(Long sucursalId, String code);

    /** Todos los productos de una sucursal, incluyendo soft-deleted (omite @Where) */
    @Query(value = """
        SELECT *
        FROM product
        WHERE sucursal_id = :sucursalId
        ORDER BY name ASC
        """, nativeQuery = true)
    List<Product> findAllIncludingDeletedBySucursal(@Param("sucursalId") Long sucursalId);

    /** Productos eliminados lógicamente de la sucursal (omite @Where) */
    @Query(value = """
        SELECT *
        FROM product
        WHERE sucursal_id = :sucursalId
          AND active = 0
        ORDER BY name ASC
        """, nativeQuery = true)
    List<Product> findDeletedBySucursalId(@Param("sucursalId") Long sucursalId);

    /** Restaurar (soft-undelete) un producto de la sucursal */
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE product
           SET active = 1
         WHERE id          = :productId
           AND sucursal_id = :sucursalId
        """, nativeQuery = true)
    void restore(@Param("sucursalId") Long sucursalId,
                 @Param("productId") Long productId);

    /** Conteo de productos en o por debajo del umbral de quantity bajo (sólo activos por @Where) */
    @Query("""
        SELECT COUNT(p) FROM Product p
         WHERE p.sucursal.id = :sucursalId
           AND p.quantity    <= p.lowStockThreshold
        """)
    long countLowStock(@Param("sucursalId") Long sucursalId);

    /* ============================================================
     *  UTILIDADES
     * ============================================================ */

    /** Búsqueda global por código (si hiciera falta a nivel cliente) */
    Optional<Product> findByCode(String code);

    /** Listado por cliente navegando relación sucursal → client (para reportes) */
    List<Product> findBySucursalClientId(Long clientId);

    @Query("""
      select p from Product p
       where p.sucursal.id = :sucursalId
         and p.preferredProvider.id = :providerId
         and p.lowStockThreshold is not null
         and p.quantity <= p.lowStockThreshold
    """)
    List<Product> findLowStockPreferred(@Param("sucursalId") Long sucursalId,
                                        @Param("providerId") Long providerId);

    @Query("""
      select p from Product p
       where p.sucursal.id = :sucursalId
         and p.preferredProvider.id = :providerId
    """)
    List<Product> findAllBySucursalAndPreferred(@Param("sucursalId") Long sucursalId,
                                                @Param("providerId") Long providerId);

}
