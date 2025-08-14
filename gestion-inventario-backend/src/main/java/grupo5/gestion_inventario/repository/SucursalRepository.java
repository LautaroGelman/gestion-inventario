// backend/src/main/java/grupo5/gestion_inventario/repository/SucursalRepository.java
package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.model.Sucursal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SucursalRepository extends JpaRepository<Sucursal, Long> {
    List<Sucursal> findByClientId(Long clientId);
}
