// backend/src/main/java/grupo5/gestion_inventario/repository/EmployeeRepository.java
package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /* ============================================================
     *  Búsquedas principales
     * ============================================================ */

    Optional<Employee> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Todos los empleados de una sucursal (activos o no) */
    List<Employee> findBySucursalId(Long sucursalId);

    /** Buscar empleado por cliente + rol (ej.: PROPIETARIO único) */
    Optional<Employee> findByClientIdAndRole(Long clientId, EmployeeRole role);

    /* ============================================================
     *  LEGACY — métodos basados solo en clientId
     *  (mantén mientras completes la migración; luego elimínalos)
     * ============================================================ */
    //@Deprecated
    //List<Employee> findByClientId(Long clientId);
}
