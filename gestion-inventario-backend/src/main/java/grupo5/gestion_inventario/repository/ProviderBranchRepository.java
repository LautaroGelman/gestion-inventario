// backend/src/main/java/grupo5/gestion_inventario/repository/ProviderBranchRepository.java
package grupo5.gestion_inventario.repository;

import grupo5.gestion_inventario.clientpanel.model.ProviderBranch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProviderBranchRepository extends JpaRepository<ProviderBranch, Long> {
    List<ProviderBranch> findBySucursalId(Long sucursalId);
    boolean existsByProviderIdAndSucursalId(Long providerId, Long sucursalId);

    // ⬅️ nuevo: para chequear activo/desactivo
    Optional<ProviderBranch> findByProviderIdAndSucursalId(Long providerId, Long sucursalId);

    void deleteByProviderIdAndSucursalId(Long providerId, Long sucursalId);
}
